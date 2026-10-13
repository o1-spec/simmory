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
import { listUserKitchens } from "@/lib/services/kitchens";
import { listUserRecipes } from "@/lib/services/recipes";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CreateKitchenDialog } from "@/components/kitchens/create-kitchen-dialog";

export const metadata = {
  title: "Kitchen Overview — Simmory",
  description: "Your family's private space for preserving unwritten recipes and cooking memories.",
};

async function DashboardContent() {
  const session = await requireUser("/dashboard");

  // Query authentic metrics in parallel without N+1
  const [kitchens, recentRecipesResult] = await Promise.all([
    listUserKitchens(session.user.id),
    listUserRecipes(session.user.id, { page: 1, limit: 6 }),
  ]);

  const { recipes: recentRecipes, pagination } = recentRecipesResult;
  const totalRecipes = pagination.total;
  const totalKitchens = kitchens.length;

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${session.user.name}`}
        title="Kitchen Overview"
        description="Your family's private archive for preserving unwritten recipes, sensory cues, and personal culinary heritage."
        actions={
          <div className="flex items-center gap-2.5">
            <CreateKitchenDialog triggerText="New Kitchen" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-500">
              Preserved Recipes
            </span>
            <div className="w-8 h-8 rounded-lg bg-warm-100 text-warm-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-warm-900">
              {totalRecipes}
            </span>
            <span className="text-xs text-warm-500">
              {totalRecipes === 1 ? "recipe saved" : "recipes saved"}
            </span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">
            {totalRecipes === 0 ? "Ready for your first family recipe" : "Preserved in family archive"}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-500">
              Family Kitchens
            </span>
            <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
              <FolderHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-warm-900">
              {totalKitchens}
            </span>
            <span className="text-xs text-warm-500">
              {totalKitchens === 1 ? "active space" : "active spaces"}
            </span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">
            {totalKitchens === 1 ? "Default family space active" : "Multi-generational collections"}
          </p>
        </Card>

        <Card className="p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-500">
              Cooking Knowledge
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-warm-900">
              100%
            </span>
            <span className="text-xs text-warm-500">human-verified</span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">
            Unwritten instincts captured in original cooks&apos; voices
          </p>
        </Card>
      </div>

      {/* Recently Preserved Recipes */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-warm-900">
              Recently Preserved Recipes
            </h2>
            <p className="text-xs text-warm-500 mt-0.5">
              Heirloom recipes saved across all your family kitchen collections.
            </p>
          </div>
          {totalRecipes > 0 && (
            <Link
              href="/recipes"
              className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 group"
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

                  <h3 className="font-serif text-lg text-warm-900 font-medium">
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="hover:text-terracotta-700 transition-colors"
                    >
                      {recipe.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-warm-500 mt-1 flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-terracotta-500" />
                    As made by{" "}
                    <span className="font-medium text-warm-800">
                      {recipe.cookName}
                    </span>
                  </p>

                  {recipe.description && (
                    <p className="text-xs text-warm-600 mt-2 line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {recipe.stepCount} steps • {recipe.ingredientCount} ingredients
                  </span>
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-terracotta-600 hover:text-terracotta-700 font-medium"
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
                <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                  Preserve Your First Recipe
                </Button>
              </Link>
            }
          />
        )}
      </div>

      {/* Accessible Kitchen Collections Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-warm-900">
              Your Family Kitchens
            </h2>
            <p className="text-xs text-warm-500 mt-0.5">
              Spaces where you hold owner, editor, or viewer membership.
            </p>
          </div>
          <Link
            href="/kitchens"
            className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 group"
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
                  <Badge variant={k.isOwner ? "sage" : "outline"} size="sm">
                    {k.isOwner ? "Owner" : k.myRole}
                  </Badge>
                  <span className="text-[11px] text-warm-500">
                    {k.recipeCount} {k.recipeCount === 1 ? "recipe" : "recipes"}
                  </span>
                </div>
                <h3 className="font-serif text-base font-medium text-warm-900">
                  <Link href={`/kitchens/${k.id}`} className="hover:text-terracotta-700">
                    {k.name}
                  </Link>
                </h3>
                {k.description && (
                  <p className="text-xs text-warm-600 mt-1 line-clamp-2">
                    {k.description}
                  </p>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
                <span>By {k.ownerName}</span>
                <Link
                  href={`/kitchens/${k.id}`}
                  className="text-terracotta-600 hover:text-terracotta-700 font-medium"
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
