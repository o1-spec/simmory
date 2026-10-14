import { z } from "zod";

export const updateReviewSchema = z.object({
  notes: z.string().max(2000).optional(),
  cookVerified: z.boolean().optional(),
  cookVerifiedBy: z.string().max(100).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const updateReviewedEventSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200).optional(),
  description: z.string().min(1, "Description cannot be empty").max(2000).optional(),
  startTimestamp: z.number().min(0, "Start timestamp must be non-negative").optional(),
  endTimestamp: z.number().min(0).nullable().optional(),
  status: z.enum(["UNREVIEWED", "ACCEPTED", "EDITED", "REJECTED"]).optional(),
  humanClarification: z.string().max(1000).nullable().optional(),
  sensoryCue: z.string().max(500).nullable().optional(),
});

export const addReviewedEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  startTimestamp: z.number().min(0, "Start timestamp must be non-negative"),
  endTimestamp: z.number().min(0).nullable().optional(),
  sensoryCue: z.string().max(500).nullable().optional(),
  humanClarification: z.string().max(1000).nullable().optional(),
});

export const reorderEventsSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1, "At least one event ID is required"),
});

export const saveClarificationSchema = z.object({
  clarificationId: z.string().uuid().optional(),
  eventId: z.string().uuid().nullable().optional(),
  question: z.string().min(1).max(500).optional(),
  answer: z.string().max(1000).optional(),
  status: z.enum(["UNANSWERED", "ANSWERED", "UNKNOWN", "NOT_APPLICABLE"]).optional(),
});

export const saveIngredientSchema = z.object({
  ingredientId: z.string().uuid().optional(),
  name: z.string().min(1, "Ingredient name is required").max(100),
  quantity: z.string().max(100).nullable().optional(),
  notes: z.string().max(300).nullable().optional(),
  provenance: z
    .enum(["SPOKEN_INSTRUCTION", "VISUALLY_SUGGESTED", "HUMAN_SUPPLIED", "HUMAN_CONFIRMED"])
    .default("HUMAN_SUPPLIED"),
  isUnknownQuantity: z.boolean().default(false),
  position: z.number().int().min(0).optional(),
});

export const convertToRecipeSchema = z.object({
  mode: z.enum(["CREATE_NEW", "MERGE_EXISTING"]).default("CREATE_NEW"),
  targetRecipeId: z.string().uuid().optional(),
  title: z.string().min(1, "Recipe title is required").max(150).optional(),
  cookName: z.string().max(100).optional(),
  story: z.string().max(3000).optional(),
  origin: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});
