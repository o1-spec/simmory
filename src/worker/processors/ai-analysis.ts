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
import { logger } from "../../lib/logger";

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let msg = error.message;
    msg = msg.replace(/\/[\w.-]+(\/[\w.-]+)+/g, "[path]");
    return msg.slice(0, 500);
  }
  return "Unknown AI analysis failure.";
}

export async function processAiAnalysisJob(job: Job<AiAnalysisJobPayload>) {
  const { jobId, videoId } = job.data;
  logger.info(`[AI Worker] Starting analysis job ${jobId} for video ${videoId}`);

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

  await db.processingJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      stage: "INITIALIZING",
      startedAt: new Date(),
      lastHeartbeat: new Date(),
    },
  });

  const ext = path.extname(video.originalFilename) || ".mp4";
  const tempFilename = `simmory_ai_${crypto.randomBytes(8).toString("hex")}${ext}`;
  const tempFilePath = path.join(
    process.env.TEMP_DIR || os.tmpdir(),
    tempFilename
  );

  try {
    logger.info(`[AI Worker] Downloading media for storageKey=${video.storageKey}`);
    await downloadStorageObject(video.storageKey, tempFilePath);
    await job.updateProgress(20);

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        stage: "ANALYZING_MEDIA",
        lastHeartbeat: new Date(),
      },
    });

    logger.info(`[AI Worker] Invoking Python AI Service for video job: ${jobId}`);
    await job.updateProgress(40);

    const analysisResponse = await aiServiceClient.analyzeLocalVideoPath(tempFilePath);
    await job.updateProgress(80);

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        stage: "SAVING_RESULTS",
        lastHeartbeat: new Date(),
      },
    });

    logger.info(`[AI Worker] Persisting AI analysis results for video ${videoId}`);
    const saved = await persistAIAnalysisResult({
      videoId,
      jobId,
      data: analysisResponse,
    });

    await job.updateProgress(100);
    logger.info(`[AI Worker] Successfully completed AI analysis ${saved.id} for video ${videoId}`);
    return { success: true, analysisId: saved.id };

  } catch (error: unknown) {
    const errorMsg = sanitizeErrorMessage(error);
    logger.error(`[AI Worker] Job ${jobId} failed:`, { error: errorMsg });

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorCode: "AI_ANALYSIS_FAILED",
        errorMessage: errorMsg,
        completedAt: new Date(),
      },
    });

    await db.cookingVideo.update({
      where: { id: videoId },
      data: {
        processingStatus: "FAILED",
      },
    });

    throw error;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        logger.warn("[AI Worker] Failed to delete temp file", { error: cleanupErr });
      }
    }
  }
}
