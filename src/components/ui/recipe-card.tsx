import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Video, UserCheck, Flame, BookOpen, ChefHat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import type { Recipe } from "@/types";

export interface RecipeCardProps {
  recipe: Recipe & { imageUrl?: string };
  className?: string;
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const isVerified = recipe.status === "verified_by_cook";

  return (
    <Card hoverEffect className={`overflow-hidden flex flex-col h-full group ${className || ""}`}>
      {/* Visual Header: Dish Image OR Non-Deceptive Heirloom Illustration Fallback */}
      <div className="relative aspect-16/9 w-full bg-[#E8E7DF] overflow-hidden border-b border-[#DDDCD3]">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F5] via-[#F2F2EB] to-[#E3E9E8] flex items-center justify-center p-6 select-none">
            <div className="flex flex-col items-center justify-center text-center space-y-2 opacity-80">
              <div className="w-12 h-12 rounded-2xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center border border-[#2E4742]/20">
                <ChefHat className="w-6 h-6 text-[#2E4742]" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#525B56]">
                Heirloom Family Archive
              </span>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <Badge
            variant={isVerified ? "sage" : "saffron"}
            size="sm"
            className="flex items-center gap-1 shadow-xs bg-[#FAF9F5]/90 backdrop-blur-md"
          >
            {isVerified ? (
              <>
                <UserCheck className="w-3 h-3 text-[#2E4742]" /> Verified
              </>
            ) : (
              <>
                <Flame className="w-3 h-3 text-[#F5B726]" /> Review Pending
              </>
            )}
          </Badge>

          {recipe.videoDurationSeconds > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-[#202723] bg-[#FAF9F5]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#DDDCD3]">
              <Video className="w-3 h-3 text-[#2E4742]" />
              {formatDuration(recipe.videoDurationSeconds)}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div className="space-y-3">
          {/* Recipe Title & Subtitle */}
          <div>
            <h3 className="font-display text-xl font-bold text-[#202723] group-hover:text-[#2E4742] transition-colors line-clamp-1">
              <Link href={`/recipes/${recipe.id}`}>
                {recipe.title}
              </Link>
            </h3>
            {recipe.originalDishName && (
              <p className="text-xs text-[#525B56] italic mt-0.5 truncate">
                &ldquo;{recipe.originalDishName}&rdquo;
              </p>
            )}
          </div>

          {/* Cook Attribution */}
          <div className="flex items-center gap-2 text-xs text-[#202723] bg-[#FAF9F5] p-2.5 rounded-xl border border-[#DDDCD3]">
            <div className="w-6 h-6 rounded-full bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center font-display font-bold text-xs shrink-0">
              {recipe.cook.name.charAt(0)}
            </div>
            <div className="truncate">
              <span className="font-semibold text-[#202723]">{recipe.cook.name}</span>
              {recipe.cook.relationship && (
                <span className="text-[#525B56]"> ({recipe.cook.relationship})</span>
              )}
            </div>
          </div>

          {/* Description snippet */}
          {recipe.description && (
            <p className="text-xs text-[#525B56] line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Metadata Footer & Action */}
        <div className="pt-4 border-t border-[#DDDCD3] flex items-center justify-between mt-4 text-xs text-[#525B56]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-[#2E4742]" />
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
            className="text-[#2E4742] hover:text-[#202723] font-semibold flex items-center gap-1 text-xs"
          >
            Cook Along &rarr;
          </Link>
        </div>
      </div>
    </Card>
  );
}
