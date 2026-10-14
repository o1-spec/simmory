import React from "react";
import Link from "next/link";
import { Play, FileVideo, Clock, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoUploadStatus, VideoProcessingStatus } from "@/generated/prisma/client";

interface VideoCardProps {
  id: string;
  originalFilename: string;
  contentType: string;
  expectedSize: number;
  actualSize: number | null;
  uploadStatus: VideoUploadStatus;
  processingStatus: VideoProcessingStatus;
  validationStatus?: string;
  createdAt: Date;
  kitchen: {
    id: string;
    name: string;
  };
  recipe: {
    id: string;
    title: string;
    cookName: string;
  } | null;
  uploadedBy?: {
    id: string;
    name: string;
  };
}

export function VideoCard({
  id,
  originalFilename,
  expectedSize,
  actualSize,
  uploadStatus,
  processingStatus,
  validationStatus,
  createdAt,
  kitchen,
  recipe,
}: VideoCardProps) {
  const sizeToDisplay = actualSize ?? expectedSize;
  const sizeMb = (sizeToDisplay / (1024 * 1024)).toFixed(1);

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all flex flex-col group border-warm-200/80 bg-white">
      {/* Visual Header / Thumbnail Placeholder */}
      <div className="relative h-40 bg-warm-900/90 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent z-10" />

        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-terracotta-500 transition-all z-20">
          <Play className="w-6 h-6 fill-current ml-0.5" />
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <Badge
            variant={
              uploadStatus === "UPLOADED"
                ? validationStatus === "VALIDATED"
                  ? "sage"
                  : validationStatus === "FAILED"
                  ? "terracotta"
                  : "warm"
                : uploadStatus === "FAILED"
                ? "terracotta"
                : "warm"
            }
          >
            {uploadStatus === "UPLOADED"
              ? validationStatus === "VALIDATED"
                ? "Validated"
                : validationStatus === "VALIDATING"
                ? "Validating"
                : validationStatus === "FAILED"
                ? "Invalid Media"
                : "Uploaded"
              : uploadStatus === "PENDING_UPLOAD"
              ? "Pending"
              : uploadStatus}
          </Badge>

          <span className="text-[11px] font-mono text-white/90 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
            {sizeMb} MB
          </span>
        </div>

        {/* Bottom Attribution */}
        <div className="absolute bottom-2.5 left-3 right-3 z-20 text-white/90 text-xs flex items-center justify-between">
          <span className="truncate font-medium">{kitchen.name}</span>
          <span className="text-[11px] text-white/70">{formattedDate}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-serif text-base text-warm-900 font-medium line-clamp-1 group-hover:text-terracotta-600 transition-colors">
            {originalFilename}
          </h3>

          {recipe ? (
            <div className="flex items-center gap-1.5 text-xs text-warm-600 bg-warm-50 p-2 rounded-lg border border-warm-200/60">
              <Utensils className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
              <span className="truncate">
                <strong>{recipe.title}</strong> (by {recipe.cookName})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-warm-400 italic py-1">
              <FileVideo className="w-3.5 h-3.5 shrink-0" />
              <span>Unassigned recording</span>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="pt-3 border-t border-warm-100 flex items-center justify-between text-xs text-warm-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-warm-400" />
            <span>AI: {processingStatus === "NOT_STARTED" ? "Not Started" : processingStatus}</span>
          </div>

          <Link
            href={`/videos/${id}`}
            className="text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:underline"
          >
            Play & Details &rarr;
          </Link>
        </div>
      </div>
    </Card>
  );
}
