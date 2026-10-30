package omniplex

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

type recorded struct {
	method, path, auth string
	body               map[string]any
}

func server(t *testing.T, handler func(w http.ResponseWriter, r *http.Request, n int)) (*Client, func() []recorded) {
	t.Helper()
	var mu sync.Mutex
	var calls []recorded
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := recorded{method: r.Method, path: r.URL.RequestURI(), auth: r.Header.Get("Authorization")}
		if b, _ := io.ReadAll(r.Body); len(b) > 0 {
			json.Unmarshal(b, &rec.body)
		}
		mu.Lock()
		calls = append(calls, rec)
		n := len(calls)
		mu.Unlock()
		handler(w, r, n)
	}))
	t.Cleanup(srv.Close)
	snapshot := func() []recorded {
		mu.Lock()
		defer mu.Unlock()
		return append([]recorded(nil), calls...)
	}
	return New("tok", WithBaseURL(srv.URL+"/")), snapshot
}

func TestPostBotStatsSendsTokenAndSnakeCase(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		w.WriteHeader(http.StatusNoContent)
	})
	err := c.PostBotStats(context.Background(), BotStats{Servers: Int(213), Shards: Int(1), ShardList: []int{0}, Status: StatusOnline})
	if err != nil {
		t.Fatal(err)
	}
	got := calls()[0]
	if got.method != "POST" || got.path != "/bots/stats" || got.auth != "tok" {
		t.Fatalf("unexpected request %+v", got)
	}
	want := map[string]any{"servers": 213.0, "shards": 1.0, "shard_list": []any{0.0}, "status": "online"}
	if len(got.body) != len(want) {
		t.Fatalf("body = %v, want %v", got.body, want)
	}
	for k, v := range want {
		if gb, _ := json.Marshal(got.body[k]); string(gb) != mustJSON(v) {
			t.Fatalf("body[%s] = %v, want %v", k, got.body[k], v)
		}
	}
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func TestPostServerStats(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		w.WriteHeader(http.StatusNoContent)
	})
	if err := c.PostServerStats(context.Background(), ServerStats{TotalMembers: Int(120), OnlineMembers: Int(40)}); err != nil {
		t.Fatal(err)
	}
	got := calls()[0]
	if got.path != "/servers/stats" || got.body["total_members"] != 120.0 || got.body["online_members"] != 40.0 {
		t.Fatalf("unexpected request %+v", got)
	}
}

func TestPostingWithoutTokenFailsBeforeRequest(t *testing.T) {
	_, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {})
	err := New("").PostBotStats(context.Background(), BotStats{Servers: Int(1)})
	if !errors.Is(err, ErrMissingToken) {
		t.Fatalf("err = %v, want ErrMissingToken", err)
	}
	if len(calls()) != 0 {
		t.Fatal("a request was made")
	}
}

func TestHasVotedUsesPublicEndpoint(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		io.WriteString(w, `{"has_voted":true,"valid_votes":[{"itag":"0b6a9c2e-0000-0000-0000-000000000000","target_type":"bot","target_id":"111","author":"222","upvote":true,"void":false,"void_reason":null,"voided_at":null,"created_at":"2026-10-29T12:00:00Z","vote_num":1,"credit_redeem":null,"immutable":false,"auto":false}],"vote_info":{"per_user":1,"vote_time":12},"wait":{"hours":11,"minutes":59,"seconds":3}}`)
	})
	vote, err := c.GetBotVote(context.Background(), "111", "222")
	if err != nil {
		t.Fatal(err)
	}
	if !vote.HasVoted || vote.ValidVotes[0].Author != "222" || !vote.ValidVotes[0].Upvote {
		t.Fatalf("unexpected vote %+v", vote)
	}
	if vote.Wait.Duration() != 11*time.Hour+59*time.Minute+3*time.Second {
		t.Fatalf("wait = %v", vote.Wait.Duration())
	}
	if calls()[0].path != "/users/222/bots/111/votes" || calls()[0].auth != "" {
		t.Fatalf("unexpected request %+v", calls()[0])
	}
}

func TestAPIErrorCarriesStatusMessageContext(t *testing.T) {
	c, _ := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		w.WriteHeader(http.StatusBadRequest)
		io.WriteString(w, `{"message":"Status must be one of online, idle, dnd or offline","context":{"status":"oneof"}}`)
	})
	err := c.PostBotStats(context.Background(), BotStats{Servers: Int(1)})
	var apiErr *APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("err = %v, want *APIError", err)
	}
	if apiErr.Status != 400 || apiErr.Message != "Status must be one of online, idle, dnd or offline" || apiErr.Context["status"] != "oneof" {
		t.Fatalf("unexpected error %+v", apiErr)
	}
}

func TestRetriesAfter429(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		if n == 1 {
			w.Header().Set("Retry-After", "0")
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
	if err := c.PostBotStats(context.Background(), BotStats{Servers: Int(5)}); err != nil {
		t.Fatal(err)
	}
	if len(calls()) != 2 {
		t.Fatalf("calls = %d, want 2", len(calls()))
	}
}

func TestRetriesGetsOnServerErrorsButNotPosts(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		if r.Method == "GET" && n > 1 {
			io.WriteString(w, `{"id":"1"}`)
			return
		}
		w.WriteHeader(http.StatusServiceUnavailable)
	})
	if _, err := c.GetUser(context.Background(), "1"); err != nil {
		t.Fatal(err)
	}
	if len(calls()) != 2 {
		t.Fatalf("GET calls = %d, want 2", len(calls()))
	}
	err := c.PostBotStats(context.Background(), BotStats{Servers: Int(1)})
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Status != 503 || len(calls()) != 3 {
		t.Fatalf("err = %v, calls = %d", err, len(calls()))
	}
}

func TestTrailingSlashesAreTrimmedQuickly(t *testing.T) {
	start := time.Now()
	c := New("", WithBaseURL("https://api.example"+strings.Repeat("/", 100_000)))
	if time.Since(start) > 100*time.Millisecond || c.baseURL != "https://api.example" {
		t.Fatalf("baseURL = %q", c.baseURL[:30])
	}
}

func TestAutoPostPostsImmediatelyAndStopsWithContext(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		w.WriteHeader(http.StatusNoContent)
	})
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		c.AutoPostBotStats(ctx, time.Hour, func(context.Context) (BotStats, error) {
			return BotStats{Servers: Int(7)}, nil
		}, nil)
		close(done)
	}()
	deadline := time.Now().Add(2 * time.Second)
	for len(calls()) == 0 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("AutoPostBotStats didn't stop")
	}
	if len(calls()) != 1 || calls()[0].body["servers"] != 7.0 {
		t.Fatalf("calls = %+v", calls())
	}
}

func TestPrintingTheClientNeverShowsTheToken(t *testing.T) {
	c := New("super-secret-token")
	for _, printed := range []string{fmt.Sprint(c), fmt.Sprintf("%v", c), fmt.Sprintf("%+v", c), fmt.Sprintf("%#v", c)} {
		if strings.Contains(printed, "super-secret-token") || !strings.Contains(printed, "[redacted]") {
			t.Fatalf("printed %q", printed)
		}
	}
}

func TestDoRefusesPathsThatLeaveTheAPIHost(t *testing.T) {
	c, calls := server(t, func(w http.ResponseWriter, r *http.Request, n int) {
		w.WriteHeader(http.StatusNoContent)
	})
	for _, path := range []string{"@attacker.example/", "attacker.example/x", "//attacker.example/x", "/\\attacker.example", ""} {
		if err := c.Do(context.Background(), http.MethodPost, path, nil, true, nil); err == nil {
			t.Fatalf("Do(%q) was allowed", path)
		}
	}
	if len(calls()) != 0 {
		t.Fatalf("a request was sent: %+v", calls())
	}
	for _, path := range []string{"/users/1?x=y", "/bots/@all", "/users/1/bots/2@x/votes"} {
		if err := c.Do(context.Background(), http.MethodGet, path, nil, false, nil); err != nil {
			t.Fatalf("Do(%q) failed: %v", path, err)
		}
	}
	for _, got := range calls() {
		if !strings.HasPrefix(got.path, "/") {
			t.Fatalf("unexpected request path %q", got.path)
		}
	}
}
