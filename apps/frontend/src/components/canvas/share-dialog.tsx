"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Check, Copy, Link2, Send } from "lucide-react";
import { RegisterSchema } from "@repo/common";
import { inviteMember } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

interface InviteResult {
  url: string;
  email: string;
  expiresAt: string;
}

export function ShareDialog({
  open,
  onClose,
  token,
  roomId,
  roomName,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  roomId: string;
  roomName: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLink() {
    if (!invite) return;

    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
    } catch {
      // Clipboard access may be blocked (for example on an insecure origin).
      // The link is still visible and selectable in the field below.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = RegisterSchema.shape.email.safeParse(email.trim());

    if (!parsed.success) {
      setError("Enter a valid email address for your collaborator.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await inviteMember(token, roomId, {
        email: parsed.data,
      });

      setInvite({
        url: new URL(
          `/invite/${result.inviteToken}`,
          window.location.origin,
        ).toString(),
        email: parsed.data,
        expiresAt: result.expiresAt,
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create an invite. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={roomName ? `Invite to ${roomName}` : "Invite to this canvas"}
      description="Create a private, single-use link for a teammate."
      className="max-w-lg"
    >
      {invite ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3 w-3" />
            </span>
            <div>
              <p className="font-semibold">Invite ready for {invite.email}</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                They&apos;ll need a CollabDraw account to accept. This link is
                single-use and expires on {formatDate(invite.expiresAt)}.
              </p>
            </div>
          </div>

          <TextInput
            label="Invite link"
            readOnly
            value={invite.url}
            onFocus={(event) => event.currentTarget.select()}
            icon={Link2}
            trailing={
              <button
                type="button"
                onClick={copyLink}
                aria-label="Copy invite link"
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            }
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setInvite(null);
                setEmail("");
                setCopied(false);
              }}
            >
              Invite someone else
            </Button>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextInput
            label="Collaborator email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="teammate@company.com"
            value={email}
            autoFocus
            onChange={(event) => {
              setEmail(event.target.value);
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

          <p className="rounded-xl bg-violet-50/70 px-3.5 py-3 text-xs leading-5 text-violet-700">
            Only people with a valid link can join, and each link can be
            accepted once. You can create as many invites as you need.
          </p>

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
              {submitting ? "Creating link…" : "Create invite link"}
              {!submitting ? <Send className="h-4 w-4" /> : null}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
