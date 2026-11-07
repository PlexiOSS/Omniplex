"use client";

import { servers } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import { Button } from "@omniplex/ui/Button";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { FormMessage, SettingsCard } from "../../manage/ManageShell";

export function VoteMessagesSection({
  serverId,
  token,
}: {
  serverId: string;
  token: string;
}) {
  const { data, error, mutate } = useSWR(
    ["manage/server/vote-channel", serverId],
    () => servers.getVoteChannel(serverId, token),
  );
  const [channel, setChannel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setChannel(data.channel_id ?? "");
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setSaveError(null);
    try {
      await servers.setVoteChannel(serverId, channel || null, token);
      await mutate();
      setMessage(
        channel
          ? "Saved. A test message was posted in the channel."
          : "Vote messages are off.",
      );
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Couldn't save vote messages.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load vote messages.
      </p>
    );
  }
  if (!data) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }

  const current = data.channels.find((c) => c.id === data.channel_id);
  const missing = data.channel_id && data.available && !current;

  return (
    <form onSubmit={save}>
      <SettingsCard
        title="Vote messages"
        description="The Infernoplex bot posts a message in your server each time someone votes for it on Omniplex."
        footer={
          <>
            <FormMessage error={saveError} success={message} />
            <Button
              type="submit"
              loading={saving}
              disabled={!data.available || channel === (data.channel_id ?? "")}
            >
              Save
            </Button>
          </>
        }
      >
        {data.available ? (
          <div className="space-y-2">
            <select
              aria-label="Vote message channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Off</option>
              {data.channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
            {missing && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                The channel vote messages were posted in no longer exists. Pick
                another one.
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The bot needs to be able to view the channel, send messages and
              embed links.
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The Infernoplex bot isn&apos;t in this server, so it can&apos;t post
            vote messages. Add it to your server, then come back here.
          </p>
        )}
      </SettingsCard>
    </form>
  );
}
