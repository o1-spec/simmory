import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { isStorageConfigured } from "@/lib/storage/r2";
import { prisma } from "@/lib/db";
import {
  getOrCreateReviewForVideo,
  getReviewById,
  ReviewError,
} from "@/lib/services/reviews";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RecipeReviewWorkspace } from "@/components/review/recipe-review-workspace";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Human Recipe Review & Reconstruction — Simmory",
  description: "Review AI-proposed candidate stages, confirm sensory cues, and preserve genuine family recipes.",
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

async function ReviewContent({ params }: ReviewPageProps) {
  const session = await requireUser("/videos");
  const { id } = await params;

  let review: Awaited<ReturnType<typeof getOrCreateReviewForVideo>> | null = null;
  let userRole = "VIEWER";
  let errorMessage: string | null = null;

  try {
    review = await getOrCreateReviewForVideo(id, session.user.id);
    const membership = await prisma.kitchenMember.findUnique({
      where: {
        kitchenId_userId: {
          kitchenId: review.kitchenId,
          userId: session.user.id,
        },
      },
    });
    if (membership) {
      userRole = membership.role;
    }
  } catch (err: unknown) {
    if (err instanceof ReviewError && err.statusCode === 404) {
      // Check if `id` is a direct review ID
      try {
        const direct = await getReviewById(id, session.user.id);
        review = direct.review as unknown as typeof review;
        userRole = direct.role;
      } catch {
        notFound();
      }
    } else {
      errorMessage = err instanceof Error ? err.message : "Unable to load recipe review";
    }
  }

  if (errorMessage || !review) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-[#202723] font-bold">
          AI Analysis Required Before Review
        </h2>
        <p className="text-sm text-[#202723]/70 leading-relaxed font-sans max-w-md mx-auto">
          {errorMessage ||
            "This video does not have a completed AI analysis yet. Once audio extraction, visual observation, and timeline generation finish, human review will become available here."}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link href={`/videos/${id}`}>
            <Button variant="forest" size="md">
              Go to Video Analysis
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="md">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const kitchen = await prisma.kitchen.findUnique({
    where: { id: review.kitchenId },
    select: { name: true },
  });

  const storageConfigured = isStorageConfigured();

  // Convert review object to match workspace props
  const workspaceReview = {
    id: review.id,
    videoId: review.videoId,
    kitchenId: review.kitchenId,
    status: review.status as "DRAFT" | "IN_PROGRESS" | "COMPLETED",
    notes: review.notes,
    cookVerified: review.cookVerified,
    cookVerifiedBy: review.cookVerifiedBy,
    cookVerifiedAt: review.cookVerifiedAt,
    version: review.version,
    video: {
      id: review.video.id,
      originalFilename: review.video.originalFilename,
      duration: review.video.duration,
      storageKey: review.video.storageKey,
      kitchenId: review.video.kitchenId,
    },
    analysis: {
      id: review.analysis.id,
      status: review.analysis.status,
      speechStatus: review.analysis.speechStatus,
      summary: review.analysis.summary,
      samplingStrategy: review.analysis.samplingStrategy,
      coverageRatio: review.analysis.coverageRatio,
      sampledTimeRange: review.analysis.sampledTimeRange,
      whisperModel: review.analysis.whisperModel,
      visionModel: review.analysis.visionModel,
      createdAt: review.analysis.createdAt,
    },
    recipe: review.recipe,
    events: review.events.map((e) => ({
      id: e.id,
      reviewId: e.reviewId,
      sourceProposedEventId: e.sourceProposedEventId,
      position: e.position,
      title: e.title,
      description: e.description,
      originalAiTitle: e.originalAiTitle,
      originalAiDescription: e.originalAiDescription,
      startTimestamp: e.startTimestamp,
      endTimestamp: e.endTimestamp,
      status: e.status as "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED",
      humanClarification: e.humanClarification,
      sensoryCue: e.sensoryCue,
      evidenceFrames: e.evidenceFrames,
      transcriptSegments: e.transcriptSegments,
    })),
    clarifications: review.clarifications.map((c) => ({
      id: c.id,
      reviewId: c.reviewId,
      eventId: c.eventId,
      question: c.question,
      answer: c.answer,
      status: c.status as "UNANSWERED" | "ANSWERED" | "UNKNOWN" | "NOT_APPLICABLE",
      source: c.source as "AI_GENERATED" | "HUMAN_ADDED",
      createdAt: c.createdAt,
    })),
    ingredients: review.ingredients.map((i) => ({
      id: i.id,
      reviewId: i.reviewId,
      name: i.name,
      quantity: i.quantity,
      notes: i.notes,
      position: i.position,
      provenance: i.provenance as "SPOKEN_INSTRUCTION" | "VISUALLY_SUGGESTED" | "HUMAN_SUPPLIED" | "HUMAN_CONFIRMED",
      isUnknownQuantity: i.isUnknownQuantity,
    })),
  };

  return (
    <RecipeReviewWorkspace
      initialReview={workspaceReview}
      kitchenName={kitchen?.name || "Family Kitchen"}
      userRole={userRole}
      storageConfigured={storageConfigured}
    />
  );
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-warm-500 font-sans">
              Loading recipe review workspace...
            </span>
          </div>
        }
      >
        <ReviewContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
