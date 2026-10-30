use std::time::Duration;

use serde::{Deserialize, Deserializer, Serialize};
use serde_json::{Map, Value};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PresenceStatus {
    Online,
    Idle,
    Dnd,
    Offline,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct BotStats {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub servers: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shards: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub users: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shard_list: Option<Vec<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<PresenceStatus>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct ServerStats {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_members: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub online_members: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Vote {
    pub itag: Option<String>,
    pub target_type: String,
    pub target_id: String,
    pub author: String,
    pub upvote: bool,
    pub void: bool,
    pub void_reason: Option<String>,
    pub voided_at: Option<String>,
    pub created_at: String,
    pub vote_num: u32,
    pub credit_redeem: Option<String>,
    pub immutable: bool,
    pub auto: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(default)]
pub struct VoteInfo {
    pub per_user: u32,
    pub vote_time: u32,
    pub vote_credits: bool,
    pub multiple_votes: bool,
    pub supports_upvotes: bool,
    pub supports_downvotes: bool,
    pub supports_partial_vote_credits_redeem: bool,
    pub weekend_bonus: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub struct VoteWait {
    pub hours: u64,
    pub minutes: u64,
    pub seconds: u64,
}

impl VoteWait {
    pub fn duration(&self) -> Duration {
        Duration::from_secs(self.hours * 3600 + self.minutes * 60 + self.seconds)
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct UserVote {
    pub has_voted: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub valid_votes: Vec<Vote>,
    pub vote_info: Option<VoteInfo>,
    pub wait: Option<VoteWait>,
}

fn null_as_empty<'de, D, T>(d: D) -> Result<Vec<T>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    Ok(Option::<Vec<T>>::deserialize(d)?.unwrap_or_default())
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct PlatformUser {
    pub id: String,
    pub username: String,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub avatar: String,
    #[serde(default)]
    pub bot: bool,
    #[serde(default)]
    pub status: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub flags: Vec<String>,
    #[serde(default)]
    pub extra_data: Map<String, Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Link {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Changeset<T> {
    pub old: T,
    pub new: T,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct NewVoteData {
    pub votes: i64,
    pub per_user: i64,
    pub downvote: bool,
    pub auto: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct NewReviewData {
    pub review_id: String,
    pub content: String,
    pub stars: i32,
    pub owner_review: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct EditReviewData {
    pub review_id: String,
    pub stars: Changeset<i32>,
    pub content: Changeset<String>,
    pub owner_review: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct DeleteReviewData {
    pub review_id: String,
    pub content: String,
    pub stars: i32,
    pub owner_review: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct TeamEditData {
    pub name: Changeset<String>,
    pub short: Changeset<String>,
    pub tags: Changeset<Vec<String>>,
    pub extra_links: Changeset<Vec<Link>>,
    pub nsfw: Changeset<bool>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
pub struct WebhookTargets {
    pub bot: Option<PlatformUser>,
    pub server: Option<Value>,
    pub team: Option<Value>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
pub struct WebhookMetadata {
    #[serde(default)]
    pub created_at: i64,
    #[serde(default)]
    pub test: bool,
}

#[derive(Debug, Clone, PartialEq)]
#[non_exhaustive]
pub enum WebhookEventData {
    NewVote(NewVoteData),
    NewReview(NewReviewData),
    EditReview(EditReviewData),
    DeleteReview(DeleteReviewData),
    TeamEdit(TeamEditData),
    Unknown { kind: String, data: Value },
}

#[derive(Debug, Clone, PartialEq)]
pub struct WebhookEvent {
    pub data: WebhookEventData,
    pub creator: Option<PlatformUser>,
    pub targets: WebhookTargets,
    pub metadata: WebhookMetadata,
}

impl WebhookEvent {
    pub fn kind(&self) -> &str {
        match &self.data {
            WebhookEventData::NewVote(_) => "NEW_VOTE",
            WebhookEventData::NewReview(_) => "NEW_REVIEW",
            WebhookEventData::EditReview(_) => "EDIT_REVIEW",
            WebhookEventData::DeleteReview(_) => "DELETE_REVIEW",
            WebhookEventData::TeamEdit(_) => "TEAM_EDIT",
            WebhookEventData::Unknown { kind, .. } => kind,
        }
    }
}

impl<'de> Deserialize<'de> for WebhookEvent {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        #[derive(Deserialize)]
        struct Raw {
            #[serde(rename = "type")]
            kind: String,
            #[serde(default)]
            data: Value,
            creator: Option<PlatformUser>,
            #[serde(default)]
            targets: WebhookTargets,
            #[serde(default)]
            metadata: WebhookMetadata,
        }

        let raw = Raw::deserialize(d)?;
        let parse = |v: Value| -> Result<WebhookEventData, D::Error> {
            use serde::de::Error as _;
            let typed = match raw.kind.as_str() {
                "NEW_VOTE" => serde_json::from_value(v).map(WebhookEventData::NewVote),
                "NEW_REVIEW" => serde_json::from_value(v).map(WebhookEventData::NewReview),
                "EDIT_REVIEW" => serde_json::from_value(v).map(WebhookEventData::EditReview),
                "DELETE_REVIEW" => serde_json::from_value(v).map(WebhookEventData::DeleteReview),
                "TEAM_EDIT" => serde_json::from_value(v).map(WebhookEventData::TeamEdit),
                _ => {
                    return Ok(WebhookEventData::Unknown {
                        kind: raw.kind.clone(),
                        data: v,
                    });
                }
            };
            typed.map_err(D::Error::custom)
        };

        Ok(WebhookEvent {
            data: parse(raw.data)?,
            creator: raw.creator,
            targets: raw.targets,
            metadata: raw.metadata,
        })
    }
}
