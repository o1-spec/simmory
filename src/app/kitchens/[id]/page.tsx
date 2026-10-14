import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Plus,
  Users,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
  ChefHat,
  Calendar,
  Video,
  Play,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { getKitchenDetails } from "@/lib/services/kitchens";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { KitchenSettingsDialog } from "@/components/kitchens/kitchen-settings-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function KitchenDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: kitchenId } = await params;
  const session = await requireUser(`/kitchens/${kitchenId}`);
  const kitchen = await getKitchenDetails(kitchenId, session.user.id);

  if (!kitchen) {
    notFound();
  }

  const isOwner = kitchen.isOwner;
  const canAddRecipes =
    kitchen.myRole === "OWNER" ||
    kitchen.myRole === "EDITOR" ||
    kitchen.myRole === "ADMIN";

  const roleLabel =
    kitchen.myRole === "OWNER"
      ? "Owner"
      : kitchen.myRole === "EDITOR"
      ? "Editor"
      : "Viewer";

  return (
    <>
      <div className="mb-4">
        <Link
          href="/kitchens"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Family Kitchens
        </Link>
      </div>

      <PageHeader
        eyebrow={`Family Archive • ${roleLabel}`}
        title={kitchen.name}
        description={
          kitchen.description ||
          `Created by ${kitchen.owner.name} to preserve family culinary instincts and memories.`
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {isOwner && (
              <KitchenSettingsDialog
                kitchen={{
                  id: kitchen.id,
                  name: kitchen.name,
                  description: kitchen.description,
                }}
              />
            )}
            {canAddRecipes && (
              <>
                <Link href={`/upload?kitchenId=${kitchen.id}`}>
                  <Button variant="outline" size="md">
                    Upload Video
                  </Button>
                </Link>
                <Link href={`/recipes/new?kitchenId=${kitchen.id}`}>
                  <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                    Add Recipe to Kitchen
                  </Button>
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Column: Recipe Collection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-warm-200 pb-3">
            <h2 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-terracotta-600" />
              Recipes ({kitchen.recipes.length})
            </h2>
            {canAddRecipes && kitchen.recipes.length > 0 && (
              <Link
                href={`/recipes/new?kitchenId=${kitchen.id}`}
                className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700"
              >
                + Add Recipe
              </Link>
            )}
          </div>

          {kitchen.recipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kitchen.recipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  hoverEffect
                  className="p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          recipe.status === "VERIFIED_BY_COOK" || recipe.status === "VERIFIED"
                            ? "sage"
                            : recipe.status === "REVIEW_PENDING"
                              ? "terracotta"
                              : "saffron"
                        }
                        size="sm"
                      >
                        {recipe.status === "VERIFIED_BY_COOK" || recipe.status === "VERIFIED"
                          ? "Verified by Cook"
                          : recipe.status === "REVIEW_PENDING"
                            ? "Reviewed"
                            : "Draft"}
                      </Badge>
                      <span className="text-[11px] text-warm-500 flex items-center gap-1">
                        <ChefHat className="w-3 h-3 text-warm-400" />
                        {recipe.cookName}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-medium text-warm-900">
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="hover:text-terracotta-700 transition-colors"
                      >
                        {recipe.title}
                      </Link>
                    </h3>

                    {recipe.description && (
                      <p className="text-xs text-warm-600 mt-1 line-clamp-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
                    <span>
                      {recipe._count.ingredients} ingredients • {recipe._count.steps} steps
                    </span>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="text-terracotta-600 hover:text-terracotta-700 font-medium"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ChefHat className="w-8 h-8" />}
              title="No Recipes in this Kitchen Yet"
              description="Preserve the first family recipe here with ingredient notes, instincts, and sensory tells."
              action={
                canAddRecipes ? (
                  <Link href={`/recipes/new?kitchenId=${kitchen.id}`}>
                    <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                      Preserve First Recipe
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          )}

          {/* Cooking Videos Section */}
          <div className="pt-8 border-t border-warm-200">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3 mb-6">
              <h2 className="font-serif text-xl font-medium text-warm-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-terracotta-600" />
                Original Cooking Videos ({kitchen.videos.length})
              </h2>
              {canAddRecipes && (
                <Link
                  href={`/upload?kitchenId=${kitchen.id}`}
                  className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700"
                >
                  + Upload Video
                </Link>
              )}
            </div>

            {kitchen.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kitchen.videos.map((video) => (
                  <Card key={video.id} hoverEffect className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={video.uploadStatus === "UPLOADED" ? "sage" : "warm"}
                          size="sm"
                        >
                          {video.uploadStatus === "UPLOADED" ? "Ready" : video.uploadStatus}
                        </Badge>
                        <span className="text-[11px] text-warm-500">
                          {((video.actualSize ?? video.expectedSize) / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-medium text-warm-900 line-clamp-1">
                        <Link
                          href={`/videos/${video.id}`}
                          className="hover:text-terracotta-700 transition-colors"
                        >
                          {video.originalFilename}
                        </Link>
                      </h3>

                      {video.recipe && (
                        <p className="text-xs text-warm-500 mt-1 truncate">
                          Linked to: <strong>{video.recipe.title}</strong>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
                      <span>By {video.uploadedBy.name}</span>
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/review/${video.id}`}
                          className="text-warm-600 hover:text-warm-900 font-medium text-xs transition-colors"
                        >
                          Review
                        </Link>
                        <Link
                          href={`/videos/${video.id}`}
                          className="text-terracotta-600 hover:text-terracotta-700 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Play &rarr;
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-warm-50/70 rounded-2xl border border-warm-200/60 text-center space-y-2">
                <p className="text-xs text-warm-600">
                  No cooking footage preserved in this kitchen yet.
                </p>
                {canAddRecipes && (
                  <Link href={`/upload?kitchenId=${kitchen.id}`}>
                    <Button variant="outline" size="sm">
                      Upload Cooking Video
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column: Kitchen Metadata & Members */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-warm-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-warm-400" />
              Kitchen Overview
            </h3>

            <div className="space-y-3 text-xs text-warm-700">
              <div className="flex items-center justify-between py-1.5 border-b border-warm-100">
                <span className="text-warm-500">Curator / Owner</span>
                <span className="font-medium text-warm-900">{kitchen.owner.name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-warm-100">
                <span className="text-warm-500">Your Permission</span>
                <Badge variant={isOwner ? "sage" : "outline"} size="sm">
                  {roleLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-warm-100">
                <span className="text-warm-500">Preserved Recipes</span>
                <span className="font-medium text-warm-900">{kitchen.recipes.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-warm-500">Established</span>
                <span className="text-warm-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-warm-400" />
                  {new Date(kitchen.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Members List */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-warm-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-warm-400" />
              Members ({kitchen.members.length})
            </h3>

            <div className="space-y-3">
              {kitchen.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-warm-50/70 border border-warm-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-semibold flex items-center justify-center">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-warm-900">{member.user.name}</p>
                      <p className="text-[10px] text-warm-500">{member.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {member.role === "OWNER"
                      ? "Owner"
                      : member.role === "EDITOR"
                      ? "Editor"
                      : "Viewer"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function KitchenDetailPage({ params }: PageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Loading kitchen details..." />}>
        <KitchenDetailContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
