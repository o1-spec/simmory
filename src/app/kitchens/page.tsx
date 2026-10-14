import React, { Suspense } from "react";
import Link from "next/link";
import { FolderHeart, Users, BookOpen, ShieldCheck, ArrowRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { listUserKitchens } from "@/lib/services/kitchens";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata = {
  title: "Family Kitchens — Simmory",
  description: "Organize family recipes into distinct generational and regional kitchen spaces.",
};

async function KitchensContent() {
  const session = await requireUser("/kitchens");
  const kitchens = await listUserKitchens(session.user.id);

  return (
    <>
      <PageHeader
        eyebrow="Family Organization"
        title="Family Kitchens"
        description="Organize your recipes into distinct family spaces—preserving regional traditions, different generations, or branches of your family tree."
        actions={
          <Link href="/kitchens/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Kitchen
            </Button>
          </Link>
        }
      />

      {kitchens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {kitchens.map((kitchen) => {
            const roleLabel =
              kitchen.myRole === "OWNER"
                ? "Owner"
                : kitchen.myRole === "EDITOR"
                ? "Editor"
                : "Viewer";

            return (
              <Card key={kitchen.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={kitchen.isOwner ? "sage" : "outline"}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {kitchen.isOwner ? "Owner Space" : "Member Space"}
                      </Badge>
                      <span className="text-[11px] text-warm-500 font-medium">
                        {roleLabel}
                      </span>
                    </div>
                    <CardTitle>
                      <Link
                        href={`/kitchens/${kitchen.id}`}
                        className="hover:text-terracotta-700 transition-colors"
                      >
                        {kitchen.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {kitchen.description || "Private family recipe archive"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-warm-600 bg-warm-50 p-3 rounded-xl border border-warm-200/60">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-warm-400" />
                        {kitchen.recipeCount}{" "}
                        {kitchen.recipeCount === 1 ? "recipe saved" : "recipes saved"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-warm-400" />
                        {kitchen.memberCount}{" "}
                        {kitchen.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 border-t border-warm-100 flex items-center justify-between">
                  <span className="text-xs text-warm-400">
                    Updated{" "}
                    {new Date(kitchen.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/kitchens/${kitchen.id}`}
                    className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 group"
                  >
                    Open Kitchen
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FolderHeart className="w-8 h-8" />}
          title="No Family Kitchens Yet"
          description="Create your first family space to start preserving generational recipes, cooking instincts, and memories."
          action={
            <Link href="/kitchens/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Create Your First Kitchen
              </Button>
            </Link>
          }
        />
      )}
    </>
  );
}

export default function KitchensPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Loading family kitchens..." />}>
        <KitchensContent />
      </Suspense>
    </DashboardLayout>
  );
}
