"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { RegisterSchema } from "@repo/common";
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

export function SignUpForm() {
  const router = useRouter();
  const { status, signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) nextErrors.name = "Please enter your name.";
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    if (!password) nextErrors.password = "Choose a password.";
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      return nextErrors;
    }

    const parsed = RegisterSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (!parsed.success) {
      const fieldErrors = getFieldErrors(parsed.error);

      if (fieldErrors.password) {
        fieldErrors.password = "Password must be at least 8 characters.";
      }
      if (fieldErrors.email) {
        fieldErrors.email = "Enter a valid email address.";
      }
      if (fieldErrors.name) {
        fieldErrors.name = "Please enter your name.";
      }

      return fieldErrors;
    }

    return {};
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace(getPostAuthPath());
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrors({ email: "That email is already in use." });
          setFormError("An account with this email already exists. Try signing in instead.");
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
          Get started
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Start a workspace, invite your team, and turn ideas into something
          real.
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
          label="Name"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          icon={UserRound}
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            if (errors.name) setErrors((current) => ({ ...current, name: "" }));
          }}
        />

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
            if (errors.email) setErrors((current) => ({ ...current, email: "" }));
          }}
        />

        <TextInput
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
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

        <TextInput
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          icon={Lock}
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (errors.confirmPassword) {
              setErrors((current) => ({ ...current, confirmPassword: "" }));
            }
          }}
        />

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="w-full"
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href={buildAuthHref("/signin", nextPath)}
          className="font-semibold text-violet-600 transition hover:text-violet-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
