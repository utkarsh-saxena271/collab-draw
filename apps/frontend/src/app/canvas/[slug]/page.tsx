import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { CanvasWorkspace } from "@/components/canvas/canvas-workspace";
import { FullPageLoader } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Canvas — CollabDraw",
  description: "Draw together in real time.",
};

export default function CanvasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<FullPageLoader message="Loading canvas…" />}>
      {params.then(({ slug }) => (
        <RequireAuth>
          <CanvasWorkspace key={slug} slug={slug} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
