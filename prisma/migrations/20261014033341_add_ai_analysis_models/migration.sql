-- CreateEnum
CREATE TYPE "SpeechStatus" AS ENUM ('USABLE_SPEECH', 'NO_AUDIO_TRACK', 'NO_USABLE_SPEECH', 'LOW_CONFIDENCE', 'TRANSCRIPTION_FAILED');

-- CreateEnum
CREATE TYPE "AIAnalysisStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" UUID NOT NULL,
    "videoId" UUID NOT NULL,
    "jobId" UUID,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "whisperModel" TEXT NOT NULL DEFAULT 'small',
    "visionModel" TEXT NOT NULL DEFAULT 'gemma4:e4b-it-qat',
    "speechStatus" "SpeechStatus" NOT NULL DEFAULT 'NO_USABLE_SPEECH',
    "detectedLanguage" TEXT,
    "status" "AIAnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
    "summary" TEXT,
    "totalFrames" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_segments" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "end" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcript_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visual_observations" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "frameId" TEXT NOT NULL,
    "timestampSeconds" DOUBLE PRECISION NOT NULL,
    "visibleObjects" JSONB NOT NULL,
    "visibleAction" TEXT,
    "foodAppearance" TEXT,
    "uncertainDetails" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visual_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposed_cooking_events" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceFrames" JSONB NOT NULL,
    "evidenceTranscripts" JSONB,
    "observedTimestamps" JSONB NOT NULL,
    "uncertainties" JSONB NOT NULL,
    "questionForCook" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposed_cooking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_analyses_videoId_idx" ON "ai_analyses"("videoId");

-- CreateIndex
CREATE INDEX "ai_analyses_jobId_idx" ON "ai_analyses"("jobId");

-- CreateIndex
CREATE INDEX "ai_analyses_status_idx" ON "ai_analyses"("status");

-- CreateIndex
CREATE INDEX "transcript_segments_analysisId_idx" ON "transcript_segments"("analysisId");

-- CreateIndex
CREATE INDEX "transcript_segments_position_idx" ON "transcript_segments"("position");

-- CreateIndex
CREATE INDEX "visual_observations_analysisId_idx" ON "visual_observations"("analysisId");

-- CreateIndex
CREATE INDEX "visual_observations_frameId_idx" ON "visual_observations"("frameId");

-- CreateIndex
CREATE INDEX "visual_observations_timestampSeconds_idx" ON "visual_observations"("timestampSeconds");

-- CreateIndex
CREATE INDEX "proposed_cooking_events_analysisId_idx" ON "proposed_cooking_events"("analysisId");

-- CreateIndex
CREATE INDEX "proposed_cooking_events_position_idx" ON "proposed_cooking_events"("position");

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "cooking_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "processing_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ai_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_observations" ADD CONSTRAINT "visual_observations_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ai_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposed_cooking_events" ADD CONSTRAINT "proposed_cooking_events_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ai_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
