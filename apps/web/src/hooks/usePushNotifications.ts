"use client";

// Copyright (C) 2026 NodeByte LTD 

import { useCallback, useEffect, useState } from "react";
import { notifications } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "./useAuth";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { session } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(isSupported);
    if (!isSupported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported || !session) return;
    setBusy(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const { public_key } = await notifications.getInfo();
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key) as BufferSource,
      });

      const json = sub.toJSON();
      if (!json.keys?.auth || !json.keys?.p256dh || !json.endpoint) {
        throw new Error("Browser returned an incomplete push subscription.");
      }

      await notifications.subscribe(session.user_id, session.token, {
        auth: json.keys.auth,
        p256dh: json.keys.p256dh,
        endpoint: json.endpoint,
      });

      setSubscribed(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to enable push notifications.",
      );
    } finally {
      setBusy(false);
    }
  }, [supported, session]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !session) return;
    setBusy(true);
    setError(null);

    try {
      const registration =
        await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await registration?.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        const { notifications: subs } = await notifications.listSubscriptions(
          session.user_id,
          session.token,
        );
        const match = subs.find((s) => s.endpoint === endpoint);
        if (match) {
          await notifications.unsubscribe(
            session.user_id,
            session.token,
            match.notif_id,
          );
        }
      }

      setSubscribed(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to disable push notifications.",
      );
    } finally {
      setBusy(false);
    }
  }, [supported, session]);

  return {
    supported,
    subscribed,
    permission,
    busy,
    error,
    subscribe,
    unsubscribe,
  };
}
