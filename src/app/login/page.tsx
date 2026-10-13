import React, { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UtensilsCrossed, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Sign In — Simmory",
  description: "Sign in to access your private family kitchen archive.",
};

async function LoginContent() {
  const session = await getCurrentUser();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-warm-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-terracotta-500 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-serif text-2xl font-normal tracking-tight text-warm-900 block leading-none">
              Simmory
            </span>
            <span className="text-[10px] text-warm-500 font-sans tracking-wide block mt-1">
              The way they made it
            </span>
          </div>
        </Link>

        <h1 className="font-serif text-2xl sm:text-3xl text-warm-900 font-normal mt-6 tracking-tight">
          Welcome back to the kitchen
        </h1>
        <p className="text-xs sm:text-sm text-warm-600 mt-2 font-sans">
          Sign in to view your family recipes and step-by-step videos.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 bg-white border border-warm-200/90 shadow-lg">
          <Suspense fallback={<LoadingSpinner label="Loading form..." />}>
            <LoginForm />
          </Suspense>
        </Card>

        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-warm-500">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
          <span>Encrypted with Argon2id & secure HttpOnly session tokens</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading sign-in..." />}>
      <LoginContent />
    </Suspense>
  );
}
