package omniplex

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

type fixtures struct {
	Secret  string `json:"secret"`
	Payload string `json:"payload"`
	HMAC    struct {
		Body      string `json:"body"`
		Signature string `json:"signature"`
	} `json:"hmac"`
	Splashtail struct {
		Body      string `json:"body"`
		Nonce     string `json:"nonce"`
		Signature string `json:"signature"`
	} `json:"splashtail"`
}

func loadFixtures(t *testing.T) fixtures {
	t.Helper()
	raw, err := os.ReadFile("testdata/webhooks.json")
	if err != nil {
		t.Fatal(err)
	}
	var f fixtures
	if err := json.Unmarshal(raw, &f); err != nil {
		t.Fatal(err)
	}
	return f
}

func wrongSecret(f fixtures) string {
	r := []rune(f.Secret)
	for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r)
}

func headers(kv ...string) http.Header {
	h := http.Header{}
	for i := 0; i < len(kv); i += 2 {
		h.Set(kv[i], kv[i+1])
	}
	return h
}

func checkVote(t *testing.T, e *WebhookEvent) {
	t.Helper()
	data, ok := e.Data.(*NewVoteData)
	if e.Type != EventNewVote || !ok {
		t.Fatalf("event = %+v", e)
	}
	if data.Votes != 12 || data.PerUser != 2 || data.Downvote || data.Auto {
		t.Fatalf("data = %+v", data)
	}
	if e.Creator == nil || e.Creator.ID != "510065483693817867" || e.Targets.Bot == nil || e.Targets.Bot.ID != "1234567890123456789" {
		t.Fatalf("creator/targets = %+v %+v", e.Creator, e.Targets)
	}
	if e.Metadata.CreatedAt != 1761700000 || e.Metadata.Test {
		t.Fatalf("metadata = %+v", e.Metadata)
	}
}

func TestHMACWebhook(t *testing.T) {
	f := loadFixtures(t)
	e, err := VerifyWebhook([]byte(f.HMAC.Body), headers("X-Webhook-Protocol", "hmac-sha256", "X-Webhook-Signature", f.HMAC.Signature), f.Secret)
	if err != nil {
		t.Fatal(err)
	}
	checkVote(t, e)
}

func TestHMACRejectsWrongSecretAndTamperedBody(t *testing.T) {
	f := loadFixtures(t)
	h := headers("X-Webhook-Protocol", "hmac-sha256", "X-Webhook-Signature", f.HMAC.Signature)
	if _, err := VerifyWebhook([]byte(f.HMAC.Body), h, wrongSecret(f)); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("wrong secret: err = %v", err)
	}
	tampered := strings.Replace(f.HMAC.Body, `"votes":12`, `"votes":99`, 1)
	if _, err := VerifyWebhook([]byte(tampered), h, f.Secret); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("tampered: err = %v", err)
	}
}

func TestSplashtailWebhook(t *testing.T) {
	f := loadFixtures(t)
	h := headers("X-Webhook-Protocol", "splashtail", "X-Webhook-Signature", f.Splashtail.Signature, "X-Webhook-Nonce", f.Splashtail.Nonce)
	e, err := VerifyWebhook([]byte(f.Splashtail.Body), h, f.Secret)
	if err != nil {
		t.Fatal(err)
	}
	checkVote(t, e)
	if _, err := VerifyWebhook([]byte(f.Splashtail.Body), h, wrongSecret(f)); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("wrong secret: err = %v", err)
	}
	h.Set("X-Webhook-Nonce", "other")
	if _, err := VerifyWebhook([]byte(f.Splashtail.Body), h, f.Secret); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("wrong nonce: err = %v", err)
	}
}

func TestSimpleAuthWebhook(t *testing.T) {
	f := loadFixtures(t)
	e, err := VerifyWebhook([]byte(f.Payload), headers("X-Webhook-Protocol", "simple-auth", "Authorization", f.Secret), f.Secret)
	if err != nil {
		t.Fatal(err)
	}
	checkVote(t, e)
	if _, err := VerifyWebhook([]byte(f.Payload), headers("X-Webhook-Protocol", "simple-auth", "Authorization", "nope"), f.Secret); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("err = %v", err)
	}
}

func TestMissingAndUnknownProtocol(t *testing.T) {
	f := loadFixtures(t)
	if _, err := VerifyWebhook([]byte(f.Payload), http.Header{}, f.Secret); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("missing: err = %v", err)
	}
	if _, err := VerifyWebhook([]byte(f.Payload), headers("X-Webhook-Protocol", "carrier-pigeon"), f.Secret); !errors.Is(err, ErrInvalidWebhook) {
		t.Fatalf("unknown: err = %v", err)
	}
}

func TestUnknownEventKeepsRawData(t *testing.T) {
	var e WebhookEvent
	if err := json.Unmarshal([]byte(`{"type":"SOMETHING_NEW","data":{"x":1},"creator":null,"targets":{},"metadata":{"created_at":1,"test":true}}`), &e); err != nil {
		t.Fatal(err)
	}
	if e.Type != "SOMETHING_NEW" || e.Data != nil || string(e.RawData) != `{"x":1}` {
		t.Fatalf("event = %+v", e)
	}
}

func TestWebhookHandler(t *testing.T) {
	f := loadFixtures(t)
	var got *WebhookEvent
	h := WebhookHandler(f.Secret, func(r *http.Request, e *WebhookEvent) error {
		got = e
		return nil
	})

	req := httptest.NewRequest("POST", "/omniplex", strings.NewReader(f.HMAC.Body))
	req.Header.Set("X-Webhook-Protocol", "hmac-sha256")
	req.Header.Set("X-Webhook-Signature", f.HMAC.Signature)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent || got == nil {
		t.Fatalf("valid: code = %d", rec.Code)
	}

	req = httptest.NewRequest("POST", "/omniplex", strings.NewReader(f.HMAC.Body))
	req.Header.Set("X-Webhook-Protocol", "hmac-sha256")
	req.Header.Set("X-Webhook-Signature", "sha256=00")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("bad signature: code = %d", rec.Code)
	}

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("GET", "/omniplex", nil))
	if rec.Code != http.StatusMethodNotAllowed || rec.Header().Get("Allow") != "POST" {
		t.Fatalf("GET: code = %d", rec.Code)
	}
}
