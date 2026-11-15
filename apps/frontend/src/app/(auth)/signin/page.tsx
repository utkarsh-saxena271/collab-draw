import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign in — CollabDraw",
  description: "Sign in to your CollabDraw workspace.",
};

export default function SignInPage() {
  return <SignInForm />;
}
