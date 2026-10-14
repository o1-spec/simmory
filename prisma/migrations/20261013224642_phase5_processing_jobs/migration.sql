-- CreateEnum
CREATE TYPE "MediaValidationStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'VALIDATING', 'VALIDATED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('VIDEO_VALIDATION', 'AI_ANALYSIS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING_DISPATCH', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "cooking_videos" ADD COLUMN     "audioCodec" TEXT,
ADD COLUMN     "fps" DOUBLE PRECISION,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "validationError" TEXT,
ADD COLUMN     "validationStatus" "MediaValidationStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "videoCodec" TEXT,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" UUID NOT NULL,
    "videoId" UUID NOT NULL,
    "kitchenId" UUID NOT NULL,
    "jobType" "JobType" NOT NULL DEFAULT 'VIDEO_VALIDATION',
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING_DISPATCH',
    "stage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "progressInfo" TEXT,
    "queuedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastHeartbeat" TIMESTAMP(3),
    "bullMqJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processing_jobs_videoId_idx" ON "processing_jobs"("videoId");

-- CreateIndex
CREATE INDEX "processing_jobs_kitchenId_idx" ON "processing_jobs"("kitchenId");

-- CreateIndex
CREATE INDEX "processing_jobs_status_idx" ON "processing_jobs"("status");

-- CreateIndex
CREATE INDEX "processing_jobs_jobType_idx" ON "processing_jobs"("jobType");

-- CreateIndex
CREATE INDEX "processing_jobs_createdAt_idx" ON "processing_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "cooking_videos_validationStatus_idx" ON "cooking_videos"("validationStatus");

-- CreateUniqueIndex for active jobs preventing duplicate active validation
CREATE UNIQUE INDEX "processing_jobs_active_video_job_idx" ON "processing_jobs"("videoId", "jobType") 
WHERE "status" IN ('PENDING_DISPATCH', 'QUEUED', 'PROCESSING');

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "cooking_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "kitchens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
