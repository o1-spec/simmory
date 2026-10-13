import { z } from "zod";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_VIDEO_EXTENSIONS,
  getMaxVideoSizeBytes,
} from "@/lib/storage/r2";

export const initiateVideoUploadSchema = z
  .object({
    kitchenId: z.string().uuid("Invalid kitchen identifier"),
    recipeId: z.string().uuid("Invalid recipe identifier").optional().nullable(),
    originalFilename: z
      .string()
      .min(1, "Filename is required")
      .max(255, "Filename is too long")
      .refine(
        (val) => {
          const lower = val.toLowerCase();
          return ALLOWED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
        },
        {
          message: "Filename must end with a supported video extension (.mp4, .mov, .webm)",
        }
      ),
    contentType: z.enum(ALLOWED_VIDEO_MIME_TYPES, {
      error: "Unsupported video format. Allowed MIME types: video/mp4, video/quicktime, video/webm",
    }),
    fileSize: z
      .number()
      .int()
      .positive("File size must be greater than 0")
      .refine((val) => val <= getMaxVideoSizeBytes(), {
        message: `File size exceeds the maximum limit of ${Math.round(
          getMaxVideoSizeBytes() / (1024 * 1024)
        )} MB`,
      }),
  });

export type InitiateVideoUploadInput = z.infer<typeof initiateVideoUploadSchema>;

export const updateVideoSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe identifier").optional().nullable(),
  originalFilename: z.string().min(1).max(255).optional(),
});

export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
