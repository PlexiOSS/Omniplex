import json
from pathlib import Path

import pytest

from omniplex import WebhookVerificationError, verify_webhook

FIXTURES = json.loads(
    (Path(__file__).parent / "fixtures" / "webhooks.json").read_text()
)
SECRET = FIXTURES["secret"]
EXPECTED = json.loads(FIXTURES["payload"])

HMAC_HEADERS = {
    "X-Webhook-Protocol": "hmac-sha256",
    "X-Webhook-Signature": FIXTURES["hmac"]["signature"],
}
SPLASHTAIL_HEADERS = {
    "X-Webhook-Protocol": "splashtail",
    "X-Webhook-Signature": FIXTURES["splashtail"]["signature"],
    "X-Webhook-Nonce": FIXTURES["splashtail"]["nonce"],
}


def test_hmac_accepts_popplio_signature():
    event = verify_webhook(FIXTURES["hmac"]["body"].encode(), HMAC_HEADERS, SECRET)
    assert event == EXPECTED
    assert event["type"] == "NEW_VOTE"
    assert event["data"]["per_user"] == 2


def test_hmac_headers_are_case_insensitive():
    lower = {k.lower(): v for k, v in HMAC_HEADERS.items()}
    assert verify_webhook(FIXTURES["hmac"]["body"], lower, SECRET) == EXPECTED


def test_hmac_rejects_wrong_secret():
    with pytest.raises(WebhookVerificationError):
        verify_webhook(FIXTURES["hmac"]["body"], HMAC_HEADERS, "not-the-secret")


def test_hmac_rejects_tampered_body():
    body = FIXTURES["hmac"]["body"].replace('"votes":12', '"votes":99')
    with pytest.raises(WebhookVerificationError):
        verify_webhook(body, HMAC_HEADERS, SECRET)


def test_splashtail_decrypts_popplio_payload():
    event = verify_webhook(FIXTURES["splashtail"]["body"], SPLASHTAIL_HEADERS, SECRET)
    assert event == EXPECTED


def test_splashtail_rejects_wrong_secret():
    with pytest.raises(WebhookVerificationError):
        verify_webhook(FIXTURES["splashtail"]["body"], SPLASHTAIL_HEADERS, "nope")


def test_splashtail_rejects_missing_nonce():
    headers = {k: v for k, v in SPLASHTAIL_HEADERS.items() if k != "X-Webhook-Nonce"}
    with pytest.raises(WebhookVerificationError):
        verify_webhook(FIXTURES["splashtail"]["body"], headers, SECRET)


def test_simple_auth():
    headers = {"X-Webhook-Protocol": "simple-auth", "Authorization": SECRET}
    assert verify_webhook(FIXTURES["payload"], headers, SECRET) == EXPECTED
    with pytest.raises(WebhookVerificationError):
        verify_webhook(FIXTURES["payload"], {**headers, "Authorization": "x"}, SECRET)


def test_rejects_missing_protocol():
    with pytest.raises(WebhookVerificationError):
        verify_webhook(FIXTURES["payload"], {}, SECRET)


def test_list_header_values():
    headers = {k: [v] for k, v in HMAC_HEADERS.items()}
    assert verify_webhook(FIXTURES["hmac"]["body"], headers, SECRET) == EXPECTED
