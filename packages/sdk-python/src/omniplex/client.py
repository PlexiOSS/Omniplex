from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any, cast
from urllib.parse import quote

import httpx

from .errors import OmniplexError, retry_after_seconds
from .types import PresenceStatus, UserVote

DEFAULT_BASE_URL = "https://api.omniplex.gg"
USER_AGENT = "omniplex-sdk-python (+https://omniplex.gg)"
MAX_RETRY_WAIT = 60.0
MIN_AUTOPOST_INTERVAL = 60.0

log = logging.getLogger("omniplex")

BotStatsGetter = Callable[[], "dict[str, Any] | Awaitable[dict[str, Any]]"]


def _seg(value: str) -> str:
    return quote(str(value), safe="")


def _backoff(attempt: int) -> float:
    return min(0.5 * 2.0**attempt, 8.0)


def _bot_stats_body(
    servers: int | None,
    shards: int | None,
    users: int | None,
    shard_list: list[int] | None,
    status: PresenceStatus | None,
) -> dict[str, Any]:
    body = {
        "servers": servers,
        "shards": shards,
        "users": users,
        "shard_list": shard_list,
        "status": status,
    }
    return {k: v for k, v in body.items() if v is not None}


def _server_stats_body(
    total_members: int | None, online_members: int | None
) -> dict[str, Any]:
    body = {"total_members": total_members, "online_members": online_members}
    return {k: v for k, v in body.items() if v is not None}


def _missing_token() -> OmniplexError:
    return OmniplexError(
        0,
        "This request needs an API token. Create one under API sessions in your "
        "Omniplex dashboard and pass it as `token`.",
    )


def _decode(response: httpx.Response) -> Any:
    if not response.content:
        return None
    return response.json()


class _Base:
    def __init__(
        self,
        token: str | None,
        base_url: str,
        max_retries: int,
        user_agent: str | None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._token = token
        self._max_retries = max(0, max_retries)
        self._headers = {
            "Accept": "application/json",
            "User-Agent": user_agent or USER_AGENT,
        }

    def _request_headers(self, auth: bool) -> dict[str, str]:
        headers = dict(self._headers)
        if auth:
            if not self._token:
                raise _missing_token()
            headers["Authorization"] = self._token
        return headers

    def _retry_delay(
        self, method: str, response: httpx.Response, attempt: int
    ) -> float | None:
        if attempt >= self._max_retries:
            return None
        if response.status_code == 429:
            wait = retry_after_seconds(response)
            wait = _backoff(attempt) if wait is None else wait
            return wait if wait <= MAX_RETRY_WAIT else None
        if response.status_code >= 500 and method == "GET":
            return _backoff(attempt)
        return None


class Omniplex(_Base):
    def __init__(
        self,
        token: str | None = None,
        *,
        base_url: str = DEFAULT_BASE_URL,
        max_retries: int = 2,
        timeout: float = 10.0,
        user_agent: str | None = None,
        http_client: httpx.Client | None = None,
    ) -> None:
        super().__init__(token, base_url, max_retries, user_agent)
        self._owns_client = http_client is None
        self._http = http_client or httpx.Client(timeout=timeout)

    def __enter__(self) -> Omniplex:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def close(self) -> None:
        if self._owns_client:
            self._http.close()

    def request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        auth: bool = False,
    ) -> Any:
        headers = self._request_headers(auth)
        url = f"{self.base_url}{path}"
        attempt = 0
        while True:
            try:
                response = self._http.request(method, url, json=json, headers=headers)
            except httpx.TransportError as exc:
                if method == "GET" and attempt < self._max_retries:
                    time.sleep(_backoff(attempt))
                    attempt += 1
                    continue
                raise OmniplexError(0, f"Request to {path} failed: {exc}") from exc
            delay = self._retry_delay(method, response, attempt)
            if delay is not None:
                time.sleep(delay)
                attempt += 1
                continue
            if response.is_error:
                raise OmniplexError.from_response(response)
            return _decode(response)

    def get_bot(self, bot_id: str, *, include_long: bool = False) -> dict[str, Any]:
        query = "?include=long" if include_long else ""
        return cast(
            "dict[str, Any]", self.request("GET", f"/bots/{_seg(bot_id)}{query}")
        )

    def get_server(
        self, server_id: str, *, include_long: bool = False
    ) -> dict[str, Any]:
        query = "?include=long" if include_long else ""
        return cast(
            "dict[str, Any]", self.request("GET", f"/servers/{_seg(server_id)}{query}")
        )

    def get_user(self, user_id: str) -> dict[str, Any]:
        return cast("dict[str, Any]", self.request("GET", f"/users/{_seg(user_id)}"))

    def get_bot_vote(self, bot_id: str, user_id: str) -> UserVote:
        return cast(
            UserVote,
            self.request("GET", f"/users/{_seg(user_id)}/bots/{_seg(bot_id)}/votes"),
        )

    def get_server_vote(self, server_id: str, user_id: str) -> UserVote:
        return cast(
            UserVote,
            self.request(
                "GET", f"/users/{_seg(user_id)}/servers/{_seg(server_id)}/votes"
            ),
        )

    def has_voted(self, bot_id: str, user_id: str) -> bool:
        return bool(self.get_bot_vote(bot_id, user_id)["has_voted"])

    def has_voted_for_server(self, server_id: str, user_id: str) -> bool:
        return bool(self.get_server_vote(server_id, user_id)["has_voted"])

    def post_bot_stats(
        self,
        *,
        servers: int | None = None,
        shards: int | None = None,
        users: int | None = None,
        shard_list: list[int] | None = None,
        status: PresenceStatus | None = None,
    ) -> None:
        self.request(
            "POST",
            "/bots/stats",
            json=_bot_stats_body(servers, shards, users, shard_list, status),
            auth=True,
        )

    def post_server_stats(
        self, *, total_members: int | None = None, online_members: int | None = None
    ) -> None:
        self.request(
            "POST",
            "/servers/stats",
            json=_server_stats_body(total_members, online_members),
            auth=True,
        )


class AsyncOmniplex(_Base):
    def __init__(
        self,
        token: str | None = None,
        *,
        base_url: str = DEFAULT_BASE_URL,
        max_retries: int = 2,
        timeout: float = 10.0,
        user_agent: str | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__(token, base_url, max_retries, user_agent)
        self._owns_client = http_client is None
        self._http = http_client or httpx.AsyncClient(timeout=timeout)

    async def __aenter__(self) -> AsyncOmniplex:
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._http.aclose()

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        auth: bool = False,
    ) -> Any:
        headers = self._request_headers(auth)
        url = f"{self.base_url}{path}"
        attempt = 0
        while True:
            try:
                response = await self._http.request(
                    method, url, json=json, headers=headers
                )
            except httpx.TransportError as exc:
                if method == "GET" and attempt < self._max_retries:
                    await asyncio.sleep(_backoff(attempt))
                    attempt += 1
                    continue
                raise OmniplexError(0, f"Request to {path} failed: {exc}") from exc
            delay = self._retry_delay(method, response, attempt)
            if delay is not None:
                await asyncio.sleep(delay)
                attempt += 1
                continue
            if response.is_error:
                raise OmniplexError.from_response(response)
            return _decode(response)

    async def get_bot(
        self, bot_id: str, *, include_long: bool = False
    ) -> dict[str, Any]:
        query = "?include=long" if include_long else ""
        return cast(
            "dict[str, Any]", await self.request("GET", f"/bots/{_seg(bot_id)}{query}")
        )

    async def get_server(
        self, server_id: str, *, include_long: bool = False
    ) -> dict[str, Any]:
        query = "?include=long" if include_long else ""
        return cast(
            "dict[str, Any]",
            await self.request("GET", f"/servers/{_seg(server_id)}{query}"),
        )

    async def get_user(self, user_id: str) -> dict[str, Any]:
        return cast(
            "dict[str, Any]", await self.request("GET", f"/users/{_seg(user_id)}")
        )

    async def get_bot_vote(self, bot_id: str, user_id: str) -> UserVote:
        return cast(
            UserVote,
            await self.request(
                "GET", f"/users/{_seg(user_id)}/bots/{_seg(bot_id)}/votes"
            ),
        )

    async def get_server_vote(self, server_id: str, user_id: str) -> UserVote:
        return cast(
            UserVote,
            await self.request(
                "GET", f"/users/{_seg(user_id)}/servers/{_seg(server_id)}/votes"
            ),
        )

    async def has_voted(self, bot_id: str, user_id: str) -> bool:
        return bool((await self.get_bot_vote(bot_id, user_id))["has_voted"])

    async def has_voted_for_server(self, server_id: str, user_id: str) -> bool:
        return bool((await self.get_server_vote(server_id, user_id))["has_voted"])

    async def post_bot_stats(
        self,
        *,
        servers: int | None = None,
        shards: int | None = None,
        users: int | None = None,
        shard_list: list[int] | None = None,
        status: PresenceStatus | None = None,
    ) -> None:
        await self.request(
            "POST",
            "/bots/stats",
            json=_bot_stats_body(servers, shards, users, shard_list, status),
            auth=True,
        )

    async def post_server_stats(
        self, *, total_members: int | None = None, online_members: int | None = None
    ) -> None:
        await self.request(
            "POST",
            "/servers/stats",
            json=_server_stats_body(total_members, online_members),
            auth=True,
        )

    def auto_post_bot_stats(
        self,
        get_stats: BotStatsGetter,
        *,
        interval: float = 1800.0,
        on_error: Callable[[BaseException], None] | None = None,
    ) -> asyncio.Task[None]:
        interval = max(MIN_AUTOPOST_INTERVAL, interval)

        async def loop() -> None:
            while True:
                try:
                    stats = get_stats()
                    if asyncio.iscoroutine(stats) or isinstance(stats, Awaitable):
                        stats = await stats
                    await self.post_bot_stats(**cast("dict[str, Any]", stats))
                except asyncio.CancelledError:
                    raise
                except Exception as exc:
                    if on_error:
                        on_error(exc)
                    else:
                        log.exception("Failed to post bot stats to Omniplex")
                await asyncio.sleep(interval)

        return asyncio.get_running_loop().create_task(loop())
