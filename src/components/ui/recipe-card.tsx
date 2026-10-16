import React from "react";
import Link from "next/link";
import { Video, UserCheck, Flame, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import type { Recipe } from "@/types";

export interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const isVerified = recipe.status === "verified_by_cook";

  return (
    <Card hoverEffect className={className}>
      <div className="p-5 flex flex-col h-full">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant={isVerified ? "sage" : "saffron"}
            size="sm"
            className="flex items-center gap-1"
          >
            {isVerified ? (
              <>
                <UserCheck className="w-3 h-3" /> Verified by Cook
              </>
            ) : (
              <>
                <Flame className="w-3 h-3" /> Review Pending
              </>
            )}
          </Badge>

          {recipe.videoDurationSeconds > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-warm-500 bg-warm-100 px-2 py-0.5 rounded-full">
              <Video className="w-3 h-3 text-terracotta-500" />
              {formatDuration(recipe.videoDurationSeconds)}
            </span>
          )}
        </div>

        {/* Recipe Title & Subtitle */}
        <div className="mb-3">
          <h3 className="font-display text-lg font-bold text-[#202723] line-clamp-1">
            {recipe.title}
          </h3>
          {recipe.originalDishName && (
            <p className="text-xs text-[#202723]/60 italic mt-0.5">
              &ldquo;{recipe.originalDishName}&rdquo;
            </p>
          )}
        </div>

        {/* Cook Attribution */}
        <div className="flex items-center gap-2 mb-4 text-xs text-[#202723]/80 bg-[#FAF9F5] p-2.5 rounded-xl border border-[#DDDCD3]">
          <div className="w-6 h-6 rounded-full bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center font-display font-bold text-xs shrink-0">
            {recipe.cook.name.charAt(0)}
          </div>
          <div className="truncate">
            <span className="font-medium text-[#202723]">{recipe.cook.name}</span>
            {recipe.cook.relationship && (
              <span className="text-[#202723]/50"> ({recipe.cook.relationship})</span>
            )}
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-[#202723]/70 line-clamp-2 leading-relaxed mb-4 flex-1">
          {recipe.description}
        </p>

        {/* Metadata Footer & Action */}
        <div className="pt-3 border-t border-[#DDDCD3] flex items-center justify-between mt-auto text-xs text-[#202723]/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-[#202723]/40" />
              {recipe.stepsCount} steps
            </span>
            {recipe.cuesCount > 0 && (
              <span className="flex items-center gap-1 text-[#2E4742] font-mono font-medium text-[11px]">
                <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                {recipe.cuesCount} cues
              </span>
            )}
          </div>

          <Link
            href={`/cook/${recipe.id}`}
            className="text-[#2E4742] hover:text-[#202723] font-medium hover:underline flex items-center gap-1 text-xs"
          >
            Cook Along &rarr;
          </Link>
        </div>
      </div>
    </Card>
  );
}
