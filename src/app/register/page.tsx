import React, { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UtensilsCrossed, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Create Family Archive — Simmory",
  description: "Create a private kitchen archive to preserve family recipes and cooking videos.",
};

async function RegisterContent() {
  const session = await getCurrentUser();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F2F2EB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#202723]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4742] rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2E4742] text-[#F2F2EB] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-display text-2xl font-bold tracking-tight text-[#202723] block leading-none">
              SIMMORY
            </span>
            <span className="text-[10px] text-[#2E4742] font-mono tracking-wider uppercase block mt-1">
              Family Kitchen
            </span>
          </div>
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl text-[#202723] font-bold mt-6 tracking-tight">
          Start your family archive
        </h1>
        <p className="text-xs sm:text-sm text-[#202723]/70 mt-2 font-sans">
          Preserve generational cooking wisdom, techniques, and cherished voices.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 bg-white border border-[#DDDCD3] shadow-sm">
          <Suspense fallback={<LoadingSpinner label="Loading form..." />}>
            <RegisterForm />
          </Suspense>
        </Card>

        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#202723]/50">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E4742]" />
          <span>Private by default &bull; Custom Argon2id & JWT authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading registration..." />}>
      <RegisterContent />
    </Suspense>
  );
}
