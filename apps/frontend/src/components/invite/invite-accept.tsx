"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  MailX,
  Sparkles,
} from "lucide-react";
import { acceptInvitation, listRooms } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { Brand } from "@/components/layout/brand";
import { Spinner } from "@/components/ui/spinner";

type InvitePhase = "accepting" | "success" | "error";

type AcceptanceResult = { kind: "success"; slug: string } | { kind: "accepted" };

interface InviteFailure {
  title: string;
  message: string;
}

function describeError(caught: unknown): InviteFailure {
  if (caught instanceof ApiError) {
    if (caught.status === 404) {
      return {
        title: "This invitation isn't valid",
        message:
          "The link may be incomplete or have been replaced. Ask the room owner for a fresh invite.",
      };
    }

    if (caught.status === 410) {
      return {
        title: "This invitation is no longer available",
        message:
          "It has already been used or has expired. If you've joined before, the canvas is waiting on your dashboard.",
      };
    }

    return {
      title: "We couldn't accept this invitation",
      message: caught.message,
    };
  }

  return {
    title: "We couldn't accept this invitation",
    message:
      "Something went wrong while connecting to the server. Please try again in a moment.",
  };
}

export function InviteAccept({ inviteToken }: { inviteToken: string }) {
  const router = useRouter();
  const { user, token } = useAuth();

  const [phase, setPhase] = useState<InvitePhase>("accepting");
  const [failure, setFailure] = useState<InviteFailure | null>(null);
  const requestRef = useRef<Promise<AcceptanceResult> | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!requestRef.current) {
      requestRef.current = (async (): Promise<AcceptanceResult> => {
        const accepted = await acceptInvitation(token, inviteToken);

        let rooms;

        try {
          rooms = await listRooms(token);
        } catch {
          return { kind: "accepted" };
        }

        const room = rooms.rooms.find(
          (candidate) => candidate.id === accepted.roomId
        );

        if (!room) {
          return { kind: "accepted" };
        }

        return { kind: "success", slug: room.slug };
      })();
    }

    let active = true;

    requestRef.current
      .then((result) => {
        if (!active) return;

        if (result.kind === "accepted") {
          setFailure({
            title: "Invitation accepted",
            message:
              "You're in, but we couldn't locate the canvas. Open your dashboard to find it.",
          });
          setPhase("error");
          return;
        }

        setPhase("success");
        router.replace(`/canvas/${result.slug}`);
      })
      .catch((caught) => {
        if (!active) return;
        setFailure(describeError(caught));
        setPhase("error");
      });

    return () => {
      active = false;
    };
  }, [inviteToken, token, router]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#faf9f6] px-5 py-12">
      <div className="pointer-events-none absolute -right-40 -top-32 h-[26rem] w-[26rem] rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-amber-100/60 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center">
          <Brand href={user ? "/dashboard" : "/"} size="md" />
        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-xl shadow-gray-900/5 sm:p-9">
          {phase === "accepting" ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Spinner className="h-6 w-6" label="Accepting invitation" />
              </span>
              <h1 className="mt-5 text-xl font-bold tracking-tight text-gray-900">
                Joining the canvas…
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                We&apos;re validating your invitation and adding you to the
                room.
              </p>
            </>
          ) : null}

          {phase === "success" ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-xl font-bold tracking-tight text-gray-900">
                You&apos;re in
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Opening your shared canvas now.
              </p>
            </>
          ) : null}

          {phase === "error" && failure ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                {failure.title.includes("valid") ||
                failure.title.includes("available") ? (
                  <MailX className="h-7 w-7" />
                ) : (
                  <AlertCircle className="h-7 w-7" />
                )}
              </span>
              <h1 className="mt-5 text-xl font-bold tracking-tight text-gray-900">
                {failure.title}
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {failure.message}
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to your dashboard
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  Back to homepage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          ) : null}

          {user ? (
            <p className="mt-7 border-t border-gray-100 pt-5 text-xs text-gray-400">
              Signed in as{" "}
              <span className="font-semibold text-gray-600">{user.email}</span>
            </p>
          ) : null}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Invitations are private and single-use.
        </p>
      </div>
    </div>
  );
}
