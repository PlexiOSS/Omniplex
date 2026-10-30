package omniplex

import (
	"encoding/json"
	"time"
)

type PresenceStatus string

const (
	StatusOnline  PresenceStatus = "online"
	StatusIdle    PresenceStatus = "idle"
	StatusDND     PresenceStatus = "dnd"
	StatusOffline PresenceStatus = "offline"
)

type BotStats struct {
	Servers   *int           `json:"servers,omitempty"`
	Shards    *int           `json:"shards,omitempty"`
	Users     *int           `json:"users,omitempty"`
	ShardList []int          `json:"shard_list,omitempty"`
	Status    PresenceStatus `json:"status,omitempty"`
}

type ServerStats struct {
	TotalMembers  *int `json:"total_members,omitempty"`
	OnlineMembers *int `json:"online_members,omitempty"`
}

func Int(v int) *int {
	return &v
}

type Vote struct {
	ITag         *string   `json:"itag"`
	TargetType   string    `json:"target_type"`
	TargetID     string    `json:"target_id"`
	Author       string    `json:"author"`
	Upvote       bool      `json:"upvote"`
	Void         bool      `json:"void"`
	VoidReason   *string   `json:"void_reason"`
	VoidedAt     *string   `json:"voided_at"`
	CreatedAt    time.Time `json:"created_at"`
	VoteNum      int       `json:"vote_num"`
	CreditRedeem *string   `json:"credit_redeem"`
	Immutable    bool      `json:"immutable"`
	Auto         bool      `json:"auto"`
}

type VoteInfo struct {
	PerUser                          int  `json:"per_user"`
	VoteTime                         int  `json:"vote_time"`
	VoteCredits                      bool `json:"vote_credits"`
	MultipleVotes                    bool `json:"multiple_votes"`
	SupportsUpvotes                  bool `json:"supports_upvotes"`
	SupportsDownvotes                bool `json:"supports_downvotes"`
	SupportsPartialVoteCreditsRedeem bool `json:"supports_partial_vote_credits_redeem"`
	WeekendBonus                     bool `json:"weekend_bonus"`
}

type VoteWait struct {
	Hours   int `json:"hours"`
	Minutes int `json:"minutes"`
	Seconds int `json:"seconds"`
}

func (w VoteWait) Duration() time.Duration {
	return time.Duration(w.Hours)*time.Hour + time.Duration(w.Minutes)*time.Minute + time.Duration(w.Seconds)*time.Second
}

type UserVote struct {
	HasVoted   bool      `json:"has_voted"`
	ValidVotes []Vote    `json:"valid_votes"`
	VoteInfo   *VoteInfo `json:"vote_info"`
	Wait       *VoteWait `json:"wait"`
}

type PlatformUser struct {
	ID          string         `json:"id"`
	Username    string         `json:"username"`
	DisplayName string         `json:"display_name"`
	Avatar      string         `json:"avatar"`
	Bot         bool           `json:"bot"`
	Status      string         `json:"status"`
	Flags       []string       `json:"flags"`
	ExtraData   map[string]any `json:"extra_data"`
}

type Link struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type Changeset[T any] struct {
	Old T `json:"old"`
	New T `json:"new"`
}

type NewVoteData struct {
	Votes    int  `json:"votes"`
	PerUser  int  `json:"per_user"`
	Downvote bool `json:"downvote"`
	Auto     bool `json:"auto"`
}

type NewReviewData struct {
	ReviewID    string `json:"review_id"`
	Content     string `json:"content"`
	Stars       int    `json:"stars"`
	OwnerReview bool   `json:"owner_review"`
}

type EditReviewData struct {
	ReviewID    string            `json:"review_id"`
	Stars       Changeset[int]    `json:"stars"`
	Content     Changeset[string] `json:"content"`
	OwnerReview bool              `json:"owner_review"`
}

type DeleteReviewData struct {
	ReviewID    string `json:"review_id"`
	Content     string `json:"content"`
	Stars       int    `json:"stars"`
	OwnerReview bool   `json:"owner_review"`
}

type TeamEditData struct {
	Name       Changeset[string]   `json:"name"`
	Short      Changeset[string]   `json:"short"`
	Tags       Changeset[[]string] `json:"tags"`
	ExtraLinks Changeset[[]Link]   `json:"extra_links"`
	NSFW       Changeset[bool]     `json:"nsfw"`
}

type WebhookTargets struct {
	Bot    *PlatformUser   `json:"bot,omitempty"`
	Server json.RawMessage `json:"server,omitempty"`
	Team   json.RawMessage `json:"team,omitempty"`
}

type WebhookMetadata struct {
	CreatedAt int64 `json:"created_at"`
	Test      bool  `json:"test"`
}

const (
	EventNewVote      = "NEW_VOTE"
	EventNewReview    = "NEW_REVIEW"
	EventEditReview   = "EDIT_REVIEW"
	EventDeleteReview = "DELETE_REVIEW"
	EventTeamEdit     = "TEAM_EDIT"
)

type WebhookEvent struct {
	Type     string
	Data     any
	RawData  json.RawMessage
	Creator  *PlatformUser
	Targets  WebhookTargets
	Metadata WebhookMetadata
}

func (e *WebhookEvent) UnmarshalJSON(b []byte) error {
	var raw struct {
		Type     string          `json:"type"`
		Data     json.RawMessage `json:"data"`
		Creator  *PlatformUser   `json:"creator"`
		Targets  WebhookTargets  `json:"targets"`
		Metadata WebhookMetadata `json:"metadata"`
	}
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}

	var data any
	switch raw.Type {
	case EventNewVote:
		data = &NewVoteData{}
	case EventNewReview:
		data = &NewReviewData{}
	case EventEditReview:
		data = &EditReviewData{}
	case EventDeleteReview:
		data = &DeleteReviewData{}
	case EventTeamEdit:
		data = &TeamEditData{}
	}
	if data != nil && len(raw.Data) > 0 {
		if err := json.Unmarshal(raw.Data, data); err != nil {
			return err
		}
	}

	*e = WebhookEvent{
		Type:     raw.Type,
		Data:     data,
		RawData:  raw.Data,
		Creator:  raw.Creator,
		Targets:  raw.Targets,
		Metadata: raw.Metadata,
	}
	return nil
}
