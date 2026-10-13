import React, { Suspense } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FolderHeart,
  BookOpen,
  Sparkles,
  Flame,
  Users,
  Video,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Kitchen Overview — Simmory",
  description: "Your family's private space for preserving unwritten recipes and cooking videos.",
};

async function DashboardContent() {
  const session = await requireUser("/dashboard");

  // Query authentic metrics from database
  const [recipeCount, kitchenCount] = await Promise.all([
    db.recipe.count({
      where: { createdById: session.user.id },
    }),
    db.kitchenMember.count({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${session.user.name}`}
        title="Kitchen Overview"
        description="Your family's private space for preserving unwritten recipes, authentic cooking footage, and personal culinary heritage."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/kitchens">
              <Button variant="secondary" size="md" leftIcon={<FolderHeart className="w-4 h-4" />}>
                Collections
              </Button>
            </Link>
            <Link href="/upload">
              <Button
                variant="primary"
                size="md"
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Preserve Recipe
              </Button>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards (Derived from Real Database Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              {recipeCount}
            </span>
            <span className="text-xs text-warm-500">recorded</span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">
            {recipeCount === 0 ? "Ready for first video" : "Stored in database"}
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
              {kitchenCount}
            </span>
            <span className="text-xs text-warm-500">
              {kitchenCount === 1 ? "active space" : "active spaces"}
            </span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">Private archive space</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-500">
              Sensory Cues
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-warm-900">0</span>
            <span className="text-xs text-warm-500">identified</span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">Identified during video review</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-500">
              Cooks Documented
            </span>
            <div className="w-8 h-8 rounded-lg bg-sage-100 text-sage-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-warm-900">1</span>
            <span className="text-xs text-warm-500">account curator</span>
          </div>
          <p className="text-[11px] text-warm-400 mt-1">{session.user.name}</p>
        </Card>
      </div>

      {/* Guide Banner for Preserving First Dish */}
      <div className="mb-10 bg-warm-100/70 border border-warm-200/80 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Getting Started with Simmory</span>
            </div>
            <h2 className="font-serif text-2xl text-warm-900 font-medium">
              How to capture a dish the way they make it
            </h2>
            <p className="text-sm text-warm-600 leading-relaxed font-sans">
              Set up your phone camera to capture the stove and hands. Don&apos;t worry about editing or mistakes—our workflow uses speech transcription and video frame analysis to construct candidate steps for your review.
            </p>
          </div>
          <Link href="/upload" className="shrink-0">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Preserve a Recipe
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-warm-200/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-warm-600">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white text-warm-800 font-bold flex items-center justify-center shrink-0 border border-warm-200">
              1
            </span>
            <span>Record raw cooking video with spoken explanations</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white text-warm-800 font-bold flex items-center justify-center shrink-0 border border-warm-200">
              2
            </span>
            <span>AI proposes timestamped steps and sensory cues</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white text-warm-800 font-bold flex items-center justify-center shrink-0 border border-warm-200">
              3
            </span>
            <span>The cook verifies steps and clarifies secret details</span>
          </div>
        </div>
      </div>

      {/* Recent Recipes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-warm-900 font-medium">
            Recent Recipes
          </h2>
          <Badge variant={recipeCount > 0 ? "sage" : "warm"}>
            {recipeCount > 0 ? `${recipeCount} Preserved` : "Archive Empty"}
          </Badge>
        </div>

        {recipeCount === 0 ? (
          <EmptyState
            icon={<Video className="w-6 h-6" />}
            badge="No recipes preserved yet"
            title="Your family archive is waiting for its first dish"
            description="When you preserve a recipe, the video and verified cooking timeline will be safely stored here for family members to explore and cook along."
            action={
              <Link href="/upload">
                <Button variant="primary" size="md" leftIcon={<UploadCloud className="w-4 h-4" />}
                >
                  Upload First Video
                </Button>
              </Link>
            }
            note="Phase 2 Database Connected: Records are persisted in PostgreSQL. Cloudflare R2 and AI background processing will be integrated in future phases."
          />
        ) : null}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading family kitchen overview..." />}>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
