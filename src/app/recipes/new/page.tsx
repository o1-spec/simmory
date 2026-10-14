import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { listUserKitchens } from "@/lib/services/kitchens";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Preserve New Recipe — Simmory",
  description: "Manually preserve a family recipe with instructions, sensory tells, and memories.",
};

interface PageProps {
  searchParams: Promise<{ kitchenId?: string }>;
}

async function NewRecipeContent({ searchParams }: PageProps) {
  const session = await requireUser("/recipes/new");
  const { kitchenId: queryKitchenId } = await searchParams;

  const kitchens = await listUserKitchens(session.user.id);
  const writableKitchens = kitchens.filter(
    (k) => k.myRole === "OWNER" || k.myRole === "EDITOR" || k.myRole === "ADMIN"
  );

  if (writableKitchens.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title="No Writable Kitchen Found"
        description="You need to be an owner or editor in a family kitchen to preserve recipes. Create your kitchen first."
        action={
          <Link href="/kitchens/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Create Family Kitchen
            </Button>
          </Link>
        }
      />
    );
  }

  // Pre-select kitchen if query matches
  const initialKitchenId =
    queryKitchenId && writableKitchens.some((k) => k.id === queryKitchenId)
      ? queryKitchenId
      : writableKitchens[0].id;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Recipe Catalog
        </Link>
      </div>

      <PageHeader
        eyebrow="Heirloom Documentation"
        title="Preserve a Family Recipe"
        description="Document how they actually made it: textual measurements, personal memories, and the sensory cues that carry true cooking instincts."
      />

      <RecipeForm
        kitchens={writableKitchens.map((k) => ({ id: k.id, name: k.name }))}
        initialData={{
          kitchenId: initialKitchenId,
          title: "",
          cookName: "",
          description: "",
          story: "",
          origin: "",
          notes: "",
          ingredients: [
            { name: "", quantity: "", notes: "" },
            { name: "", quantity: "", notes: "" },
            { name: "", quantity: "", notes: "" },
          ],
          steps: [
            { instruction: "", sensoryCue: "", duration: "", notes: "" },
            { instruction: "", sensoryCue: "", duration: "", notes: "" },
          ],
        }}
      />
    </>
  );
}

export default function NewRecipePage({ searchParams }: PageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Preparing recipe creation form..." />}>
        <NewRecipeContent searchParams={searchParams} />
      </Suspense>
    </DashboardLayout>
  );
}
