package omniplex

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var ErrMissingToken = errors.New("omniplex: this request needs an API token; create one under API sessions in your Omniplex dashboard")

var ErrInvalidWebhook = errors.New("omniplex: invalid webhook")

type APIError struct {
	Status     int
	Message    string
	Context    map[string]string
	RetryAfter time.Duration
}

func (e *APIError) Error() string {
	return fmt.Sprintf("omniplex: %d: %s", e.Status, e.Message)
}

type WebhookError struct {
	Reason string
}

func (e *WebhookError) Error() string {
	return "omniplex: " + e.Reason
}

func (e *WebhookError) Unwrap() error {
	return ErrInvalidWebhook
}

func apiErrorFromResponse(res *http.Response) *APIError {
	apiErr := &APIError{
		Status:     res.StatusCode,
		Message:    strings.TrimSpace(fmt.Sprintf("%d %s", res.StatusCode, http.StatusText(res.StatusCode))),
		RetryAfter: retryAfter(res.Header),
	}

	body, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	var parsed struct {
		Message string            `json:"message"`
		Context map[string]string `json:"context"`
	}
	if json.Unmarshal(body, &parsed) == nil {
		if parsed.Message != "" {
			apiErr.Message = parsed.Message
		}
		apiErr.Context = parsed.Context
	}

	return apiErr
}

func retryAfter(h http.Header) time.Duration {
	raw := h.Get("Retry-After")
	if raw == "" {
		return 0
	}
	if seconds, err := strconv.ParseFloat(raw, 64); err == nil {
		if seconds < 0 {
			return 0
		}
		return time.Duration(seconds * float64(time.Second))
	}
	if at, err := http.ParseTime(raw); err == nil {
		if d := time.Until(at); d > 0 {
			return d
		}
	}
	return 0
}
