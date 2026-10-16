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
  Settings,
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
              <Link href={`/kitchens/${kitchen.id}/settings`}>
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Kitchen Settings
                </Button>
              </Link>
            )}
            {canAddRecipes && (
              <>
                <Link href={`/upload?kitchenId=${kitchen.id}`}>
                  <Button variant="outline" size="md">
                    Upload Video
                  </Button>
                </Link>
                <Link href={`/recipes/new?kitchenId=${kitchen.id}`}>
                  <Button variant="forest" size="md" leftIcon={<Plus className="w-4 h-4" />}>
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
          <div className="flex items-center justify-between border-b border-[#DDDCD3] pb-3">
            <h2 className="font-display text-2xl font-bold text-[#202723] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2E4742]" />
              Recipes ({kitchen.recipes.length})
            </h2>
            {canAddRecipes && kitchen.recipes.length > 0 && (
              <Link
                href={`/recipes/new?kitchenId=${kitchen.id}`}
                className="text-xs font-mono font-medium text-[#2E4742] hover:text-[#202723]"
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
                  className="p-5 flex flex-col justify-between border-[#DDDCD3]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          recipe.status === "VERIFIED_BY_COOK" || recipe.status === "VERIFIED"
                            ? "forest"
                            : recipe.status === "REVIEW_PENDING"
                              ? "ochre"
                              : "warm"
                        }
                        size="sm"
                      >
                        {recipe.status === "VERIFIED_BY_COOK" || recipe.status === "VERIFIED"
                          ? "Verified by Cook"
                          : recipe.status === "REVIEW_PENDING"
                            ? "Reviewed"
                            : "Draft"}
                      </Badge>
                      <span className="text-[11px] font-mono text-[#202723]/60 flex items-center gap-1">
                        <ChefHat className="w-3 h-3 text-[#2E4742]" />
                        {recipe.cookName}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#202723]">
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="hover:text-[#2E4742] transition-colors"
                      >
                        {recipe.title}
                      </Link>
                    </h3>

                    {recipe.description && (
                      <p className="text-xs text-[#202723]/70 mt-1 line-clamp-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#202723]/60">
                    <span className="font-mono text-[11px]">
                      {recipe._count.ingredients} ingredients • {recipe._count.steps} steps
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cook/${recipe.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E4742] hover:text-[#202723] bg-[#2E4742]/10 hover:bg-[#2E4742]/20 px-2 py-0.5 rounded-lg transition-colors font-mono"
                      >
                        <Play className="w-2.5 h-2.5 fill-[#2E4742]" />
                        Cook
                      </Link>
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="text-[#2E4742] hover:text-[#202723] font-medium"
                      >
                        View &rarr;
                      </Link>
                    </div>
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
                    <Button variant="forest" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                      Preserve First Recipe
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          )}

          {/* Cooking Videos Section */}
          <div className="pt-8 border-t border-[#DDDCD3]">
            <div className="flex items-center justify-between border-b border-[#DDDCD3] pb-3 mb-6">
              <h2 className="font-display text-2xl font-bold text-[#202723] flex items-center gap-2">
                <Video className="w-5 h-5 text-[#2E4742]" />
                Original Cooking Videos ({kitchen.videos.length})
              </h2>
              {canAddRecipes && (
                <Link
                  href={`/upload?kitchenId=${kitchen.id}`}
                  className="text-xs font-mono font-medium text-[#2E4742] hover:text-[#202723]"
                >
                  + Upload Video
                </Link>
              )}
            </div>

            {kitchen.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kitchen.videos.map((video) => (
                  <Card key={video.id} hoverEffect className="p-4 flex flex-col justify-between border-[#DDDCD3]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={video.uploadStatus === "UPLOADED" ? "forest" : "warm"}
                          size="sm"
                        >
                          {video.uploadStatus === "UPLOADED" ? "Ready" : video.uploadStatus}
                        </Badge>
                        <span className="text-[11px] font-mono text-[#202723]/60">
                          {((video.actualSize ?? video.expectedSize) / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-[#202723] line-clamp-1">
                        <Link
                          href={`/videos/${video.id}`}
                          className="hover:text-[#2E4742] transition-colors"
                        >
                          {video.originalFilename}
                        </Link>
                      </h3>

                      {video.recipe && (
                        <p className="text-xs text-[#202723]/70 mt-1 truncate">
                          Linked to: <strong>{video.recipe.title}</strong>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#202723]/60">
                      <span>By {video.uploadedBy.name}</span>
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/review/${video.id}`}
                          className="text-[#202723]/70 hover:text-[#202723] font-medium text-xs transition-colors"
                        >
                          Review
                        </Link>
                        <Link
                          href={`/videos/${video.id}`}
                          className="text-[#2E4742] hover:text-[#202723] font-medium flex items-center gap-1 transition-colors"
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
              <div className="p-6 bg-white rounded-2xl border border-[#DDDCD3] text-center space-y-2">
                <p className="text-xs text-[#202723]/70">
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
          <Card className="p-6 space-y-4 border-[#DDDCD3]">
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#202723]/60 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2E4742]" />
              Kitchen Overview
            </h3>

            <div className="space-y-3 text-xs text-[#202723]/80">
              <div className="flex items-center justify-between py-1.5 border-b border-[#DDDCD3]">
                <span className="text-[#202723]/60">Curator / Owner</span>
                <span className="font-medium text-[#202723]">{kitchen.owner.name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#DDDCD3]">
                <span className="text-[#202723]/60">Your Permission</span>
                <Badge variant={isOwner ? "forest" : "outline"} size="sm">
                  {roleLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#DDDCD3]">
                <span className="text-[#202723]/60">Preserved Recipes</span>
                <span className="font-mono font-medium text-[#202723]">{kitchen.recipes.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#202723]/60">Established</span>
                <span className="text-[#202723] flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#2E4742]" />
                  {new Date(kitchen.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Members List */}
          <Card className="p-6 space-y-4 border-[#DDDCD3]">
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#202723]/60 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2E4742]" />
              Members ({kitchen.members.length})
            </h3>

            <div className="space-y-3">
              {kitchen.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDDCD3]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#2E4742]/10 text-[#2E4742] text-xs font-bold font-display flex items-center justify-center">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#202723]">{member.user.name}</p>
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
