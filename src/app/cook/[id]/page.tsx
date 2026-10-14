import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/get-user";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getRecipeCookAlongData,
  CookSessionError,
} from "@/lib/services/cook-sessions";
import { CookAlongWorkspace } from "@/components/cook-along/cook-along-workspace";

export const metadata = {
  title: "Interactive Cook Along — Simmory",
  description: "Cook along with the original family demonstration, verified steps, sensory cues, and timers.",
};

interface CookAlongPageProps {
  params: Promise<{ id: string }>;
}

async function CookAlongLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: recipeId } = await params;
  const session = await requireUser(`/cook/${recipeId}`);

  let data;
  try {
    data = await getRecipeCookAlongData(recipeId, session.user.id);
  } catch (error: unknown) {
    if (error instanceof CookSessionError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <CookAlongWorkspace
      recipe={data.recipe}
      initialSession={
        data.activeSession
          ? {
              id: data.activeSession.id,
              recipeId: data.activeSession.recipeId,
              userId: data.activeSession.userId,
              kitchenId: data.activeSession.kitchenId,
              status: data.activeSession.status,
              currentStepId: data.activeSession.currentStepId,
              currentStepPosition: data.activeSession.currentStepPosition,
              startedAt: data.activeSession.startedAt,
              version: data.activeSession.version,
              sessionSteps: data.activeSession.sessionSteps.map((s) => ({
                stepId: s.stepId,
                completed: s.completed,
              })),
              sessionIngredients: data.activeSession.sessionIngredients.map(
                (i) => ({
                  ingredientId: i.ingredientId,
                  checked: i.checked,
                })
              ),
            }
          : null
      }
      videoPlaybackUrls={data.videoPlaybackUrls}
    />
  );
}

export default function CookAlongPage({ params }: CookAlongPageProps) {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="py-24 flex items-center justify-center">
            <LoadingSpinner label="Preparing your kitchen cook-along session..." />
          </div>
        }
      >
        <CookAlongLoader params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
