-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "KitchenRole" ADD VALUE 'EDITOR';
ALTER TYPE "KitchenRole" ADD VALUE 'VIEWER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RecipeStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "RecipeStatus" ADD VALUE 'REVIEW_PENDING';
ALTER TYPE "RecipeStatus" ADD VALUE 'VERIFIED_BY_COOK';

-- AlterTable
ALTER TABLE "kitchen_members" ALTER COLUMN "role" SET DEFAULT 'VIEWER';

-- AlterTable
ALTER TABLE "kitchens" ADD COLUMN     "coverImageUrl" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cookName" TEXT NOT NULL DEFAULT 'Family Cook',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "story" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT;

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "instruction" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,
    "sensoryCue" TEXT,
    "notes" TEXT,
    "videoTimestampStart" INTEGER,
    "videoTimestampEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipeId_idx" ON "recipe_ingredients"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_steps_recipeId_idx" ON "recipe_steps"("recipeId");

-- CreateIndex
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
