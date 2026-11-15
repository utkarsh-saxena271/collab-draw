"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";
import { Modal } from "./modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (busy) return;
    setError(null);
    setBusy(false);
    onClose();
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);

    try {
      await onConfirm();
      setBusy(false);
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "Something went wrong. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
    >
      {children}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={busy}
          className="w-full sm:w-auto"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={handleConfirm}
          loading={busy}
          className={cn(
            "w-full sm:w-auto",
            tone === "warning" && "bg-amber-600 hover:bg-amber-700",
          )}
        >
          {!busy ? <AlertTriangle className="h-4 w-4" /> : null}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
