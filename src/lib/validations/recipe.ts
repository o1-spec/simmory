import { z } from "zod";

export const ingredientInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Ingredient name cannot be empty")
    .max(150, "Ingredient name must be 150 characters or fewer"),
  quantity: z
    .string()
    .trim()
    .max(100, "Quantity must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(200, "Ingredient notes must be 200 characters or fewer")
    .optional()
    .or(z.literal("")),
  position: z.number().int().min(0).optional(),
});

export const stepInputSchema = z.object({
  id: z.string().uuid().optional(),
  instruction: z
    .string()
    .trim()
    .min(1, "Step instruction cannot be empty")
    .max(2500, "Step instruction must be 2,500 characters or fewer"),
  sensoryCue: z
    .string()
    .trim()
    .max(500, "Sensory cue must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
  duration: z
    .string()
    .trim()
    .max(100, "Duration must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Step notes must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
  position: z.number().int().min(0).optional(),
});

export const createRecipeSchema = z.object({
  kitchenId: z.string().uuid("Invalid kitchen identifier"),
  title: z
    .string()
    .trim()
    .min(1, "Recipe title is required")
    .max(150, "Recipe title must be 150 characters or fewer"),
  cookName: z
    .string()
    .trim()
    .min(1, "Original cook name is required")
    .max(100, "Original cook name must be 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  story: z
    .string()
    .trim()
    .max(3000, "Family story/memory must be 3,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  origin: z
    .string()
    .trim()
    .max(100, "Cuisine or cultural origin must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(2000, "Preparation notes must be 2,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  ingredients: z.array(ingredientInputSchema).optional().default([]),
  steps: z.array(stepInputSchema).optional().default([]),
});

export const updateRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Recipe title is required")
    .max(150, "Recipe title must be 150 characters or fewer")
    .optional(),
  cookName: z
    .string()
    .trim()
    .min(1, "Original cook name is required")
    .max(100, "Original cook name must be 100 characters or fewer")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  story: z
    .string()
    .trim()
    .max(3000, "Family story/memory must be 3,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  origin: z
    .string()
    .trim()
    .max(100, "Cuisine or cultural origin must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(2000, "Preparation notes must be 2,000 characters or fewer")
    .optional()
    .or(z.literal("")),
  ingredients: z.array(ingredientInputSchema).optional(),
  steps: z.array(stepInputSchema).optional(),
});

export type IngredientInput = z.infer<typeof ingredientInputSchema>;
export type StepInput = z.infer<typeof stepInputSchema>;
export type CreateRecipeInput = z.input<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.input<typeof updateRecipeSchema>;
