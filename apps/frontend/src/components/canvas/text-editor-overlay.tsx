"use client";

import { useEffect, useRef } from "react";
import type { TextEditor } from "@/hooks/use-canvas-engine";

interface TextEditorOverlayProps {
  editor: TextEditor | null;
  onCommit: (shapeId: string, text: string, width?: number, height?: number) => void;
  onDismiss: () => void;
}

/**
 * A floating textarea that sits exactly over the text element being edited.
 * It is positioned using screen coordinates derived from the canvas camera.
 */
export function TextEditorOverlay({
  editor,
  onCommit,
  onDismiss,
}: TextEditorOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editor) return;

    const el = textareaRef.current;
    if (!el) return;

    el.value = editor.initialText;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);

    // Auto-size on mount
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.style.width = `${Math.max(el.scrollWidth, 120)}px`;
  }, [editor]);

  if (!editor) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      const el = textareaRef.current;
      if (el) {
        onCommit(editor.shapeId, el.value, el.scrollWidth, el.scrollHeight);
      }
      onDismiss();
      return;
    }

    // Shift+Enter → newline (default); Enter alone on mobile also allowed
    // We only commit on Escape
  };

  const handleBlur = () => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value;
    onCommit(editor.shapeId, text, el.scrollWidth, el.scrollHeight);
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden="false"
    >
      <textarea
        ref={textareaRef}
        defaultValue={editor.initialText}
        rows={1}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onInput={(event) => {
          const el = event.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
          el.style.width = "auto";
          el.style.width = `${Math.max(el.scrollWidth, 120)}px`;
        }}
        style={{
          position: "absolute",
          left: `${editor.screenX}px`,
          top: `${editor.screenY}px`,
          font: `${editor.fontSize}px sans-serif`,
          color: editor.color,
          lineHeight: 1.4,
          background: "rgba(255,255,255,0.01)",
          border: "1.5px dashed rgba(109,40,217,0.5)",
          borderRadius: "4px",
          padding: "2px 4px",
          outline: "none",
          resize: "none",
          overflow: "hidden",
          minWidth: "120px",
          minHeight: `${editor.fontSize * 1.4}px`,
          pointerEvents: "auto",
          whiteSpace: "pre",
        }}
        spellCheck
        autoComplete="off"
        aria-label="Text input on canvas"
      />
    </div>
  );
}

