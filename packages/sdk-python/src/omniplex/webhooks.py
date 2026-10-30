from __future__ import annotations

import hashlib
import hmac
import json
from collections.abc import Mapping
from typing import Any, cast

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .errors import WebhookVerificationError
from .types import WebhookEvent

_NONCE_SIZE = 12
_TAG_SIZE = 16


def _header(headers: Mapping[str, Any], name: str) -> str | None:
    wanted = name.lower()
    for key, value in headers.items():
        if str(key).lower() == wanted:
            if isinstance(value, (list, tuple)):
                value = value[0] if value else None
            return None if value is None else str(value)
    return None


def _hmac_hex(digest: str, key: str, data: bytes) -> str:
    return hmac.new(key.encode(), data, digest).hexdigest()


def _open_splashtail(body: bytes, secret: str, nonce: str) -> bytes:
    key = hashlib.sha256((secret + nonce).encode()).digest()
    try:
        sealed = bytes.fromhex(body.decode("ascii").strip())
    except (UnicodeDecodeError, ValueError) as exc:
        raise WebhookVerificationError("The webhook body isn't valid hex.") from exc
    if len(sealed) < _NONCE_SIZE + _TAG_SIZE:
        raise WebhookVerificationError("The webhook body is too short.")
    try:
        return AESGCM(key).decrypt(sealed[:_NONCE_SIZE], sealed[_NONCE_SIZE:], None)
    except InvalidTag as exc:
        raise WebhookVerificationError(
            "The webhook body couldn't be decrypted."
        ) from exc


def verify_webhook(
    body: bytes | bytearray | str, headers: Mapping[str, Any], secret: str
) -> WebhookEvent:
    if not secret:
        raise WebhookVerificationError("A webhook secret is required.")

    raw = body.encode() if isinstance(body, str) else bytes(body)
    protocol = _header(headers, "x-webhook-protocol")

    if protocol == "hmac-sha256":
        given = (_header(headers, "x-webhook-signature") or "").lower()
        expected = "sha256=" + _hmac_hex("sha256", secret, raw)
        if not hmac.compare_digest(given, expected):
            raise WebhookVerificationError("The webhook signature doesn't match.")
        payload = raw
    elif protocol == "simple-auth":
        given = _header(headers, "authorization") or ""
        if not hmac.compare_digest(given.encode(), secret.encode()):
            raise WebhookVerificationError("The webhook secret doesn't match.")
        payload = raw
    elif protocol == "splashtail":
        given = (_header(headers, "x-webhook-signature") or "").lower()
        nonce = _header(headers, "x-webhook-nonce") or ""
        if not nonce:
            raise WebhookVerificationError("The webhook nonce is missing.")
        inner = _hmac_hex("sha512", secret, raw)
        expected = _hmac_hex("sha512", nonce, inner.encode())
        if not hmac.compare_digest(given, expected):
            raise WebhookVerificationError("The webhook signature doesn't match.")
        payload = _open_splashtail(raw, secret, nonce)
    elif protocol:
        raise WebhookVerificationError(f'Unsupported webhook protocol "{protocol}".')
    else:
        raise WebhookVerificationError("The X-Webhook-Protocol header is missing.")

    return cast(WebhookEvent, json.loads(payload))
