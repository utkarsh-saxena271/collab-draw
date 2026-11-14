import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your account — CollabDraw",
  description: "Create a CollabDraw account and start drawing with your team.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
