import React, { Suspense } from "react";
import Link from "next/link";
import {
  ChefHat,
  BookOpen,
  FolderHeart,
  Video,
  Plus,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/db";
import { listUserKitchens } from "@/lib/services/kitchens";
import { listUserRecipes } from "@/lib/services/recipes";
import { listUserVideos } from "@/lib/services/videos";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "My Kitchen — Simmory",
  description: "Your family's personal digital cookbook and cooking memories archive.",
};

async function DashboardContent() {
  const session = await requireUser("/dashboard");

  // Fetch authentic user data in parallel
  const [
    kitchens,
    recentRecipesResult,
    recentVideosResult,
    pendingReviews,
    activeCookingSessions,
  ] = await Promise.all([
    listUserKitchens(session.user.id),
    listUserRecipes(session.user.id, { page: 1, limit: 6 }),
    listUserVideos(session.user.id, { page: 1, limit: 4 }),
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
        createdAt: true,
        kitchen: { select: { id: true, name: true } },
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
            steps: { select: { id: true, position: true } },
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

  const primaryKitchen = kitchens[0];
  const isCompletelyEmpty = totalRecipes === 0 && totalVideos === 0;

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* =================================================================== */}
      {/* SECTION 1: PERSONAL WELCOME & ACTIONS                               */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DDDCD3]">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F5] border border-[#DDDCD3] text-[11px] font-mono uppercase tracking-wider text-[#2E4742] font-semibold">
              <ChefHat className="w-3.5 h-3.5 text-[#2E4742]" />
              <span>Chef &amp; Archivist, {session.user.name}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202723] tracking-tight leading-[1.05]">
              Welcome to your kitchen.
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#525B56] leading-relaxed">
              Your recipes, cooking memories, and family traditions, all in one place.
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/upload">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Video className="w-4 h-4 text-[#2E4742]" />}
                className="rounded-full shadow-2xs font-medium"
              >
                Upload Video
              </Button>
            </Link>

            <Link href="/recipes/new">
              <Button
                variant="forest"
                size="md"
                leftIcon={<Plus className="w-4 h-4 text-[#F5B726]" />}
                className="rounded-full shadow-xs font-semibold"
              >
                Preserve a Recipe
              </Button>
            </Link>
          </div>
        </div>

        {/* Compact Editorial Stats Ribbon */}
        <div className="inline-flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 px-4 py-2.5 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] text-xs font-mono text-[#525B56] shadow-2xs">
          <span className="flex items-center gap-2 text-[#202723] font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-[#2E4742]" />
            <span>
              {totalRecipes} {totalRecipes === 1 ? "Preserved Recipe" : "Preserved Recipes"}
            </span>
          </span>

          <span className="text-[#DDDCD3] hidden sm:inline">&bull;</span>

          <span className="flex items-center gap-2 text-[#202723]">
            <FolderHeart className="w-3.5 h-3.5 text-[#2E4742]" />
            <span>
              {totalKitchens} {totalKitchens === 1 ? "Family Kitchen" : "Family Kitchens"}
            </span>
          </span>

          <span className="text-[#DDDCD3] hidden sm:inline">&bull;</span>

          <span className="flex items-center gap-2 text-[#202723]">
            <Video className="w-3.5 h-3.5 text-[#2E4742]" />
            <span>
              {totalVideos} {totalVideos === 1 ? "Cooking Recording" : "Cooking Recordings"}
            </span>
          </span>

          {activeCookingSessions.length > 0 && (
            <>
              <span className="text-[#DDDCD3] hidden sm:inline">&bull;</span>
              <span className="flex items-center gap-1.5 text-[#2E4742] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#2E4742] animate-pulse" />
                <span>Cooking in progress</span>
              </span>
            </>
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 2: CONTINUE COOKING (ACTIVE SESSIONS)                        */}
      {/* =================================================================== */}
      {activeCookingSessions.length > 0 && (
        <section className="p-6 sm:p-7 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E4742] animate-pulse" />
              <h2 className="font-display text-xl font-bold text-[#202723]">
                Continue Cooking — Active Session
              </h2>
            </div>
            <span className="text-xs font-mono text-[#525B56] hidden sm:inline">
              Pick up right where you left off
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="p-5 rounded-xl bg-white border border-[#DDDCD3] flex flex-col justify-between gap-4 shadow-2xs hover:border-[#2E4742]/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#2E4742] font-semibold text-[11px]">
                        Step {act.currentStepPosition + 1} of {totalSteps}
                      </span>
                      <span className="font-mono text-[#7A857F] text-[11px]">
                        {progressPct}% complete
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#202723] line-clamp-1">
                      {act.recipe.title}
                    </h3>

                    <p className="text-xs text-[#525B56]">
                      As prepared by {act.recipe.cookName}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#EAE9E1] h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-[#2E4742] h-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#7A857F]">
                      {completedCount} steps verified
                    </span>
                    <Link href={`/cook/${act.recipe.id}`}>
                      <Button
                        size="sm"
                        variant="forest"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="rounded-full font-medium"
                      >
                        Resume Cook Along
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 3: REVIEWS THAT NEED ATTENTION                              */}
      {/* =================================================================== */}
      {pendingReviews.length > 0 && (
        <section className="p-6 rounded-2xl bg-[#FAF9F5] border-l-4 border-l-[#2E4742] border-[#DDDCD3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5B726]" />
              <h2 className="font-display text-base sm:text-lg font-bold text-[#202723]">
                Recipe Reconstruction Ready for Review
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#525B56] leading-relaxed">
              AI analysis is complete for &ldquo;
              {pendingReviews[0].originalFilename.replace(/\.[^/.]+$/, "")}
              &rdquo;. Confirm extracted culinary cues and preserve the family recipe.
            </p>
          </div>

          <div className="shrink-0">
            <Link href={`/review/${pendingReviews[0].id}`}>
              <Button
                size="md"
                variant="forest"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="rounded-full shadow-xs"
              >
                Review Recipe Steps
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 4: FIRST-USE / EMPTY DASHBOARD EXPERIENCE                   */}
      {/* =================================================================== */}
      {isCompletelyEmpty && (
        <section className="p-8 sm:p-12 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center mx-auto shadow-2xs">
              <BookOpen className="w-7 h-7" />
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#202723] tracking-tight">
              Your family cookbook starts here.
            </h2>

            <p className="font-sans text-sm sm:text-base text-[#525B56] leading-relaxed">
              Save a recipe you love, or record someone preparing a dish worth remembering.
            </p>
          </div>

          {/* Two Clear Starting Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Path 1: Document Recipe */}
            <div className="p-6 rounded-2xl bg-white border border-[#DDDCD3] flex flex-col justify-between space-y-5 hover:border-[#2E4742]/40 transition-colors shadow-2xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E4742] text-[#F2F2EB] flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#202723]">
                  Start with a Recipe
                </h3>
                <p className="font-sans text-xs text-[#525B56] leading-relaxed">
                  Document ingredients in qualitative pinches, handfuls, or family amounts.
                  Record unspoken sensory checkpoints and grandmother&apos;s rules.
                </p>
              </div>

              <Link href="/recipes/new">
                <Button
                  variant="forest"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full justify-center rounded-xl"
                >
                  Preserve Your First Recipe
                </Button>
              </Link>
            </div>

            {/* Path 2: Upload Video */}
            <div className="p-6 rounded-2xl bg-white border border-[#DDDCD3] flex flex-col justify-between space-y-5 hover:border-[#2E4742]/40 transition-colors shadow-2xs">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#202723]">
                  Start with a Video
                </h3>
                <p className="font-sans text-xs text-[#525B56] leading-relaxed">
                  Upload raw cooking footage of someone at the stove. Simmory analyzes the
                  audio and visual cues to help reconstruct the exact heirloom dish.
                </p>
              </div>

              <Link href="/upload">
                <Button
                  variant="secondary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full justify-center rounded-xl"
                >
                  Upload a Cooking Video
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs font-mono text-[#7A857F]">
              Tip: You can document recipes even if you only know rough steps &mdash; Simmory is built for unwritten family wisdom.
            </p>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 5: YOUR RECIPES (EDITORIAL RECIPE GRID)                     */}
      {/* =================================================================== */}
      {totalRecipes > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#202723] tracking-tight">
                Your Recipes
              </h2>
              <p className="text-xs sm:text-sm text-[#525B56] mt-0.5 font-sans">
                Heirloom recipes saved across your family kitchen collections.
              </p>
            </div>

            <Link
              href="/recipes"
              className="text-xs font-mono font-semibold text-[#2E4742] hover:underline underline-offset-4 flex items-center gap-1 group"
            >
              Browse All ({totalRecipes})
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="group rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] p-5 flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-[#2E4742]/50 transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Status & Kitchen Tag */}
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant={recipe.status === "VERIFIED" ? "forest" : "saffron"}
                      size="sm"
                      className="rounded-full text-[10px]"
                    >
                      {recipe.status === "VERIFIED" ? "Verified Recipe" : "Kitchen Draft"}
                    </Badge>

                    <span className="text-[11px] font-mono text-[#7A857F] truncate max-w-[140px]">
                      {recipe.kitchenName}
                    </span>
                  </div>

                  {/* Recipe Title */}
                  <h3 className="font-display text-xl font-bold text-[#202723] group-hover:text-[#2E4742] transition-colors leading-snug">
                    <Link href={`/recipes/${recipe.id}`} className="hover:underline">
                      {recipe.title}
                    </Link>
                  </h3>

                  {/* Cook Attribution */}
                  <p className="text-xs text-[#525B56] flex items-center gap-1.5 font-medium">
                    <ChefHat className="w-3.5 h-3.5 text-[#2E4742] shrink-0" />
                    <span>As made by {recipe.cookName}</span>
                  </p>

                  {/* Description / Story Snippet */}
                  {recipe.description && (
                    <p className="text-xs text-[#525B56] line-clamp-2 leading-relaxed pt-1">
                      {recipe.description}
                    </p>
                  )}
                </div>

                {/* Footer Metadata & Actions */}
                <div className="pt-4 mt-4 border-t border-[#DDDCD3]/70 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#7A857F]">
                    {recipe.stepCount} steps &bull; {recipe.ingredientCount} ingredients
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/cook/${recipe.id}`}>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E4742] hover:underline underline-offset-2">
                        <Play className="w-3 h-3 fill-current" />
                        Cook
                      </span>
                    </Link>
                    <span className="text-[#DDDCD3]">&bull;</span>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="text-xs font-medium text-[#525B56] hover:text-[#202723]"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 6: COOKING MEMORIES (RECENT COOKING VIDEOS)                 */}
      {/* =================================================================== */}
      {totalVideos > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#202723] tracking-tight">
                Cooking Memories
              </h2>
              <p className="text-xs sm:text-sm text-[#525B56] mt-0.5 font-sans">
                Original video recordings preserved in your private family archive.
              </p>
            </div>

            <Link
              href="/videos"
              className="text-xs font-mono font-semibold text-[#2E4742] hover:underline underline-offset-4 flex items-center gap-1 group"
            >
              Browse Vault ({totalVideos})
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="group rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] p-4 flex flex-col justify-between shadow-2xs hover:shadow-sm hover:border-[#2E4742]/50 transition-all duration-200"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A857F]">
                      {video.kitchen.name}
                    </span>
                    <Badge variant="outline" size="sm" className="text-[9px] rounded-full">
                      Ready
                    </Badge>
                  </div>

                  <h3 className="font-display text-base font-bold text-[#202723] line-clamp-1 group-hover:text-[#2E4742] transition-colors">
                    <Link href={`/videos/${video.id}`}>
                      {video.originalFilename.replace(/\.[^/.]+$/, "")}
                    </Link>
                  </h3>

                  {video.recipe ? (
                    <p className="text-xs text-[#525B56] truncate">
                      Linked: <strong className="text-[#202723]">{video.recipe.title}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-[#7A857F] italic">
                      Family recording
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-[#DDDCD3]/70 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-[#7A857F]">
                    {((video.actualSize ?? video.expectedSize) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <Link
                    href={`/videos/${video.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-xs text-[#2E4742] hover:underline"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 7: YOUR FAMILY KITCHEN SHOWCASE                             */}
      {/* =================================================================== */}
      {primaryKitchen && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#202723] tracking-tight">
                Family Kitchen Collections
              </h2>
              <p className="text-xs sm:text-sm text-[#525B56]">
                Spaces where you hold owner, editor, or viewer membership.
              </p>
            </div>

            <Link
              href="/kitchens"
              className="text-xs font-mono font-semibold text-[#2E4742] hover:underline underline-offset-4 flex items-center gap-1 group"
            >
              All Spaces ({totalKitchens})
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kitchens.map((k) => (
              <div
                key={k.id}
                className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] flex flex-col justify-between shadow-2xs hover:border-[#2E4742]/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={k.isOwner ? "forest" : "outline"} size="sm" className="rounded-full text-[10px]">
                      {k.isOwner ? "Owner" : k.myRole}
                    </Badge>
                    <span className="font-mono text-[11px] text-[#7A857F]">
                      {k.recipeCount} {k.recipeCount === 1 ? "recipe" : "recipes"}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#202723]">
                    <Link href={`/kitchens/${k.id}`} className="hover:text-[#2E4742] transition-colors">
                      {k.name}
                    </Link>
                  </h3>

                  {k.description ? (
                    <p className="text-xs text-[#525B56] line-clamp-2 leading-relaxed">
                      {k.description}
                    </p>
                  ) : (
                    <p className="text-xs text-[#7A857F] italic">
                      Private family archive collection
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-[#DDDCD3]/70 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#7A857F]">
                    By {k.ownerName}
                  </span>
                  <Link
                    href={`/kitchens/${k.id}`}
                    className="font-semibold text-xs text-[#2E4742] hover:underline"
                  >
                    Open Archive &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Opening your kitchen archive..." />}>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
