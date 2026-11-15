import type { ReactNode } from "react";
import Link from "next/link";
import { Check, Sparkles, Users, Zap } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { CURRENT_YEAR } from "@/lib/utils/year";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative">
          <Brand href="/" tone="light" />
        </div>

        <div className="relative mt-16 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-100">
            <Sparkles className="h-3.5 w-3.5" />
            A shared space for ideas
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
            Everything starts with a shared canvas.
          </h1>

          <p className="mt-5 text-lg leading-8 text-violet-100/80">
            Sketch, brainstorm, and shape ideas with your team in real time.
            No setup, no friction — just a blank canvas and the people you
            build with.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-violet-50">
            {[
              "Draw together with live cursors and instant sync",
              "Freehand strokes, rectangles, ellipses and lines",
              "Invite teammates into private workspaces",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-auto pt-12">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                <Users className="h-4 w-4" />
                3 collaborators online
              </div>
              <div className="flex items-center gap-1.5 text-xs text-violet-100/70">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                Live sync
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {["AS", "MK", "JL"].map((initials, index) => (
                <span
                  key={initials}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-violet-700 text-xs font-bold"
                  style={{
                    backgroundColor: ["#f5d0fe", "#ddd6fe", "#fbcfe8"][index],
                    color: ["#86198f", "#5b21b6", "#9d174d"][index],
                  }}
                >
                  {initials}
                </span>
              ))}
              <span className="text-xs text-violet-100/70">
                sketching the next big idea
              </span>
            </div>
          </div>

          <p className="mt-6 text-xs text-violet-100/60">
            © {CURRENT_YEAR} CollabDraw. Built for teams who think
            out loud.
          </p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col bg-[#faf9f6]">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Brand href="/" size="sm" />
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 transition hover:text-violet-700"
          >
            Back home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <div className="hidden items-center justify-between px-10 py-6 text-xs text-gray-400 lg:flex">
          <span>© {CURRENT_YEAR} CollabDraw</span>
          <Link href="/" className="transition hover:text-violet-600">
            Back to homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
