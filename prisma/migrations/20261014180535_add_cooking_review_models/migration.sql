-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventReviewStatus" AS ENUM ('UNREVIEWED', 'ACCEPTED', 'EDITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClarificationStatus" AS ENUM ('UNANSWERED', 'ANSWERED', 'UNKNOWN', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ClarificationSource" AS ENUM ('AI_GENERATED', 'HUMAN_ADDED');

-- CreateEnum
CREATE TYPE "IngredientProvenance" AS ENUM ('SPOKEN_INSTRUCTION', 'VISUALLY_SUGGESTED', 'HUMAN_SUPPLIED', 'HUMAN_CONFIRMED');

-- AlterTable
ALTER TABLE "ai_analyses" ADD COLUMN     "coverageRatio" DOUBLE PRECISION,
ADD COLUMN     "sampledTimeRange" JSONB,
ADD COLUMN     "samplingStrategy" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cookVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cookVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "cookVerifiedBy" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" UUID,
ADD COLUMN     "sourceReviewId" UUID;

-- CreateTable
CREATE TABLE "cooking_reviews" (
    "id" UUID NOT NULL,
    "videoId" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "kitchenId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "recipeId" UUID,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "cookVerified" BOOLEAN NOT NULL DEFAULT false,
    "cookVerifiedBy" TEXT,
    "cookVerifiedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewed_cooking_events" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "sourceProposedEventId" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalAiTitle" TEXT,
    "originalAiDescription" TEXT,
    "startTimestamp" DOUBLE PRECISION NOT NULL,
    "endTimestamp" DOUBLE PRECISION,
    "status" "EventReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "humanClarification" TEXT,
    "sensoryCue" TEXT,
    "evidenceFrames" JSONB NOT NULL DEFAULT '[]',
    "transcriptSegments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewed_cooking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_clarifications" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "eventId" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" "ClarificationStatus" NOT NULL DEFAULT 'UNANSWERED',
    "source" "ClarificationSource" NOT NULL DEFAULT 'AI_GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_clarifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewed_ingredients" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "provenance" "IngredientProvenance" NOT NULL DEFAULT 'HUMAN_SUPPLIED',
    "isUnknownQuantity" BOOLEAN NOT NULL DEFAULT false,
    "evidenceFrames" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewed_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_evidences" (
    "id" UUID NOT NULL,
    "recipeStepId" UUID NOT NULL,
    "videoId" UUID NOT NULL,
    "analysisId" UUID,
    "sourceEventId" UUID,
    "evidenceFrames" JSONB NOT NULL DEFAULT '[]',
    "transcriptSegments" JSONB,
    "startTimestamp" DOUBLE PRECISION NOT NULL,
    "endTimestamp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cooking_reviews_videoId_idx" ON "cooking_reviews"("videoId");

-- CreateIndex
CREATE INDEX "cooking_reviews_kitchenId_idx" ON "cooking_reviews"("kitchenId");

-- CreateIndex
CREATE INDEX "cooking_reviews_reviewerId_idx" ON "cooking_reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "cooking_reviews_analysisId_idx" ON "cooking_reviews"("analysisId");

-- CreateIndex
CREATE INDEX "cooking_reviews_status_idx" ON "cooking_reviews"("status");

-- CreateIndex
CREATE INDEX "reviewed_cooking_events_reviewId_idx" ON "reviewed_cooking_events"("reviewId");

-- CreateIndex
CREATE INDEX "reviewed_cooking_events_position_idx" ON "reviewed_cooking_events"("position");

-- CreateIndex
CREATE INDEX "reviewed_cooking_events_status_idx" ON "reviewed_cooking_events"("status");

-- CreateIndex
CREATE INDEX "cooking_clarifications_reviewId_idx" ON "cooking_clarifications"("reviewId");

-- CreateIndex
CREATE INDEX "cooking_clarifications_eventId_idx" ON "cooking_clarifications"("eventId");

-- CreateIndex
CREATE INDEX "cooking_clarifications_status_idx" ON "cooking_clarifications"("status");

-- CreateIndex
CREATE INDEX "reviewed_ingredients_reviewId_idx" ON "reviewed_ingredients"("reviewId");

-- CreateIndex
CREATE INDEX "reviewed_ingredients_position_idx" ON "reviewed_ingredients"("position");

-- CreateIndex
CREATE INDEX "recipe_evidences_recipeStepId_idx" ON "recipe_evidences"("recipeStepId");

-- CreateIndex
CREATE INDEX "recipe_evidences_videoId_idx" ON "recipe_evidences"("videoId");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_reviews" ADD CONSTRAINT "cooking_reviews_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "cooking_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_reviews" ADD CONSTRAINT "cooking_reviews_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ai_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_reviews" ADD CONSTRAINT "cooking_reviews_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "kitchens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_reviews" ADD CONSTRAINT "cooking_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_reviews" ADD CONSTRAINT "cooking_reviews_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewed_cooking_events" ADD CONSTRAINT "reviewed_cooking_events_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cooking_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_clarifications" ADD CONSTRAINT "cooking_clarifications_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cooking_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_clarifications" ADD CONSTRAINT "cooking_clarifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "reviewed_cooking_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewed_ingredients" ADD CONSTRAINT "reviewed_ingredients_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cooking_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_evidences" ADD CONSTRAINT "recipe_evidences_recipeStepId_fkey" FOREIGN KEY ("recipeStepId") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_evidences" ADD CONSTRAINT "recipe_evidences_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "cooking_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
