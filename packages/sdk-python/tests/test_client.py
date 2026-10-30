import asyncio
import json

import httpx
import pytest

from omniplex import AsyncOmniplex, Omniplex, OmniplexError


class Recorder:
    def __init__(self, *responses: httpx.Response) -> None:
        self.responses = list(responses)
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.responses.pop(0)


def sync_client(recorder: Recorder, **kwargs) -> Omniplex:
    return Omniplex(
        http_client=httpx.Client(transport=httpx.MockTransport(recorder)), **kwargs
    )


def async_client(recorder: Recorder, **kwargs) -> AsyncOmniplex:
    return AsyncOmniplex(
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(recorder)), **kwargs
    )


def test_post_bot_stats_sends_token_and_drops_unset_fields():
    rec = Recorder(httpx.Response(204))
    sync_client(rec, token="tok").post_bot_stats(
        servers=213, shard_list=[0], status="online"
    )
    req = rec.requests[0]
    assert req.method == "POST"
    assert str(req.url) == "https://api.omniplex.gg/bots/stats"
    assert req.headers["authorization"] == "tok"
    assert json.loads(req.content) == {
        "servers": 213,
        "shard_list": [0],
        "status": "online",
    }


def test_post_server_stats():
    rec = Recorder(httpx.Response(204))
    sync_client(rec, token="tok").post_server_stats(
        total_members=120, online_members=40
    )
    assert str(rec.requests[0].url) == "https://api.omniplex.gg/servers/stats"
    assert json.loads(rec.requests[0].content) == {
        "total_members": 120,
        "online_members": 40,
    }


def test_stats_without_token_fail_before_request():
    rec = Recorder()
    with pytest.raises(OmniplexError):
        sync_client(rec).post_bot_stats(servers=1)
    assert rec.requests == []


def test_has_voted_uses_public_endpoint():
    rec = Recorder(
        httpx.Response(
            200,
            json={
                "has_voted": True,
                "valid_votes": [],
                "vote_info": None,
                "wait": None,
            },
        )
    )
    client = sync_client(rec, base_url="https://api.example/")
    assert client.has_voted("111", "222") is True
    assert str(rec.requests[0].url) == "https://api.example/users/222/bots/111/votes"
    assert "authorization" not in rec.requests[0].headers


def test_api_error_carries_message_and_context():
    rec = Recorder(
        httpx.Response(
            400, json={"message": "bad status", "context": {"status": "oneof"}}
        )
    )
    with pytest.raises(OmniplexError) as info:
        sync_client(rec, token="t", max_retries=0).post_bot_stats(servers=1)
    assert info.value.status == 400
    assert info.value.message == "bad status"
    assert info.value.context == {"status": "oneof"}


def test_retries_after_429():
    rec = Recorder(
        httpx.Response(429, json={"message": "slow"}, headers={"Retry-After": "0"}),
        httpx.Response(204),
    )
    sync_client(rec, token="t").post_bot_stats(servers=5)
    assert len(rec.requests) == 2


def test_retries_get_on_5xx_but_not_post():
    rec = Recorder(httpx.Response(503, json={}), httpx.Response(200, json={"id": "1"}))
    assert sync_client(rec).get_user("1") == {"id": "1"}
    assert len(rec.requests) == 2

    rec = Recorder(httpx.Response(503, json={"message": "down"}))
    with pytest.raises(OmniplexError) as info:
        sync_client(rec, token="t").post_bot_stats(servers=1)
    assert info.value.status == 503
    assert len(rec.requests) == 1


async def test_async_client_posts_and_checks_votes():
    rec = Recorder(
        httpx.Response(204),
        httpx.Response(
            200,
            json={
                "has_voted": False,
                "valid_votes": [],
                "vote_info": None,
                "wait": None,
            },
        ),
    )
    async with async_client(rec, token="tok") as client:
        await client.post_bot_stats(servers=3)
        assert await client.has_voted_for_server("9", "8") is False
    assert str(rec.requests[1].url) == "https://api.omniplex.gg/users/8/servers/9/votes"


async def test_auto_post_posts_immediately_and_cancels():
    rec = Recorder(httpx.Response(204))
    client = async_client(rec, token="tok")

    async def stats():
        return {"servers": 7}

    task = client.auto_post_bot_stats(stats)
    await asyncio.sleep(0.05)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert json.loads(rec.requests[0].content) == {"servers": 7}
    await client.aclose()
