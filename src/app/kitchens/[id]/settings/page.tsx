import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { getKitchenDetails } from "@/lib/services/kitchens";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { KitchenSettingsForm } from "./settings-form";

export const metadata = {
  title: "Kitchen Settings — Simmory",
  description: "Manage family kitchen preferences, details, and archive administration.",
};

interface KitchenSettingsPageProps {
  params: Promise<{ id: string }>;
}

async function SettingsLoader({ params }: KitchenSettingsPageProps) {
  const { id: kitchenId } = await params;
  const session = await requireUser(`/kitchens/${kitchenId}/settings`);
  const kitchen = await getKitchenDetails(kitchenId, session.user.id);

  if (!kitchen) {
    notFound();
  }

  const isOwner = kitchen.ownerId === session.user.id;
  const canEdit = isOwner || kitchen.myRole === "EDITOR";

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <Link
        href={`/kitchens/${kitchen.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {kitchen.name}
      </Link>

      <KitchenSettingsForm kitchen={kitchen} isOwner={isOwner} canEdit={canEdit} />
    </div>
  );
}

export default function KitchenSettingsPage({ params }: KitchenSettingsPageProps) {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="py-24 flex items-center justify-center">
            <LoadingSpinner label="Loading kitchen settings..." />
          </div>
        }
      >
        <SettingsLoader params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
