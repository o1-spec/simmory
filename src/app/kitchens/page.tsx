import React, { Suspense } from "react";
import Link from "next/link";
import { FolderHeart, Plus, Users, BookOpen, ShieldCheck, Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Family Kitchens — Simmory",
  description: "Organize family recipes into distinct generational and regional kitchen spaces.",
};

async function KitchensContent() {
  const session = await requireUser("/kitchens");

  const kitchens = await db.kitchen.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: true,
      recipes: true,
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        eyebrow="Family Organization"
        title="Family Kitchens"
        description="Organize your recipes into distinct family spaces—preserving regional traditions, different generations, or branches of your family tree."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            disabled
            title="Collection creation will be available in Phase 3"
          >
            Create New Kitchen
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {kitchens.map((kitchen, index) => {
          const isOwner = kitchen.ownerId === session.user.id;
          return (
            <Card key={kitchen.id} hoverEffect className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="sage" size="sm" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {index === 0 ? "Default Space" : "Family Space"}
                  </Badge>
                  <span className="text-[11px] text-warm-500 font-medium">
                    {isOwner ? "Owner" : "Member"}
                  </span>
                </div>
                <CardTitle>{kitchen.name}</CardTitle>
                <CardDescription>
                  {kitchen.description || "Private family recipe archive"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-warm-600 bg-warm-50 p-3 rounded-xl border border-warm-200/60">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-warm-400" />
                    {kitchen.recipes.length}{" "}
                    {kitchen.recipes.length === 1 ? "recipe saved" : "recipes saved"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-warm-400" />
                    {kitchen.members.length}{" "}
                    {kitchen.members.length === 1 ? "member" : "members"}
                  </span>
                </div>
              </CardContent>

              <CardFooter>
                <span className="text-xs text-warm-500">
                  Created {kitchen.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <Link
                  href="/recipes"
                  className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:underline"
                >
                  View Recipes &rarr;
                </Link>
              </CardFooter>
            </Card>
          );
        })}

        {/* Explain Custom Kitchens Feature Card */}
        <div className="p-6 rounded-2xl border border-dashed border-warm-300 bg-warm-50/50 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-warm-200/80 text-warm-700 flex items-center justify-center">
              <Heart className="w-5 h-5 text-terracotta-500" />
            </div>
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              Multi-Branch Family Archives
            </h3>
            <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
              In future phases, you will be able to create specialized kitchens (e.g. &ldquo;Grandmother&apos;s Oaxacan Recipes&rdquo; or &ldquo;Dad&apos;s Sunday Grill&rdquo;) and invite family members to contribute.
            </p>
          </div>
          <div className="pt-4 border-t border-warm-200/60 flex items-center justify-between text-xs text-warm-500">
            <span>Coming in Future Phases</span>
            <Badge variant="warm" size="sm">Roadmap</Badge>
          </div>
        </div>
      </div>

      {kitchens.length <= 1 && (
        <EmptyState
          icon={<FolderHeart className="w-6 h-6" />}
          badge="Collections"
          title="No additional kitchen spaces yet"
          description="All recipes currently save to your default family kitchen space. Creating additional branch collections and family invitation links will be enabled in subsequent releases."
          note="Phase 2: Real PostgreSQL models connected. Kitchen models are persisted and queryable."
        />
      )}
    </>
  );
}

export default function KitchensPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading family kitchens..." />}>
        <KitchensContent />
      </Suspense>
    </DashboardLayout>
  );
}
