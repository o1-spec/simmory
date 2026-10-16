import React, { Suspense } from "react";
import Link from "next/link";
import { Plus, Video, ArrowLeft, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { listUserVideos } from "@/lib/services/videos";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { VideoFilters } from "@/components/videos/video-filters";
import { VideoCard } from "@/components/videos/video-card";
import { VideoUploadStatus } from "@/generated/prisma/client";

export const metadata = {
  title: "Cooking Video Archive — Simmory",
  description: "View and manage original cooking recordings preserved in your family kitchens.",
};

interface VideosPageProps {
  searchParams: Promise<{
    kitchenId?: string;
    uploadStatus?: string;
    page?: string;
  }>;
}

async function VideosContent({
  searchParams,
}: {
  searchParams: Promise<{
    kitchenId?: string;
    uploadStatus?: string;
    page?: string;
  }>;
}) {
  const session = await requireUser("/videos");
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10) || 1;
  const kitchenId = params.kitchenId || undefined;
  let uploadStatus: VideoUploadStatus | undefined;
  if (
    params.uploadStatus &&
    Object.values(VideoUploadStatus).includes(
      params.uploadStatus as VideoUploadStatus
    )
  ) {
    uploadStatus = params.uploadStatus as VideoUploadStatus;
  }

  // Fetch kitchens where the user is an active member
  const memberships = await db.kitchenMember.findMany({
    where: { userId: session.user.id },
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
  }));

  // Fetch user videos with filters and pagination
  const { videos, pagination } = await listUserVideos(session.user.id, {
    kitchenId,
    uploadStatus,
    page,
    limit: 12,
  });

  return (
    <>
      <PageHeader
        eyebrow="Media Vault"
        title="Cooking Video Archive"
        description="Preserve, replay, and manage original unedited cooking footage from your private family kitchens."
        actions={
          <Link href="/upload">
            <Button variant="forest" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        }
      />

      <VideoFilters kitchens={kitchens} />

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#DDDCD3] p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] text-[#2E4742] flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="font-display text-xl text-[#202723] font-bold">
            {kitchenId || uploadStatus
              ? "No videos match your active filter."
              : "No cooking videos uploaded yet."}
          </h3>
          <p className="text-xs text-[#202723]/60 max-w-sm mx-auto">
            {kitchenId || uploadStatus
              ? "Try resetting your filter options to see all family recordings."
              : "Capture your loved one's cooking methods, unwritten habits, and original voice."}
          </p>
          <div className="pt-2">
            <Link href="/upload">
              <Button variant="forest" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Preserve First Video
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                id={v.id}
                originalFilename={v.originalFilename}
                contentType={v.contentType}
                expectedSize={v.expectedSize}
                actualSize={v.actualSize}
                uploadStatus={v.uploadStatus}
                processingStatus={v.processingStatus}
                validationStatus={v.validationStatus}
                createdAt={v.createdAt}
                kitchen={v.kitchen}
                recipe={v.recipe}
                uploadedBy={v.uploadedBy}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-warm-200/60">
              {pagination.page > 1 && (
                <Link
                  href={`/videos?page=${pagination.page - 1}${
                    kitchenId ? `&kitchenId=${kitchenId}` : ""
                  }${uploadStatus ? `&uploadStatus=${uploadStatus}` : ""}`}
                >
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              )}

              <span className="text-xs text-warm-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/videos?page=${pagination.page + 1}${
                    kitchenId ? `&kitchenId=${kitchenId}` : ""
                  }${uploadStatus ? `&uploadStatus=${uploadStatus}` : ""}`}
                >
                  <Button variant="outline" size="sm">
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function VideosPage({ searchParams }: VideosPageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading video archive..." />}>
        <VideosContent searchParams={searchParams} />
      </Suspense>
    </DashboardLayout>
  );
}
