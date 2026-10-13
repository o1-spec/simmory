import React, { Suspense } from "react";
import { requireUser } from "@/lib/auth/get-user";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { UploadForm } from "@/components/upload/upload-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Preserve a Cooking Video — Simmory",
  description: "Upload an unedited video of your family member preparing a dish.",
};

async function UploadContent() {
  const session = await requireUser("/upload");

  return (
    <>
      <PageHeader
        eyebrow="Step 1: Ingestion"
        title="Preserve a Cooking Video"
        description="Upload an unedited video of your family member preparing a dish. Simmory will analyze the footage, transcribe instructions, and prepare an interactive timeline for your review."
      />

      <UploadForm defaultCookName={session.user.name} />
    </>
  );
}

export default function UploadPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Preparing video upload workspace..." />}>
        <UploadContent />
      </Suspense>
    </DashboardLayout>
  );
}
