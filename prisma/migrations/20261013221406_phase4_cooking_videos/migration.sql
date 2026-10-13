-- CreateEnum
CREATE TYPE "VideoUploadStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "VideoProcessingStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "cooking_videos" (
    "id" UUID NOT NULL,
    "kitchenId" UUID NOT NULL,
    "recipeId" UUID,
    "uploadedById" UUID NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "expectedSize" INTEGER NOT NULL,
    "actualSize" INTEGER,
    "duration" DOUBLE PRECISION,
    "uploadStatus" "VideoUploadStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "processingStatus" "VideoProcessingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "uploadExpiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cooking_videos_storageKey_key" ON "cooking_videos"("storageKey");

-- CreateIndex
CREATE INDEX "cooking_videos_kitchenId_idx" ON "cooking_videos"("kitchenId");

-- CreateIndex
CREATE INDEX "cooking_videos_recipeId_idx" ON "cooking_videos"("recipeId");

-- CreateIndex
CREATE INDEX "cooking_videos_uploadedById_idx" ON "cooking_videos"("uploadedById");

-- CreateIndex
CREATE INDEX "cooking_videos_uploadStatus_idx" ON "cooking_videos"("uploadStatus");

-- AddForeignKey
ALTER TABLE "cooking_videos" ADD CONSTRAINT "cooking_videos_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "kitchens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_videos" ADD CONSTRAINT "cooking_videos_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_videos" ADD CONSTRAINT "cooking_videos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
