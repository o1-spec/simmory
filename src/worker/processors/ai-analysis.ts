import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { Job } from "bullmq";
import { db } from "../../lib/db";
import { downloadStorageObject } from "../../lib/storage/r2";
import { AiAnalysisJobPayload } from "../../lib/queue";
import { aiServiceClient } from "../../lib/services/ai-client";
import { persistAIAnalysisResult } from "../../lib/services/ai-analysis";

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let msg = error.message;
    msg = msg.replace(/\/[\w.-]+(\/[\w.-]+)+/g, "[path]");
    return msg.slice(0, 500);
  }
  return "Unknown AI analysis failure.";
}

/**
 * BullMQ job processor for AI video analysis and recipe reconstruction.
 * Coordinates between S3/R2 storage, Python AI Service, and PostgreSQL persistence.
 */
export async function processAiAnalysisJob(job: Job<AiAnalysisJobPayload>) {
  const { jobId, videoId } = job.data;
  console.log(`[AI Worker] Starting analysis job ${jobId} for video ${videoId}...`);

  // 1. Fetch and verify video
  const video = await db.cookingVideo.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    throw new Error(`Video ${videoId} not found for AI analysis.`);
  }

  if (video.validationStatus !== "VALIDATED") {
    throw new Error(
      `INVALID_MEDIA_STATE: Video ${videoId} must be in VALIDATED state (current: ${video.validationStatus}) before running AI analysis.`
    );
  }

  // 2. Transition processing job to PROCESSING & PREPARING_MEDIA
  await db.processingJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      stage: "PREPARING_MEDIA",
      startedAt: new Date(),
      lastHeartbeat: new Date(),
    },
  });

  await db.cookingVideo.update({
    where: { id: videoId },
    data: {
      processingStatus: "PROCESSING",
    },
  });

  const tempFilePath = path.join(
    os.tmpdir(),
    `simmory-ai-${crypto.randomBytes(8).toString("hex")}.mp4`
  );

  try {
    // 3. Download media from storage to temporary local processing file
    console.log(`[AI Worker] Downloading media for storageKey=${video.storageKey}...`);
    await downloadStorageObject(video.storageKey, tempFilePath);
    await job.updateProgress(20);

    // 4. Update stage to ANALYZING_FRAMES
    await db.processingJob.update({
      where: { id: jobId },
      data: {
        stage: "ANALYZING_MEDIA",
        lastHeartbeat: new Date(),
      },
    });

    console.log(`[AI Worker] Invoking Python AI Service for video: ${tempFilePath}...`);
    await job.updateProgress(40);

    // 5. Invoke Python AI Service over authenticated loopback
    const analysisResponse = await aiServiceClient.analyzeLocalVideoPath(tempFilePath);
    await job.updateProgress(80);

    // 6. Update stage to SAVING_RESULTS
    await db.processingJob.update({
      where: { id: jobId },
      data: {
        stage: "SAVING_RESULTS",
        lastHeartbeat: new Date(),
      },
    });

    // 7. Persist analysis results atomically in PostgreSQL
    console.log(`[AI Worker] Persisting AI analysis results for video ${videoId}...`);
    const saved = await persistAIAnalysisResult({
      videoId,
      jobId,
      data: analysisResponse,
    });

    await job.updateProgress(100);
    console.log(`[AI Worker] Successfully completed AI analysis ${saved.id} for video ${videoId}.`);
    return { success: true, analysisId: saved.id };

  } catch (error: unknown) {
    const errorMsg = sanitizeErrorMessage(error);
    console.error(`[AI Worker] Job ${jobId} failed:`, errorMsg);

    // Update processing job with error
    await db.processingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        stage: "FAILED",
        errorCode: "AI_ANALYSIS_FAILED",
        errorMessage: errorMsg,
        completedAt: new Date(),
      },
    });

    // Update video processing status
    await db.cookingVideo.update({
      where: { id: videoId },
      data: {
        processingStatus: "FAILED",
      },
    });

    throw error;
  } finally {
    // 8. Always clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.warn(`[AI Worker] Failed to delete temp file ${tempFilePath}:`, cleanupErr);
      }
    }
  }
}
