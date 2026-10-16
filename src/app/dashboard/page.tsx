import React, { Suspense } from "react";
import Link from "next/link";
import {
  FolderHeart,
  BookOpen,
  Sparkles,
  Plus,
  ChefHat,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/db";
import { listUserKitchens } from "@/lib/services/kitchens";
import { listUserRecipes } from "@/lib/services/recipes";
import { listUserVideos } from "@/lib/services/videos";
import { getVideoValidationStats } from "@/lib/services/jobs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Video, Play, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Kitchen Overview — Simmory",
  description: "Your family's private space for preserving unwritten recipes and cooking memories.",
};

async function DashboardContent() {
  const session = await requireUser("/dashboard");

  // Query authentic metrics in parallel without N+1
  const [
    kitchens,
    recentRecipesResult,
    recentVideosResult,
    validationStats,
    pendingReviews,
    activeCookingSessions,
  ] = await Promise.all([
    listUserKitchens(session.user.id),
    listUserRecipes(session.user.id, { page: 1, limit: 6 }),
    listUserVideos(session.user.id, { page: 1, limit: 3 }),
    getVideoValidationStats(session.user.id),
    prisma.cookingVideo.findMany({
      where: {
        kitchen: {
          members: { some: { userId: session.user.id } },
        },
        analyses: {
          some: { status: "COMPLETED" },
        },
        reviews: {
          none: { status: "COMPLETED" },
        },
      },
      select: {
        id: true,
        originalFilename: true,
        kitchen: { select: { name: true } },
      },
      take: 3,
    }),
    prisma.cookingSession.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["IN_PROGRESS", "PAUSED"] },
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            cookName: true,
            steps: { select: { id: true } },
          },
        },
        sessionSteps: {
          where: { completed: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 2,
    }),
  ]);

  const { recipes: recentRecipes, pagination: recipePagination } = recentRecipesResult;
  const { videos: recentVideos, pagination: videoPagination } = recentVideosResult;

  const totalRecipes = recipePagination.total;
  const totalKitchens = kitchens.length;
  const totalVideos = videoPagination.total;

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${session.user.name}`}
        title="Kitchen Overview"
        description="Your family's private archive for preserving unwritten recipes, sensory cues, and original cooking recordings."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/kitchens/new">
              <Button variant="outline" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                New Kitchen
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" size="md">
                Upload Video
              </Button>
            </Link>
            <Link href="/recipes/new">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Preserve Recipe
              </Button>
            </Link>
          </div>
        }
      />

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-white border border-[#DDDCD3]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#202723]/60">
              Preserved Recipes
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#202723]">
              {totalRecipes}
            </span>
            <span className="text-xs font-sans text-[#202723]/60">
              {totalRecipes === 1 ? "recipe" : "recipes"}
            </span>
          </div>
          <p className="text-[11px] font-sans text-[#202723]/50 mt-1">
            {totalRecipes === 0 ? "Ready for your first family recipe" : "Preserved in family archive"}
          </p>
        </Card>

        <Card className="p-5 bg-white border border-[#DDDCD3]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#202723]/60">
              Family Kitchens
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
              <FolderHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#202723]">
              {totalKitchens}
            </span>
            <span className="text-xs font-sans text-[#202723]/60">
              {totalKitchens === 1 ? "active space" : "active spaces"}
            </span>
          </div>
          <p className="text-[11px] font-sans text-[#202723]/50 mt-1">
            {totalKitchens === 1 ? "Default family space active" : "Multi-generational collections"}
          </p>
        </Card>

        <Card className="p-5 bg-white border border-[#DDDCD3]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#202723]/60">
              Cooking Videos
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#8BB2DE]/20 text-[#2E4742] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#202723]">
              {validationStats.uploaded}
            </span>
            <span className="text-xs font-sans text-[#202723]/60">
              {validationStats.uploaded === 1 ? "video" : "videos"}
            </span>
          </div>
          <p className="text-[11px] font-sans text-[#202723]/50 mt-1">
            {validationStats.uploaded === 0
              ? "Stored in Cloudflare R2"
              : `${validationStats.validated} validated by worker`}
          </p>
        </Card>

        <Card className="p-5 bg-white border border-[#DDDCD3]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#202723]/60">
              Media Streams
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F5B726]/20 text-[#A86E00] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#202723]">
              {validationStats.validated}
            </span>
            <span className="text-xs font-sans text-[#202723]/60">
              / {validationStats.uploaded}
            </span>
          </div>
          <p className="text-[11px] font-sans text-[#202723]/50 mt-1">
            {validationStats.awaitingValidation > 0
              ? `${validationStats.awaitingValidation} awaiting validation`
              : validationStats.failedValidation > 0
              ? `${validationStats.failedValidation} failed validation`
              : "All media streams verified"}
          </p>
        </Card>
      </div>

      {/* Pending AI Reviews Banner */}
      {pendingReviews.length > 0 && (
        <div className="mb-8 p-5 bg-white border-l-4 border-l-[#2E4742] border-[#DDDCD3] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2E4742]" />
              <h3 className="font-display text-base font-bold text-[#202723]">
                AI Video Analysis Complete — Human Review Pending
              </h3>
            </div>
            <p className="text-xs text-[#202723]/70 font-sans leading-relaxed">
              You have {pendingReviews.length} cooking video(s) ready for review. Confirm candidate actions, answer questions for the cook, and reconstruct family recipes.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/review/${pendingReviews[0].id}`}>
              <Button size="sm" variant="forest" className="gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Review &ldquo;{pendingReviews[0].originalFilename.replace(/\.[^/.]+$/, "")}&rdquo;
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Active Cooking Sessions (Continue Cooking) */}
      {activeCookingSessions.length > 0 && (
        <div className="mb-8 p-5 bg-white border border-[#DDDCD3] rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[#2E4742] fill-[#2E4742]" />
              <h3 className="font-display text-base font-bold text-[#202723]">
                Continue Cooking — Active Session
              </h3>
            </div>
            <span className="text-xs font-mono text-[#2E4742] font-medium">
              Pick up right where you left off
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCookingSessions.map((act) => {
              const totalSteps = act.recipe.steps.length;
              const completedCount = act.sessionSteps.length;
              const progressPct =
                totalSteps > 0
                  ? Math.round((completedCount / totalSteps) * 100)
                  : 0;

              return (
                <div
                  key={act.id}
                  className="p-4 bg-[#FAF9F5] rounded-xl border border-[#DDDCD3] shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-base font-bold text-[#202723] truncate">
                      {act.recipe.title}
                    </h4>
                    <p className="text-xs text-[#202723]/60 truncate mb-2">
                      Cooked by {act.recipe.cookName}
                    </p>
                    <div className="w-full bg-[#EAE9E1] h-1.5 rounded-full overflow-hidden max-w-xs">
                      <div
                        className="bg-[#2E4742] h-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-[#202723]/60 mt-1 block">
                      Step {act.currentStepPosition + 1} of {totalSteps} &bull;{" "}
                      {completedCount} completed ({progressPct}%)
                    </span>
                  </div>

                  <Link href={`/cook/${act.recipe.id}`}>
                    <Button
                      size="sm"
                      variant="forest"
                      className="shrink-0 font-medium"
                    >
                      Resume
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Preserved Recipes */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#202723]">
              Recently Preserved Recipes
            </h2>
            <p className="text-xs text-[#202723]/60 mt-0.5">
              Heirloom recipes saved across all your family kitchen collections.
            </p>
          </div>
          {totalRecipes > 0 && (
            <Link
              href="/recipes"
              className="text-xs font-mono font-medium text-[#2E4742] hover:text-[#202723] flex items-center gap-1 group"
            >
              Browse All ({totalRecipes})
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {recentRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                hoverEffect
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={recipe.status === "VERIFIED" ? "sage" : "saffron"}
                      size="sm"
                    >
                      {recipe.status === "VERIFIED" ? "Verified" : "Draft"}
                    </Badge>
                    <span className="text-[11px] text-warm-500 font-medium">
                      {recipe.kitchenName}
                    </span>
                  </div>

                  <h3 className="font-display text-lg text-[#202723] font-bold">
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="hover:text-[#2E4742] transition-colors"
                    >
                      {recipe.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-[#202723]/60 mt-1 flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-[#2E4742]" />
                    As made by{" "}
                    <span className="font-medium text-[#202723]">
                      {recipe.cookName}
                    </span>
                  </p>

                  {recipe.description && (
                    <p className="text-xs text-[#202723]/70 mt-2 line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#202723]/60">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Sparkles className="w-3 h-3 text-[#F5B726]" />
                    {recipe.stepCount} steps • {recipe.ingredientCount} ingredients
                  </span>
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-[#2E4742] hover:text-[#202723] font-medium"
                  >
                    View Recipe &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ChefHat className="w-8 h-8" />}
            title="No Recipes Preserved Yet"
            description="Your family archive is waiting for its first dish. Document instructions, textual measurements, and sensory cues."
            action={
              <Link href="/recipes/new">
                <Button variant="forest" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                  Preserve Your First Recipe
                </Button>
              </Link>
            }
          />
        )}
      </div>

      {/* Recent Cooking Recordings Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#202723]">
              Recent Cooking Recordings
            </h2>
            <p className="text-xs text-[#202723]/60 mt-0.5">
              Original cooking videos uploaded directly to your private Cloudflare R2 vault.
            </p>
          </div>
          {totalVideos > 0 && (
            <Link
              href="/videos"
              className="text-xs font-mono font-medium text-[#2E4742] hover:text-[#202723] flex items-center gap-1 group"
            >
              Browse Vault ({totalVideos})
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVideos.map((video) => (
              <Card
                key={video.id}
                hoverEffect
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={video.uploadStatus === "UPLOADED" ? "forest" : "warm"}
                      size="sm"
                    >
                      {video.uploadStatus === "UPLOADED" ? "Ready" : video.uploadStatus}
                    </Badge>
                    <span className="text-[11px] font-mono text-[#202723]/60 font-medium">
                      {video.kitchen.name}
                    </span>
                  </div>

                  <h3 className="font-display text-base text-[#202723] font-bold line-clamp-1">
                    <Link
                      href={`/videos/${video.id}`}
                      className="hover:text-[#2E4742] transition-colors"
                    >
                      {video.originalFilename}
                    </Link>
                  </h3>

                  {video.recipe ? (
                    <p className="text-xs text-[#202723]/70 mt-1 truncate">
                      Linked to: <strong>{video.recipe.title}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-[#202723]/50 italic mt-1">
                      Unassigned recording
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#202723]/60">
                  <span className="font-mono text-[11px]">
                    {((video.actualSize ?? video.expectedSize) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <Link
                    href={`/videos/${video.id}`}
                    className="text-[#2E4742] hover:text-[#202723] font-medium flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Play &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-[#DDDCD3] text-center space-y-2">
            <p className="text-xs text-[#202723]/70">
              No cooking videos preserved yet. Capture your loved one preparing their signature dish.
            </p>
            <Link href="/upload">
              <Button variant="outline" size="sm">
                Upload Cooking Video
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Accessible Kitchen Collections Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#202723]">
              Your Family Kitchens
            </h2>
            <p className="text-xs text-[#202723]/60 mt-0.5">
              Spaces where you hold owner, editor, or viewer membership.
            </p>
          </div>
          <Link
            href="/kitchens"
            className="text-xs font-mono font-medium text-[#2E4742] hover:text-[#202723] flex items-center gap-1 group"
          >
            Manage Kitchens
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchens.map((k) => (
            <Card key={k.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={k.isOwner ? "forest" : "outline"} size="sm">
                    {k.isOwner ? "Owner" : k.myRole}
                  </Badge>
                  <span className="text-[11px] font-mono text-[#202723]/60">
                    {k.recipeCount} {k.recipeCount === 1 ? "recipe" : "recipes"}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#202723]">
                  <Link href={`/kitchens/${k.id}`} className="hover:text-[#2E4742]">
                    {k.name}
                  </Link>
                </h3>
                {k.description && (
                  <p className="text-xs text-[#202723]/70 mt-1 line-clamp-2">
                    {k.description}
                  </p>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#202723]/60">
                <span>By {k.ownerName}</span>
                <Link
                  href={`/kitchens/${k.id}`}
                  className="text-[#2E4742] hover:text-[#202723] font-medium"
                >
                  Open &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Loading kitchen overview..." />}>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
