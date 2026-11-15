"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import type { RoomSummary } from "@/types/api";
import { createRoom } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

export function CreateRoomDialog({
  open,
  onClose,
  token,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  onCreated: (room: RoomSummary) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Give your canvas a name to get started.");
      return;
    }

    if (trimmed.length > 80) {
      setError("Keep the name under 80 characters.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await createRoom(token, { name: trimmed });
      onCreated(result.room);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create the canvas. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title="Create a new canvas"
      description="Give this workspace a name. You can invite collaborators as soon as it is ready."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3.5 py-3 text-xs text-violet-700">
          <Sparkles className="h-4 w-4 shrink-0" />
          Start with a blank canvas — no templates or setup required.
        </div>

        <TextInput
          label="Canvas name"
          name="name"
          placeholder="Product brainstorm"
          value={name}
          autoFocus
          maxLength={80}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
        />

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? "Creating…" : "Create canvas"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
