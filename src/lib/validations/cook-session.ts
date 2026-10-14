import { z } from "zod";

export const startCookingSessionSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format"),
  forceNew: z.boolean().optional(),
});

export const updateCookingSessionSchema = z.object({
  currentStepId: z.string().uuid("Invalid step ID format").optional().nullable(),
  currentStepPosition: z.number().int().min(0).optional(),
  status: z.enum(["IN_PROGRESS", "PAUSED", "COMPLETED", "ABANDONED"]).optional(),
  expectedVersion: z.number().int().min(1).optional(),
});

export const setStepCompletionSchema = z.object({
  completed: z.boolean(),
});

export const setIngredientCheckSchema = z.object({
  checked: z.boolean(),
});

export type StartCookingSessionInput = z.infer<typeof startCookingSessionSchema>;
export type UpdateCookingSessionInput = z.infer<typeof updateCookingSessionSchema>;
export type SetStepCompletionInput = z.infer<typeof setStepCompletionSchema>;
export type SetIngredientCheckInput = z.infer<typeof setIngredientCheckSchema>;
