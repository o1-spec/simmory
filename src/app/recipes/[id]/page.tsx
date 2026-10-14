import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChefHat,
  Sparkles,
  Eye,
  Clock,
  Heart,
  Edit,
  FolderHeart,
  Play,
  Video,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { getRecipeDetails } from "@/lib/services/recipes";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteRecipeSection } from "@/components/recipes/delete-recipe-section";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function RecipeDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: recipeId } = await params;
  const session = await requireUser(`/recipes/${recipeId}`);
  const recipe = await getRecipeDetails(recipeId, session.user.id);

  if (!recipe) {
    notFound();
  }

  const activeSession = await db.cookingSession.findFirst({
    where: {
      recipeId: recipe.id,
      userId: session.user.id,
      status: { in: ["IN_PROGRESS", "PAUSED"] },
    },
  });

  const isVerified = recipe.status === "VERIFIED_BY_COOK" || recipe.cookVerified;
  const isReviewed = recipe.status === "REVIEW_PENDING" || recipe.reviewedAt != null;

  return (
    <article className="max-w-4xl mx-auto pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href={`/kitchens/${recipe.kitchenId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {recipe.kitchen.name}
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/cook/${recipe.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5 fill-white text-terracotta-600" />}
              className="font-medium"
            >
              {activeSession ? "Continue Cooking" : "Start Cooking"}
            </Button>
          </Link>

          {recipe.canEdit && (
            <>
              <Link href={`/recipes/${recipe.id}/edit`}>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit className="w-3.5 h-3.5" />}
                >
                  Edit Recipe
                </Button>
              </Link>
              <DeleteRecipeSection
                recipeId={recipe.id}
                recipeTitle={recipe.title}
                redirectUrl={`/kitchens/${recipe.kitchenId}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Editorial Header */}
      <header className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-xs mb-8">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <Badge
            variant={isVerified ? "sage" : isReviewed ? "terracotta" : "saffron"}
            size="sm"
          >
            {isVerified
              ? "Verified by Cook"
              : isReviewed
                ? "Human Reviewed"
                : "Draft Preservation"}
          </Badge>
          {recipe.cookVerifiedBy && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Attested by {recipe.cookVerifiedBy}
            </span>
          )}
          <Link
            href={`/kitchens/${recipe.kitchenId}`}
            className="text-xs text-warm-500 hover:text-terracotta-700 flex items-center gap-1 transition-colors"
          >
            <FolderHeart className="w-3.5 h-3.5 text-warm-400" />
            {recipe.kitchen.name}
          </Link>
          {recipe.origin && (
            <span className="text-xs text-warm-400">
              • Origin: <span className="text-warm-700">{recipe.origin}</span>
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-warm-900 tracking-tight leading-tight">
          {recipe.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-warm-100 text-xs text-warm-600">
          <span className="flex items-center gap-1.5 font-medium text-warm-800">
            <ChefHat className="w-4 h-4 text-terracotta-600" />
            As cooked by {recipe.cookName}
          </span>
          <span className="text-warm-300">•</span>
          <span>
            Documented by {recipe.createdBy.name} on{" "}
            {new Date(recipe.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {recipe.description && (
          <p className="mt-4 text-sm text-warm-700 leading-relaxed max-w-2xl">
            {recipe.description}
          </p>
        )}

        {/* Attached Cooking Videos & Media */}
        {recipe.videos && recipe.videos.length > 0 ? (
          <div className="mt-6 pt-6 border-t border-warm-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-600 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-terracotta-500" />
                Original Cooking Footage ({recipe.videos.length})
              </h3>
              {recipe.canEdit && (
                <Link
                  href={`/upload?kitchenId=${recipe.kitchenId}&recipeId=${recipe.id}`}
                  className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium"
                >
                  + Add Footage
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipe.videos.map((vid) => (
                <div
                  key={vid.id}
                  className="p-3.5 bg-warm-50 rounded-xl border border-warm-200/60 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-3">
                    <p className="font-medium text-warm-900 truncate">
                      {vid.originalFilename}
                    </p>
                    <p className="text-[11px] text-warm-500">
                      {((vid.actualSize ?? vid.expectedSize) / (1024 * 1024)).toFixed(1)} MB &bull;{" "}
                      {vid.uploadStatus === "UPLOADED" ? "Ready" : vid.uploadStatus}
                    </p>
                  </div>
                  <Link
                    href={`/videos/${vid.id}`}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-terracotta-500 text-white font-medium hover:bg-terracotta-600 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-warm-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-warm-500">
              No cooking video attached to this recipe yet.
            </div>
            {recipe.canEdit && (
              <Link href={`/upload?kitchenId=${recipe.kitchenId}&recipeId=${recipe.id}`}>
                <Button variant="outline" size="sm" leftIcon={<Video className="w-3.5 h-3.5" />}>
                  Upload Cooking Footage
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Family Story & Culinary Memory (Editorial Quote Block) */}
      {recipe.story && (
        <section className="mb-8 p-6 sm:p-8 bg-terracotta-50/50 rounded-3xl border border-terracotta-200/60 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-terracotta-500 shrink-0 mt-1" />
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-terracotta-900">
                Culinary Heritage & Memory
              </h2>
              <p className="font-serif italic text-base sm:text-lg text-warm-900 leading-relaxed pt-1">
                &ldquo;{recipe.story}&rdquo;
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Preparation Notes */}
      {recipe.notes && (
        <section className="mb-8 p-5 bg-warm-50 rounded-2xl border border-warm-200/80 text-xs text-warm-700 space-y-1">
          <span className="font-semibold text-warm-900 uppercase tracking-wider text-[11px]">
            Preparation Instincts & Notes:
          </span>
          <p className="leading-relaxed">{recipe.notes}</p>
        </section>
      )}

      {/* Structured Recipe Content: Ingredients & Steps */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Ingredients Column */}
        <section className="md:col-span-5 bg-white rounded-3xl border border-warm-200 p-6 sm:p-7 space-y-5 h-fit shadow-xs">
          <div className="border-b border-warm-100 pb-3">
            <h2 className="font-serif text-xl font-medium text-warm-900">
              Ingredients
            </h2>
            <p className="text-xs text-warm-500 mt-0.5">
              {recipe.ingredients.length} items recorded
            </p>
          </div>

          {recipe.ingredients.length > 0 ? (
            <ul className="space-y-3">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-start gap-2.5 text-xs text-warm-800 py-1 border-b border-warm-50 last:border-b-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 shrink-0 mt-1.5" />
                  <div className="flex-1 leading-relaxed">
                    {ing.quantity && (
                      <span className="font-semibold text-warm-900 mr-1.5">
                        {ing.quantity}
                      </span>
                    )}
                    <span>{ing.name}</span>
                    {ing.notes && (
                      <span className="text-warm-400 italic ml-1">
                        ({ing.notes})
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-warm-400 italic">No ingredients recorded yet.</p>
          )}
        </section>

        {/* Cooking Steps Column */}
        <section className="md:col-span-7 bg-white rounded-3xl border border-warm-200 p-6 sm:p-7 space-y-6 shadow-xs">
          <div className="border-b border-warm-100 pb-3">
            <h2 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Cooking Steps & Sensory Cues
            </h2>
            <p className="text-xs text-warm-500 mt-0.5">
              Preserving original instincts, visual tells, and sounds.
            </p>
          </div>

          {recipe.steps.length > 0 ? (
            <div className="space-y-6">
              {recipe.steps.map((st, index) => (
                <div key={st.id} className="space-y-2.5 relative pl-7">
                  {/* Step Number Dot */}
                  <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-warm-100 text-warm-800 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </div>

                  <p className="text-sm text-warm-900 leading-relaxed font-sans">
                    {st.instruction}
                  </p>

                  {/* Prominent Sensory Cue Callout */}
                  {st.sensoryCue && (
                    <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/90 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Sensory Tell / Cooking Cue</span>
                      </div>
                      <p className="text-xs text-amber-950 font-serif italic pl-5 leading-relaxed">
                        &ldquo;{st.sensoryCue}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-warm-500 pt-0.5">
                    {st.videoTimestampStart != null && (
                      <Link
                        href={recipe.videos[0] ? `/videos/${recipe.videos[0].id}` : "#"}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 border border-terracotta-200/80 transition-colors font-mono"
                        title="View video moment"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>
                          {Math.floor(st.videoTimestampStart / 60).toString().padStart(2, "0")}:
                          {(st.videoTimestampStart % 60).toString().padStart(2, "0")}
                        </span>
                      </Link>
                    )}
                    {st.duration && (
                      <span className="flex items-center gap-1 text-warm-600">
                        <Clock className="w-3 h-3 text-warm-400" />
                        {st.duration}
                      </span>
                    )}
                    {st.notes && (
                      <span className="italic text-warm-400">
                        Cook note: {st.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-warm-400 italic">No instructions recorded yet.</p>
          )}
        </section>
      </div>
    </article>
  );
}

export default function RecipeDetailPage({ params }: PageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Loading preserved recipe..." />}>
        <RecipeDetailContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
