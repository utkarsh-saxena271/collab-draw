"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  FolderOpen,
  Pencil,
  Shapes,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { ProductPreview } from "@/components/home/product-preview";
import { Brand } from "@/components/layout/brand";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils/format";
import { CURRENT_YEAR } from "@/lib/utils/year";

const features = [
  {
    icon: Zap,
    title: "Real-time collaboration",
    description:
      "Watch ideas appear as your teammates draw. Strokes, shapes and cursors stay in sync without a refresh.",
    iconClass: "bg-violet-50 text-violet-600",
    cardClass: "lg:col-span-2",
  },
  {
    icon: Pencil,
    title: "Freehand drawing",
    description:
      "A smooth pencil tool for quick sketches, annotations and messy first drafts. Mouse, touch and stylus friendly.",
    iconClass: "bg-amber-50 text-amber-600",
    cardClass: "lg:col-span-2",
  },
  {
    icon: Shapes,
    title: "Geometric shapes",
    description:
      "Add clean rectangles, ellipses and lines to turn rough thinking into something the whole team can read.",
    iconClass: "bg-sky-50 text-sky-600",
    cardClass: "lg:col-span-2",
  },
  {
    icon: FolderOpen,
    title: "Shared workspaces",
    description:
      "Keep every project in its own canvas. Your rooms, drawings and collaborators are always one click away.",
    iconClass: "bg-emerald-50 text-emerald-600",
    cardClass: "lg:col-span-3",
  },
  {
    icon: UserPlus,
    title: "Invitation-based collaboration",
    description:
      "Share a private invite link with the people who should be in the room. Owners stay in control of access.",
    iconClass: "bg-rose-50 text-rose-600",
    cardClass: "lg:col-span-3",
  },
];

const steps = [
  {
    number: "01",
    title: "Create a canvas",
    description: "Start a workspace for a project, a workshop or a passing idea.",
  },
  {
    number: "02",
    title: "Invite your team",
    description: "Generate an invite link and bring everyone into the same room.",
  },
  {
    number: "03",
    title: "Draw it out",
    description: "Sketch, shape and refine together — every change appears live.",
  },
];

export default function Home() {
  const { status, user } = useAuth();
  const isAuthenticated = status === "authenticated";
  const primaryHref = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#202020]">
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-[#faf9f6]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Brand />

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex"
            >
              <a href="#features" className="transition hover:text-violet-700">
                Features
              </a>
              <a href="#about" className="transition hover:text-violet-700">
                About
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {status === "loading" ? (
              <span
                aria-hidden="true"
                className="h-9 w-28 animate-pulse rounded-xl bg-gray-200/80"
              />
            ) : isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 sm:flex"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-[10px] font-bold text-white">
                    {getInitials(user.name)}
                  </span>
                  Dashboard
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                >
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hidden rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 sm:block"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-40 h-[26rem] w-[26rem] rounded-full bg-amber-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Real-time collaborative whiteboard
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-gray-900 sm:text-6xl xl:text-7xl">
              Think Together.
              <span className="mt-1 block bg-gradient-to-r from-violet-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Draw Together.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Sketch, brainstorm, and build ideas on a shared canvas in real
              time. CollabDraw keeps everyone in the same creative space —
              wherever they are.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                {isAuthenticated ? "Open your workspace" : "Start Drawing"}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#features"
                className="inline-flex h-12 items-center rounded-xl border border-gray-300 bg-white px-6 text-base font-semibold text-gray-800 transition hover:border-violet-300 hover:bg-violet-50"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              {["Free to start", "No setup required", "Private workspaces"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-gray-200/70 bg-white/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-center sm:grid-cols-3 sm:px-8">
          {[
            { value: "Live", label: "Strokes and shapes sync instantly" },
            { value: "4 tools", label: "Pencil, rectangles, ellipses and lines" },
            { value: "1 link", label: "Bring your whole team into a room" },
          ].map((stat) => (
            <div key={stat.value} className="py-2">
              <p className="text-2xl font-bold tracking-tight text-gray-900">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Everything you need to create together
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-500">
              A focused toolkit for teams who think best when they can see the
              idea in front of them.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`group rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/60 ${feature.cardClass}`}
                >
                  <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconClass}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="scroll-mt-24 border-y border-gray-200 bg-[#faf9f6] px-5 py-20 sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              About CollabDraw
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Made for the messy middle of ideas.
            </h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              The best ideas rarely arrive fully formed. They start as a quick
              sketch, a half-finished shape, a note in the margin. CollabDraw is
              built for that moment — when the thinking is still happening and
              everyone needs to be in it together.
            </p>
            <p className="mt-4 text-base leading-7 text-gray-500">
              No heavy project management. No complicated setup. Just a canvas,
              your team, and a shared place to figure it out.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
              >
                {isAuthenticated ? "Go to dashboard" : "Create your first canvas"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Users className="h-4 w-4 text-violet-500" />
                Built for teams, classrooms and workshops
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <span className="text-xs font-bold tracking-wider text-violet-500">
                  {step.number}
                </span>
                <h3 className="mt-3 text-base font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 px-6 py-14 text-center text-white shadow-2xl shadow-violet-300/40 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-violet-100">
              <Sparkles className="h-3.5 w-3.5" />
              Your next idea starts here
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to think out loud?
            </h2>
            <p className="mt-4 text-lg leading-8 text-violet-100/85">
              Open a canvas, invite your team, and turn the rough sketch in your
              head into something everyone can build on.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-violet-700 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-violet-50"
              >
                {isAuthenticated ? "Open your workspace" : "Start Drawing"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center rounded-xl border border-white/25 px-6 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-[#faf9f6] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Brand size="sm" />
            <p className="text-sm text-gray-500">
              A shared canvas for people who think together.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-500"
          >
            <a href="#features" className="transition hover:text-violet-700">
              Features
            </a>
            <a href="#about" className="transition hover:text-violet-700">
              About
            </a>
            <Link
              href={isAuthenticated ? "/dashboard" : "/signin"}
              className="transition hover:text-violet-700"
            >
              {isAuthenticated ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="transition hover:text-violet-700"
            >
              {isAuthenticated ? "Open workspace" : "Get started"}
            </Link>
          </nav>

          <p className="text-xs text-gray-400">
            © {CURRENT_YEAR} CollabDraw
          </p>
        </div>
      </footer>
    </main>
  );
}
