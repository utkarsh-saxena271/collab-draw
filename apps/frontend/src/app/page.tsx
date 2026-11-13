"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Pencil,
  Link2,
} from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Real-time Collaboration",
      description:
        "Work on the same canvas with your team and see changes instantly.",
    },
    {
      icon: Pencil,
      title: "Simple Drawing Tools",
      description:
        "Sketch ideas, create shapes, add text, and express your creativity.",
    },
    {
      icon: Link2,
      title: "Easy Sharing",
      description:
        "Invite others to your workspace and bring everyone onto the same page.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#202020]">
     
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
    
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Collab<span className="text-violet-600">Draw</span>
          </Link>

          <div className="hidden items-center gap-3 border-l border-gray-200 pl-7 sm:flex">
            <a
              href="#features"
              aria-label="Features"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-violet-50 hover:text-violet-600"
            >
              <Sparkles size={19} />
            </a>
            <a
              href="#about"
              aria-label="About"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-violet-50 hover:text-violet-600"
            >
              <Pencil size={19} />
            </a>
            <a
              href="#contact"
              aria-label="Contact"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-violet-50 hover:text-violet-600"
            >
              <Link2 size={19} />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="transition hover:text-violet-600">
              Features
            </a>
            <a href="#about" className="transition hover:text-violet-600">
              About
            </a>
            <a href="#contact" className="transition hover:text-violet-600">
              Contact
            </a>
          </div>

          <Link
            href={isLoggedIn ? "/login" : "/signup"}
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            {isLoggedIn ? "Sign In" : "Sign Up"}
          </Link>
        </div>
      </nav>

    
      <section className="mx-auto flex min-h-[600px] max-w-7xl flex-col items-center justify-center px-8 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
          <Sparkles size={16} />
          Your ideas, together in real time
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Draw Together.
          <span className="block text-violet-600">
            Create Without Limits.
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-600">
          Bring your ideas to life with a collaborative drawing workspace.
          Sketch, brainstorm, and create together — wherever you are.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-1 hover:bg-violet-700"
          >
            Start Drawing
            <ArrowRight size={18} />
          </Link>

          <a
            href="#features"
            className="rounded-xl border border-gray-300 bg-white px-7 py-3.5 font-semibold transition hover:border-violet-400"
          >
            Explore Features
          </a>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          No complicated setup. Just open, draw, and collaborate.
        </p>
      </section>

    
      <section
        id="features"
        className="border-t border-gray-200 bg-white px-8 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="font-semibold text-violet-600">FEATURES</p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Everything you need to create together
            </h2>

            <p className="mt-4 text-gray-500">
              A simple workspace designed to turn ideas into reality.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 p-8 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  <h3 className="text-xl font-bold">{feature.title}</h3>

                  <p className="mt-3 leading-7 text-gray-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      <footer className="border-t border-gray-200 bg-[#faf9f6] px-8 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-xl font-bold">
            Collab<span className="text-violet-600">Draw</span>
          </Link>

          <p className="text-sm text-gray-500">
            © 2026 CollabDraw. Create something amazing together.
          </p>
        </div>
      </footer>
    </main>
  );
}