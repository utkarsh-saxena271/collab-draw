"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { LoginSchema } from "@repo/common";
import { useAuth } from "@/hooks/use-auth";
import { usePostAuthPath } from "@/hooks/use-post-auth-path";
import { ApiError } from "@/lib/api/client";
import {
  buildAuthHref,
  getPostAuthPath,
} from "@/lib/auth/redirect";
import { getFieldErrors, type FieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

export function SignInForm() {
  const router = useRouter();
  const { status, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = usePostAuthPath();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getPostAuthPath());
    }
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: FieldErrors = {};

    if (!email.trim()) nextErrors.email = "Enter your email address.";
    if (!password) nextErrors.password = "Enter your password.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const parsed = LoginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!parsed.success) {
      setErrors(getFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await signIn(parsed.data);
      router.replace(getPostAuthPath());
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setFormError("Invalid email or password. Please try again.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Sign in to CollabDraw
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Pick up where you left off and get back to creating with your team.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{formError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) {
              setErrors((current) => ({ ...current, email: "" }));
            }
          }}
        />

        <TextInput
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          icon={Lock}
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (errors.password) {
              setErrors((current) => ({ ...current, password: "" }));
            }
          }}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="w-full"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-500">
        New to CollabDraw?{" "}
        <Link
          href={buildAuthHref("/signup", nextPath)}
          className="font-semibold text-violet-600 transition hover:text-violet-700"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
