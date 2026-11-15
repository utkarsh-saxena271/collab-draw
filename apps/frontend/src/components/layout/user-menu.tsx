"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          compact ? "" : "pr-3"
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
          {getInitials(user.name)}
        </span>

        {!compact ? (
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[9rem] truncate text-sm font-semibold text-gray-800">
              {user.name}
            </span>
            <span className="block max-w-[9rem] truncate text-xs text-gray-500">
              {user.email}
            </span>
          </span>
        ) : null}

        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition",
            open ? "rotate-180" : "",
            compact ? "" : "hidden sm:block"
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-gray-900/10"
        >
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
