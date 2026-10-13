import React, { Suspense } from "react";
import { requireUser } from "@/lib/auth/get-user";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/account/settings-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Account Settings — Simmory",
  description: "Manage your Simmory account, profile, and security preferences.",
};

async function SettingsContent() {
  const session = await requireUser("/settings");

  return (
    <>
      <PageHeader
        eyebrow="Account Preferences"
        title="Settings & Security"
        description="Manage your profile information, change your account password, and control active authentication sessions."
      />

      <SettingsForm user={session.user} />
    </>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading account preferences..." />}>
        <SettingsContent />
      </Suspense>
    </DashboardLayout>
  );
}
