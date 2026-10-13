import { z } from "zod";

export const createKitchenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Kitchen name is required")
    .max(100, "Kitchen name must be 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const updateKitchenSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Kitchen name must be at least 1 character")
      .max(100, "Kitchen name must be 100 characters or fewer")
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field (name or description) must be provided",
  });

export type CreateKitchenInput = z.infer<typeof createKitchenSchema>;
export type UpdateKitchenInput = z.infer<typeof updateKitchenSchema>;
