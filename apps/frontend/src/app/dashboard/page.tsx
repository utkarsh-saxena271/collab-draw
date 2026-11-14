import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard — CollabDraw",
  description: "Your canvases and shared workspaces.",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardScreen />
    </RequireAuth>
  );
}
