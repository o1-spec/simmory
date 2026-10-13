import React, { Suspense } from "react";
import Link from "next/link";
import { BookOpen, Search, UploadCloud, ChefHat } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Saved Recipes — Simmory",
  description: "Browse all preserved family recipes and verified cooking timelines.",
};

async function RecipesContent() {
  const session = await requireUser("/recipes");

  const recipes = await db.recipe.findMany({
    where: {
      createdById: session.user.id,
    },
    include: {
      kitchen: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const verifiedCount = recipes.filter((r) => r.status === "VERIFIED").length;
  const inReviewCount = recipes.filter((r) => r.status === "IN_REVIEW").length;

  return (
    <>
      <PageHeader
        eyebrow="Recipe Catalog"
        title="Saved Recipes"
        description="All preserved family recipes, interactive timelines, and sensory cooking cues verified by original cooks."
        actions={
          <Link href="/upload">
            <Button
              variant="primary"
              size="md"
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Preserve New Recipe
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by dish name, cook, or sensory cue..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Badge variant="terracotta" className="cursor-pointer">
            All ({recipes.length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            Verified by Cook ({verifiedCount})
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            In Review ({inReviewCount})
          </Badge>
        </div>
      </div>

      {/* Render Real Recipes or Honest Empty State */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={recipe.status === "VERIFIED" ? "sage" : "saffron"} size="sm">
                    {recipe.status === "VERIFIED" ? "Verified" : "In Review"}
                  </Badge>
                  <span className="text-[11px] text-warm-500">{recipe.kitchen.name}</span>
                </div>
                <h3 className="font-serif text-lg text-warm-900 font-medium">
                  {recipe.title}
                </h3>
                {recipe.description && (
                  <p className="text-xs text-warm-600 mt-1 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </div>
              <div className="pt-4 mt-4 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
                <span>Created {recipe.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <Link
                  href={`/cook/${recipe.id}`}
                  className="text-terracotta-600 hover:text-terracotta-700 font-medium hover:underline"
                >
                  Cook Along &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          badge="Zero Recipes"
          title="No recipes saved in your kitchen yet"
          description="When you record and upload a cooking video, Simmory's AI pipeline will transcribe the audio and detect video cues. After your review and confirmation, the verified recipe will appear here."
          action={
            <Link href="/upload">
              <Button
                variant="primary"
                size="md"
                leftIcon={<ChefHat className="w-4 h-4" />}
              >
                Preserve a Recipe Now
              </Button>
            </Link>
          }
          note="Simmory does not generate mock recipes. Every recipe in your kitchen will come from authentic cooking video footage and human verification."
        />
      )}
    </>
  );
}

export default function RecipesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading saved recipes..." />}>
        <RecipesContent />
      </Suspense>
    </DashboardLayout>
  );
}
