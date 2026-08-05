"use client";

import { useState } from "react";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Link } from "@/lib/api/types";
import type { Partner, PartnerType } from "@/lib/arcadia/types";

interface PartnerEditModalProps {
  loginToken: string;
  partnerTypes: PartnerType[];
  /** Omit for create; pass an existing partner for edit. */
  partner?: Partner;
  onClose: () => void;
  onSaved: () => void;
}

export function PartnerEditModal({
  loginToken,
  partnerTypes,
  partner,
  onClose,
  onSaved,
}: PartnerEditModalProps) {
  const isEdit = !!partner;
  const [id, setId] = useState(partner?.id ?? "");
  const [name, setName] = useState(partner?.name ?? "");
  const [short, setShort] = useState(partner?.short ?? "");
  const [botId, setBotId] = useState(partner?.bot_id ?? "");
  const [userId, setUserId] = useState(partner?.user_id ?? "");
  const [type, setType] = useState(partner?.type ?? partnerTypes[0]?.id ?? "");
  const [links, setLinks] = useState<Link[]>(partner?.links ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!id.trim() || !name.trim() || !userId.trim() || !type) {
      setError("ID, name, owner user ID, and type are required.");
      return;
    }
    if (links.length === 0) {
      setError("At least one link is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        name: name.trim(),
        short: short.trim(),
        bot_id: botId.trim() || null,
        links,
        type,
        user_id: userId.trim(),
      };
      if (isEdit) {
        await arcadia.partners.update(loginToken, payload);
      } else {
        await arcadia.partners.create(loginToken, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Partner" : "New Partner"}
    >
      <div className="space-y-4">
        <Input
          id="partner-id"
          label="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={isEdit}
          required
        />
        <Input
          id="partner-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="partner-short"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Short description
          </label>
          <textarea
            id="partner-short"
            rows={2}
            value={short}
            onChange={(e) => setShort(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="partner-type"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Type
          </label>
          <select
            id="partner-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          >
            {partnerTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="partner-user-id"
          label="Owner's user ID (Discord ID)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <Input
          id="partner-bot-id"
          label="Linked bot ID (optional)"
          value={botId}
          onChange={(e) => setBotId(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Links (must be https://)
          </p>
          <LinksEditor links={links} onChange={setLinks} />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
