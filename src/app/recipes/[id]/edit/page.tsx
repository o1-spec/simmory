import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/get-user";
import { canEditRecipe } from "@/lib/auth/permissions";
import { listUserKitchens } from "@/lib/services/kitchens";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RecipeForm } from "@/components/recipes/recipe-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditRecipeContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: recipeId } = await params;
  const session = await requireUser(`/recipes/${recipeId}/edit`);
  const result = await canEditRecipe(recipeId, session.user.id);

  if (!result) {
    notFound();
  }

  const { recipe } = result;
  const kitchens = await listUserKitchens(session.user.id);
  const writableKitchens = kitchens.filter(
    (k) => k.myRole === "OWNER" || k.myRole === "EDITOR" || k.myRole === "ADMIN"
  );

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/recipes/${recipe.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {recipe.title}
        </Link>
      </div>

      <PageHeader
        eyebrow={`Editing • ${recipe.kitchen.name}`}
        title={`Edit ${recipe.title}`}
        description="Refine instructions, adjust textual measurements, or add nuanced sensory tells from the family cook."
      />

      <RecipeForm
        isEditing
        kitchens={writableKitchens.map((k) => ({ id: k.id, name: k.name }))}
        initialData={{
          id: recipe.id,
          kitchenId: recipe.kitchenId,
          title: recipe.title,
          cookName: recipe.cookName,
          description: recipe.description || "",
          story: recipe.story || "",
          origin: recipe.origin || "",
          notes: recipe.notes || "",
          ingredients: recipe.ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            quantity: ing.quantity || "",
            notes: ing.notes || "",
          })),
          steps: recipe.steps.map((st) => ({
            id: st.id,
            instruction: st.instruction,
            sensoryCue: st.sensoryCue || "",
            duration: st.duration || "",
            notes: st.notes || "",
          })),
        }}
      />
    </>
  );
}

export default function EditRecipePage({ params }: PageProps) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner text="Loading recipe for editing..." />}>
        <EditRecipeContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
