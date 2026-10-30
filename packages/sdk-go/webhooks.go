package omniplex

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"hash"
	"io"
	"net/http"
	"strings"
)

const maxWebhookBody = 1 << 20

func hmacHex(newHash func() hash.Hash, key string, data []byte) string {
	mac := hmac.New(newHash, []byte(key))
	mac.Write(data)
	return hex.EncodeToString(mac.Sum(nil))
}

func equal(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

func openSplashtail(body []byte, secret, nonce string) ([]byte, error) {
	sealed, err := hex.DecodeString(strings.TrimSpace(string(body)))
	if err != nil {
		return nil, &WebhookError{"the webhook body isn't valid hex"}
	}
	if len(sealed) < 12+16 {
		return nil, &WebhookError{"the webhook body is too short"}
	}

	key := sha256.Sum256([]byte(secret + nonce))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, &WebhookError{"the webhook body couldn't be decrypted"}
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, &WebhookError{"the webhook body couldn't be decrypted"}
	}
	plain, err := gcm.Open(nil, sealed[:12], sealed[12:], nil)
	if err != nil {
		return nil, &WebhookError{"the webhook body couldn't be decrypted"}
	}
	return plain, nil
}

func VerifyWebhook(body []byte, header http.Header, secret string) (*WebhookEvent, error) {
	if secret == "" {
		return nil, &WebhookError{"a webhook secret is required"}
	}

	var payload []byte
	switch protocol := header.Get("X-Webhook-Protocol"); protocol {
	case "hmac-sha256":
		expected := "sha256=" + hmacHex(sha256.New, secret, body)
		if !equal(strings.ToLower(header.Get("X-Webhook-Signature")), expected) {
			return nil, &WebhookError{"the webhook signature doesn't match"}
		}
		payload = body
	case "simple-auth":
		if !equal(header.Get("Authorization"), secret) {
			return nil, &WebhookError{"the webhook secret doesn't match"}
		}
		payload = body
	case "splashtail":
		nonce := header.Get("X-Webhook-Nonce")
		if nonce == "" {
			return nil, &WebhookError{"the webhook nonce is missing"}
		}
		inner := hmacHex(sha512.New, secret, body)
		expected := hmacHex(sha512.New, nonce, []byte(inner))
		if !equal(strings.ToLower(header.Get("X-Webhook-Signature")), expected) {
			return nil, &WebhookError{"the webhook signature doesn't match"}
		}
		plain, err := openSplashtail(body, secret, nonce)
		if err != nil {
			return nil, err
		}
		payload = plain
	case "":
		return nil, &WebhookError{"the X-Webhook-Protocol header is missing"}
	default:
		return nil, &WebhookError{"unsupported webhook protocol " + `"` + protocol + `"`}
	}

	var event WebhookEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, &WebhookError{"the webhook payload isn't valid JSON"}
	}
	return &event, nil
}

func VerifyWebhookRequest(r *http.Request, secret string) (*WebhookEvent, error) {
	body, err := io.ReadAll(io.LimitReader(r.Body, maxWebhookBody))
	if err != nil {
		return nil, &WebhookError{"the webhook body couldn't be read"}
	}
	return VerifyWebhook(body, r.Header, secret)
}

func WebhookHandler(secret string, onEvent func(*http.Request, *WebhookEvent) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", http.MethodPost)
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		event, err := VerifyWebhookRequest(r, secret)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if err := onEvent(r, event); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
}
