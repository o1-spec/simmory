import React, { Suspense } from "react";
import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { isStorageConfigured, getMaxVideoSizeBytes } from "@/lib/storage/r2";
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

  // Fetch kitchens where the user is an owner or editor
  const memberships = await db.kitchenMember.findMany({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "EDITOR", "ADMIN"] },
    },
    include: {
      kitchen: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const kitchens = memberships.map((m) => ({
    id: m.kitchen.id,
    name: m.kitchen.name,
    role: m.role,
  }));

  // Fetch recipes belonging to these kitchens
  const recipes = await db.recipe.findMany({
    where: {
      kitchenId: { in: kitchens.map((k) => k.id) },
    },
    select: {
      id: true,
      title: true,
      kitchenId: true,
      cookName: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const storageConfigured = isStorageConfigured();
  const maxUploadSizeMb = Math.round(getMaxVideoSizeBytes() / (1024 * 1024));

  return (
    <>
      <PageHeader
        eyebrow="Step 1: Ingestion"
        title="Preserve a Cooking Video"
        description="Upload an unedited video of your family member preparing a dish. Simmory stores the original recording securely in your private family kitchen."
      />

      <UploadForm
        kitchens={kitchens}
        recipes={recipes}
        storageConfigured={storageConfigured}
        maxUploadSizeMb={maxUploadSizeMb}
        defaultCookName={session.user.name}
      />
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
