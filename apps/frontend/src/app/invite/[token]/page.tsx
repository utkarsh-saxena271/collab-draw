import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { InviteAccept } from "@/components/invite/invite-accept";
import { FullPageLoader } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Join a canvas — CollabDraw",
  description: "Accept an invitation to a shared CollabDraw canvas.",
};

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<FullPageLoader message="Checking your invitation…" />}>
      {params.then(({ token }) => (
        <RequireAuth>
          <InviteAccept inviteToken={token} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
