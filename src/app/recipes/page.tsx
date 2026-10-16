import React, { Suspense } from "react";
import Link from "next/link";
import { Plus, ChefHat, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { listUserRecipes } from "@/lib/services/recipes";
import { listUserKitchens } from "@/lib/services/kitchens";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RecipeFilters } from "@/components/recipes/recipe-filters";
import { RecipeStatus } from "@/generated/prisma/client";

export const metadata = {
  title: "Preserved Recipes — Simmory",
  description: "Browse preserved family recipes, authentic cooking timelines, and sensory cues.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    kitchenId?: string;
    status?: string;
    page?: string;
  }>;
}

async function RecipesContent({ searchParams }: PageProps) {
  const session = await requireUser("/recipes");
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10) || 1;
  const query = params.q || undefined;
  const kitchenId = params.kitchenId || undefined;

  let status: RecipeStatus | undefined;
  if (
    params.status &&
    Object.values(RecipeStatus).includes(params.status as RecipeStatus)
  ) {
    status = params.status as RecipeStatus;
  }

  const [recipesResult, kitchens] = await Promise.all([
    listUserRecipes(session.user.id, {
      query,
      kitchenId,
      status,
      page,
      limit: 12,
    }),
    listUserKitchens(session.user.id),
  ]);

  const { recipes, pagination } = recipesResult;

  return (
    <>
      <PageHeader
        eyebrow="Family Recipe Collection"
        title="Saved Recipes"
        description="Every preserved dish, original cook's instinct, and sensory tell across all your accessible family spaces."
        actions={
          <Link href="/recipes/new">
            <Button
              variant="forest"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Preserve New Recipe
            </Button>
          </Link>
        }
      />

      <RecipeFilters
        kitchens={kitchens.map((k) => ({ id: k.id, name: k.name }))}
        currentQuery={query}
        currentKitchenId={kitchenId}
        currentStatus={params.status}
        totalCount={pagination.total}
      />

      {recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                hoverEffect
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={recipe.status === "VERIFIED" ? "forest" : "ochre"}
                      size="sm"
                    >
                      {recipe.status === "VERIFIED" ? "Verified" : "Draft"}
                    </Badge>
                    <span className="text-[11px] font-mono text-[#202723]/60 font-medium">
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
                    className="text-[#2E4742] hover:text-[#202723] font-medium flex items-center gap-1"
                  >
                    View Recipe &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4 pb-12 border-t border-warm-200">
              {page > 1 && (
                <Link
                  href={`/recipes?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${kitchenId ? `&kitchenId=${kitchenId}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                >
                  <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Previous
                  </Button>
                </Link>
              )}
              <span className="text-xs text-warm-600 font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              {page < pagination.totalPages && (
                <Link
                  href={`/recipes?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${kitchenId ? `&kitchenId=${kitchenId}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                >
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Next
                  </Button>
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<ChefHat className="w-8 h-8" />}
          title={query ? "No Matching Recipes" : "No Preserved Recipes Yet"}
          description={
            query
              ? `We couldn't find any recipes matching "${query}". Try adjusting your search or filters.`
              : "Start building your family recipe archive by preserving your first dish with unwritten instincts and sensory tells."
          }
          action={
            <Link href="/recipes/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Preserve a Recipe
              </Button>
            </Link>
          }
        />
      )}
    </>
  );
}

export default function RecipesPage({ searchParams }: PageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Loading saved recipes..." />}>
        <RecipesContent searchParams={searchParams} />
      </Suspense>
    </DashboardLayout>
  );
}
