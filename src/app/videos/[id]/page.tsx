import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Utensils,
  HardDrive,
  Calendar,
  User,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { getVideoDetails } from "@/lib/services/videos";
import { isStorageConfigured } from "@/lib/storage/r2";
import { isEditor } from "@/lib/auth/permissions";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { VideoPlayer } from "@/components/videos/video-player";
import { DeleteVideoDialog } from "@/components/videos/delete-video-dialog";

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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href={`/kitchens/${video.kitchen.id}`}
          className="inline-flex items-center text-xs font-medium text-warm-600 hover:text-terracotta-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to {video.kitchen.name}
        </Link>

        {canModify && (
          <div className="flex items-center gap-3">
            <DeleteVideoDialog
              videoId={video.id}
              videoTitle={video.originalFilename}
              redirectTo={`/kitchens/${video.kitchen.id}`}
            />
          </div>
        )}
      </div>

      {/* Video Player Section */}
      <div className="space-y-3">
        <VideoPlayer
          videoId={video.id}
          uploadStatus={video.uploadStatus}
          storageConfigured={storageConfigured}
        />
      </div>

      {/* Title & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-warm-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={
                video.uploadStatus === "UPLOADED"
                  ? "sage"
                  : video.uploadStatus === "FAILED"
                  ? "terracotta"
                  : "warm"
              }
            >
              {video.uploadStatus === "UPLOADED"
                ? "Storage Verified"
                : video.uploadStatus}
            </Badge>
            <Badge variant="outline">
              AI: {video.processingStatus === "NOT_STARTED" ? "Not Started" : video.processingStatus}
            </Badge>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-warm-900 font-medium">
            {video.originalFilename}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-600">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-warm-200/80 shadow-2xs">
            <HardDrive className="w-3.5 h-3.5 text-warm-500" />
            <span>{sizeMb} MB</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-warm-200/80 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-warm-500" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-warm-200/80 shadow-2xs">
            <User className="w-3.5 h-3.5 text-warm-500" />
            <span>By {video.uploadedBy.name}</span>
          </div>
        </div>
      </div>

      {/* Context Grid: Kitchen & Recipe Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Kitchen Attribution */}
        <Card className="p-6 bg-white border-warm-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5 text-terracotta-500" />
            Family Kitchen
          </div>
          <h3 className="font-serif text-lg text-warm-900 font-medium mb-1">
            {video.kitchen.name}
          </h3>
          <p className="text-xs text-warm-500 mb-4">
            This recording is safely stored within your private family archive.
          </p>
          <Link
            href={`/kitchens/${video.kitchen.id}`}
            className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:underline"
          >
            Open Kitchen Archive &rarr;
          </Link>
        </Card>

        {/* Recipe Attribution */}
        <Card className="p-6 bg-white border-warm-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5 text-terracotta-500" />
            Associated Recipe
          </div>

          {video.recipe ? (
            <>
              <h3 className="font-serif text-lg text-warm-900 font-medium mb-1">
                {video.recipe.title}
              </h3>
              <p className="text-xs text-warm-500 mb-4">
                Cooked by <strong>{video.recipe.cookName}</strong>
              </p>
              <Link
                href={`/recipes/${video.recipe.id}`}
                className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:underline"
              >
                View Recipe Instructions & Sensory Cues &rarr;
              </Link>
            </>
          ) : (
            <>
              <h3 className="font-serif text-base text-warm-700 font-medium mb-1">
                No Recipe Associated
              </h3>
              <p className="text-xs text-warm-500 mb-4">
                This cooking video has not yet been linked to a written recipe.
              </p>
              <Link
                href={`/recipes/new?kitchenId=${video.kitchen.id}`}
                className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:underline"
              >
                Create a Recipe for this Recording &rarr;
              </Link>
            </>
          )}
        </Card>
      </div>

      {/* AI Processing Status Card */}
      <Card className="p-6 bg-warm-50/70 border-warm-200/80 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terracotta-500" />
          <h3 className="font-serif text-base text-warm-900 font-medium">
            AI Speech & Vision Extraction Pipeline
          </h3>
        </div>

        <p className="text-xs text-warm-600 leading-relaxed">
          The video has been uploaded and registered in your private family vault.
          In future phases, the asynchronous worker pipeline (FFmpeg frame
          sampling, Faster-Whisper audio transcription, and Gemma 4 vision
          reasoning) will analyze this video to extract timestamps and visual
          cooking cues.
        </p>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-warm-500">
          <Info className="w-3.5 h-3.5 text-warm-400" />
          <span>Status: <strong>NOT_STARTED</strong> (Awaiting Phase 5 AI pipeline integration)</span>
        </div>
      </Card>
    </div>
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
