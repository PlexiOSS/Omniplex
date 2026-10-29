from __future__ import annotations

from datetime import UTC, datetime
from email.utils import parsedate_to_datetime

import httpx


class OmniplexError(Exception):
    def __init__(
        self,
        status: int,
        message: str,
        *,
        context: dict[str, str] | None = None,
        retry_after: float | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.message = message
        self.context = context
        self.retry_after = retry_after

    def __repr__(self) -> str:
        return f"OmniplexError(status={self.status!r}, message={self.message!r})"

    @classmethod
    def from_response(cls, response: httpx.Response) -> OmniplexError:
        message = f"{response.status_code} {response.reason_phrase}".strip()
        context = None
        try:
            body = response.json()
        except ValueError:
            body = None
        if isinstance(body, dict):
            if isinstance(body.get("message"), str) and body["message"]:
                message = body["message"]
            if isinstance(body.get("context"), dict):
                context = body["context"]
        return cls(
            response.status_code,
            message,
            context=context,
            retry_after=retry_after_seconds(response),
        )


class WebhookVerificationError(Exception):
    pass


def retry_after_seconds(response: httpx.Response) -> float | None:
    raw = response.headers.get("retry-after")
    if not raw:
        return None
    try:
        return max(0.0, float(raw))
    except ValueError:
        pass
    try:
        when = parsedate_to_datetime(raw)
    except (TypeError, ValueError):
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=UTC)
    return max(0.0, (when - datetime.now(UTC)).total_seconds())
