package omniplex

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const DefaultBaseURL = "https://api.omniplex.gg"

const (
	maxRetryWait         = 60 * time.Second
	minAutoPostEvery     = time.Minute
	defaultAutoPostEvery = 30 * time.Minute
)

type Client struct {
	baseURL    string
	token      string
	http       *http.Client
	maxRetries int
	userAgent  string
}

func (c *Client) String() string {
	token := "none"
	if c.token != "" {
		token = "[redacted]"
	}
	return fmt.Sprintf("omniplex.Client{baseURL: %q, token: %s, maxRetries: %d}", c.baseURL, token, c.maxRetries)
}

func (c *Client) GoString() string {
	return c.String()
}

type Option func(*Client)

func WithBaseURL(baseURL string) Option {
	return func(c *Client) { c.baseURL = strings.TrimRight(baseURL, "/") }
}

func WithHTTPClient(hc *http.Client) Option {
	return func(c *Client) { c.http = hc }
}

func WithMaxRetries(n int) Option {
	return func(c *Client) {
		if n < 0 {
			n = 0
		}
		c.maxRetries = n
	}
}

func WithUserAgent(ua string) Option {
	return func(c *Client) { c.userAgent = ua }
}

func New(token string, opts ...Option) *Client {
	c := &Client{
		baseURL:    DefaultBaseURL,
		token:      token,
		http:       &http.Client{Timeout: 10 * time.Second},
		maxRetries: 2,
		userAgent:  "omniplex-sdk-go (+https://omniplex.gg)",
	}
	for _, opt := range opts {
		opt(c)
	}
	return c
}

func backoff(attempt int) time.Duration {
	d := 500 * time.Millisecond << attempt
	if d > 8*time.Second || d <= 0 {
		return 8 * time.Second
	}
	return d
}

func sleep(ctx context.Context, d time.Duration) error {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-t.C:
		return nil
	}
}

func (c *Client) Do(ctx context.Context, method, path string, body any, auth bool, out any) error {
	var payload []byte
	if body != nil {
		var err error
		if payload, err = json.Marshal(body); err != nil {
			return fmt.Errorf("omniplex: encoding request body: %w", err)
		}
	}
	if auth && c.token == "" {
		return ErrMissingToken
	}

	target, err := c.resolve(path)
	if err != nil {
		return err
	}

	for attempt := 0; ; attempt++ {
		canRetry := attempt < c.maxRetries

		req, err := http.NewRequestWithContext(ctx, method, target, bytes.NewReader(payload))
		if err != nil {
			return fmt.Errorf("omniplex: building request: %w", err)
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", c.userAgent)
		if payload != nil {
			req.Header.Set("Content-Type", "application/json")
		}
		if auth {
			req.Header.Set("Authorization", c.token)
		}

		res, err := c.http.Do(req)
		if err != nil {
			if method == http.MethodGet && canRetry && ctx.Err() == nil {
				if err := sleep(ctx, backoff(attempt)); err != nil {
					return err
				}
				continue
			}
			return fmt.Errorf("omniplex: request to %s failed: %w", path, err)
		}

		if res.StatusCode == http.StatusTooManyRequests && canRetry {
			wait := retryAfter(res.Header)
			if wait == 0 {
				wait = backoff(attempt)
			}
			if wait <= maxRetryWait {
				drain(res)
				if err := sleep(ctx, wait); err != nil {
					return err
				}
				continue
			}
		}

		if res.StatusCode >= 500 && method == http.MethodGet && canRetry {
			drain(res)
			if err := sleep(ctx, backoff(attempt)); err != nil {
				return err
			}
			continue
		}

		if res.StatusCode < 200 || res.StatusCode >= 300 {
			apiErr := apiErrorFromResponse(res)
			res.Body.Close()
			return apiErr
		}

		defer res.Body.Close()
		if out == nil || res.StatusCode == http.StatusNoContent {
			drain(res)
			return nil
		}
		if err := json.NewDecoder(res.Body).Decode(out); err != nil && !errors.Is(err, io.EOF) {
			return fmt.Errorf("omniplex: decoding response from %s: %w", path, err)
		}
		return nil
	}
}

func (c *Client) resolve(path string) (string, error) {
	if !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") || strings.ContainsRune(path, '\\') {
		return "", fmt.Errorf("omniplex: request path %q must start with a single / and stay on the API host", path)
	}
	base, err := url.Parse(c.baseURL)
	if err != nil {
		return "", fmt.Errorf("omniplex: invalid base URL: %w", err)
	}
	target, err := url.Parse(c.baseURL + path)
	if err != nil {
		return "", fmt.Errorf("omniplex: invalid request path %q: %w", path, err)
	}
	if target.Scheme != base.Scheme || target.Host != base.Host || target.User != nil {
		return "", fmt.Errorf("omniplex: request path %q must stay on the API host", path)
	}
	return target.String(), nil
}

func drain(res *http.Response) {
	io.Copy(io.Discard, io.LimitReader(res.Body, 1<<16))
	res.Body.Close()
}

func listingQuery(includeLong bool) string {
	if includeLong {
		return "?include=long"
	}
	return ""
}

func (c *Client) GetBot(ctx context.Context, id string, includeLong bool) (map[string]any, error) {
	var out map[string]any
	err := c.Do(ctx, http.MethodGet, "/bots/"+url.PathEscape(id)+listingQuery(includeLong), nil, false, &out)
	return out, err
}

func (c *Client) GetServer(ctx context.Context, id string, includeLong bool) (map[string]any, error) {
	var out map[string]any
	err := c.Do(ctx, http.MethodGet, "/servers/"+url.PathEscape(id)+listingQuery(includeLong), nil, false, &out)
	return out, err
}

func (c *Client) GetUser(ctx context.Context, id string) (map[string]any, error) {
	var out map[string]any
	err := c.Do(ctx, http.MethodGet, "/users/"+url.PathEscape(id), nil, false, &out)
	return out, err
}

func (c *Client) GetBotVote(ctx context.Context, botID, userID string) (*UserVote, error) {
	var out UserVote
	err := c.Do(ctx, http.MethodGet, "/users/"+url.PathEscape(userID)+"/bots/"+url.PathEscape(botID)+"/votes", nil, false, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) GetServerVote(ctx context.Context, serverID, userID string) (*UserVote, error) {
	var out UserVote
	err := c.Do(ctx, http.MethodGet, "/users/"+url.PathEscape(userID)+"/servers/"+url.PathEscape(serverID)+"/votes", nil, false, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) HasVoted(ctx context.Context, botID, userID string) (bool, error) {
	v, err := c.GetBotVote(ctx, botID, userID)
	if err != nil {
		return false, err
	}
	return v.HasVoted, nil
}

func (c *Client) HasVotedForServer(ctx context.Context, serverID, userID string) (bool, error) {
	v, err := c.GetServerVote(ctx, serverID, userID)
	if err != nil {
		return false, err
	}
	return v.HasVoted, nil
}

func (c *Client) PostBotStats(ctx context.Context, stats BotStats) error {
	return c.Do(ctx, http.MethodPost, "/bots/stats", stats, true, nil)
}

func (c *Client) PostServerStats(ctx context.Context, stats ServerStats) error {
	return c.Do(ctx, http.MethodPost, "/servers/stats", stats, true, nil)
}

func (c *Client) AutoPostBotStats(ctx context.Context, every time.Duration, getStats func(context.Context) (BotStats, error), onError func(error)) {
	if every == 0 {
		every = defaultAutoPostEvery
	}
	if every < minAutoPostEvery {
		every = minAutoPostEvery
	}

	post := func() {
		stats, err := getStats(ctx)
		if err == nil {
			err = c.PostBotStats(ctx, stats)
		}
		if err != nil && ctx.Err() == nil && onError != nil {
			onError(err)
		}
	}

	post()
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			post()
		}
	}
}
