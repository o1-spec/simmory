import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { getVideoDetails } from "@/lib/services/videos";
import { isStorageConfigured } from "@/lib/storage/r2";
import { isEditor } from "@/lib/auth/permissions";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { VideoInteractiveView } from "@/components/videos/video-interactive-container";

export const metadata = {
  title: "Cooking Video Recording — Simmory",
  description: "View and play preserved family cooking footage.",
};

interface VideoDetailPageProps {
  params: Promise<{ id: string }>;
}

async function VideoDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser("/videos");
  const { id } = await params;

  const result = await getVideoDetails(session.user.id, id);
  if (!result) {
    notFound();
  }

  const { video, role } = result;
  const canModify = isEditor(role);
  const storageConfigured = isStorageConfigured();

  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const sizeMb = ((video.actualSize ?? video.expectedSize) / (1024 * 1024)).toFixed(
    1
  );

  return (
    <VideoInteractiveView
      video={video}
      canModify={canModify}
      storageConfigured={storageConfigured}
      formattedDate={formattedDate}
      sizeMb={sizeMb}
    />
  );
}

export default function VideoDetailPage({ params }: VideoDetailPageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading cooking recording..." />}>
        <VideoDetailContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
