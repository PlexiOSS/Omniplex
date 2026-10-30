from __future__ import annotations

from typing import Any, Generic, Literal, TypedDict, TypeVar

T = TypeVar("T")

PresenceStatus = Literal["online", "idle", "dnd", "offline"]
WebhookProtocol = Literal["hmac-sha256", "splashtail", "simple-auth"]


class PlatformUser(TypedDict):
    id: str
    username: str
    display_name: str
    avatar: str
    bot: bool
    status: PresenceStatus
    extra_data: dict[str, Any]


class VoteInfo(TypedDict):
    per_user: int
    vote_time: int
    vote_credits: bool
    multiple_votes: bool
    supports_upvotes: bool
    supports_downvotes: bool
    supports_partial_vote_credits_redeem: bool
    weekend_bonus: bool


class VoteWait(TypedDict):
    hours: int
    minutes: int
    seconds: int


class UserVote(TypedDict):
    has_voted: bool
    valid_votes: list[dict[str, Any]]
    vote_info: VoteInfo | None
    wait: VoteWait | None


class Changeset(TypedDict, Generic[T]):
    old: T
    new: T


class NewVoteData(TypedDict):
    votes: int
    per_user: int
    downvote: bool
    auto: bool


class NewReviewData(TypedDict):
    review_id: str
    content: str
    stars: int
    owner_review: bool


class EditReviewData(TypedDict):
    review_id: str
    stars: Changeset[int]
    content: Changeset[str]
    owner_review: bool


class DeleteReviewData(TypedDict):
    review_id: str
    content: str
    stars: int
    owner_review: bool


class TeamEditData(TypedDict):
    name: Changeset[str]
    short: Changeset[str]
    tags: Changeset[list[str]]
    extra_links: Changeset[list[dict[str, str]]]
    nsfw: Changeset[bool]


class WebhookTargets(TypedDict, total=False):
    bot: PlatformUser
    server: dict[str, Any]
    team: dict[str, Any]


class WebhookMetadata(TypedDict):
    created_at: int
    test: bool


class _EventBase(TypedDict):
    creator: PlatformUser | None
    targets: WebhookTargets
    metadata: WebhookMetadata


class NewVoteEvent(_EventBase):
    type: Literal["NEW_VOTE"]
    data: NewVoteData


class NewReviewEvent(_EventBase):
    type: Literal["NEW_REVIEW"]
    data: NewReviewData


class EditReviewEvent(_EventBase):
    type: Literal["EDIT_REVIEW"]
    data: EditReviewData


class DeleteReviewEvent(_EventBase):
    type: Literal["DELETE_REVIEW"]
    data: DeleteReviewData


class TeamEditEvent(_EventBase):
    type: Literal["TEAM_EDIT"]
    data: TeamEditData


WebhookEvent = (
    NewVoteEvent | NewReviewEvent | EditReviewEvent | DeleteReviewEvent | TeamEditEvent
)
