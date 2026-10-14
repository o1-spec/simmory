import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { db } from "../../lib/db";
import { downloadStorageObject, getMaxVideoSizeBytes } from "../../lib/storage/r2";
import { VideoValidationJobPayload } from "../../lib/queue";
import { logger } from "../../lib/logger";

const execFileAsync = promisify(execFile);

export interface FFprobeStreamInfo {
  index: number;
  codec_name?: string;
  codec_type?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
}

export interface FFprobeFormatInfo {
  duration?: string;
  size?: string;
  bit_rate?: string;
}

export interface FFprobeOutput {
  streams?: FFprobeStreamInfo[];
  format?: FFprobeFormatInfo;
}

export interface ValidationSuccessResult {
  duration: number;
  videoCodec: string;
  audioCodec: string | null;
  width: number;
  height: number;
  fps: number | null;
}

function parseFps(rateStr?: string): number | null {
  if (!rateStr) return null;
  const parts = rateStr.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (den > 0) return Math.round((num / den) * 100) / 100;
  }
  const val = parseFloat(rateStr);
  return isNaN(val) ? null : val;
}

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let msg = error.message;
    // Strip absolute paths to avoid leaking system directory details
    msg = msg.replace(/\/[\w.-]+(\/[\w.-]+)+/g, "[path]");
    return msg.slice(0, 500);
  }
  return "Unknown video validation failure.";
}

/**
 * Runs FFprobe on a safe local file path with execution timeout and bounded buffer.
 */
export async function runFFprobeInspection(
  filePath: string,
  ffprobeBinary = process.env.FFPROBE_PATH || "ffprobe"
): Promise<ValidationSuccessResult> {
  const args = [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size,bit_rate:stream=index,codec_name,codec_type,width,height,r_frame_rate",
    "-of",
    "json",
    filePath,
  ];

  const { stdout } = await execFileAsync(ffprobeBinary, args, {
    timeout: 30000, // 30 seconds max inspection time
    maxBuffer: 5 * 1024 * 1024, // 5MB buffer
  });

  const parsed: FFprobeOutput = JSON.parse(stdout);
  const streams = parsed.streams || [];
  const format = parsed.format || {};

  // 1. Must find at least one video stream
  const videoStream = streams.find((s) => s.codec_type === "video");
  if (!videoStream || !videoStream.codec_name) {
    throw new Error("NO_VIDEO_STREAM: Uploaded container does not contain a decodable video stream.");
  }

  // 2. Validate dimensions
  if (!videoStream.width || !videoStream.height || videoStream.width <= 0 || videoStream.height <= 0) {
    throw new Error("INVALID_DIMENSIONS: Video stream has zero or invalid resolution.");
  }

  // 3. Extract duration
  const duration = parseFloat(format.duration || "0");
  if (isNaN(duration) || duration <= 0) {
    throw new Error("INVALID_DURATION: Video stream duration could not be determined.");
  }

  // 4. Optional audio stream
  const audioStream = streams.find((s) => s.codec_type === "audio");
  const audioCodec = audioStream?.codec_name || null;
  const fps = parseFps(videoStream.r_frame_rate);

  return {
    duration: Math.round(duration * 100) / 100,
    videoCodec: videoStream.codec_name,
    audioCodec,
    width: videoStream.width,
    height: videoStream.height,
    fps,
  };
}

/**
 * Core processor for BullMQ video-validation jobs.
 */
export async function processVideoValidationJob(
  payload: VideoValidationJobPayload
): Promise<ValidationSuccessResult> {
  const { jobId, videoId, storageKey } = payload;

  // 1. Fetch job and video records
  const job = await db.processingJob.findUnique({
    where: { id: jobId },
    include: { video: true },
  });

  if (!job || !job.video) {
    throw new Error(`Job or video record not found: jobId=${jobId}`);
  }

  if (job.video.uploadStatus !== "UPLOADED") {
    throw new Error(`Video is not in UPLOADED status: current=${job.video.uploadStatus}`);
  }

  // 2. Transition job to PROCESSING and stage to DOWNLOADING
  await db.processingJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      stage: "DOWNLOADING",
      startedAt: new Date(),
      lastHeartbeat: new Date(),
      attempts: { increment: 1 },
    },
  });

  await db.cookingVideo.update({
    where: { id: videoId },
    data: {
      validationStatus: "VALIDATING",
      validationError: null,
    },
  });

  // 3. Prepare bounded temporary path
  const tempDir = path.join(os.tmpdir(), "simmory-validation");
  await fs.promises.mkdir(tempDir, { recursive: true, mode: 0o700 });
  const uniqueToken = crypto.randomBytes(8).toString("hex");
  const tempFilePath = path.join(tempDir, `vid-${jobId}-${uniqueToken}.bin`);

  try {
    // 4. Download media from storage
    const maxAllowedBytes = getMaxVideoSizeBytes();
    const downloadResult = await downloadStorageObject(storageKey, tempFilePath);

    if (downloadResult.bytesWritten > maxAllowedBytes) {
      throw new Error(`EXCEEDS_MAX_SIZE: Downloaded file size (${downloadResult.bytesWritten} bytes) exceeds maximum limit (${maxAllowedBytes} bytes).`);
    }

    // 5. Update stage to INSPECTING
    await db.processingJob.update({
      where: { id: jobId },
      data: {
        stage: "INSPECTING",
        lastHeartbeat: new Date(),
      },
    });

    // 6. Run FFprobe inspection
    const validation = await runFFprobeInspection(tempFilePath);

    // 7. Persist validation success
    await db.cookingVideo.update({
      where: { id: videoId },
      data: {
        validationStatus: "VALIDATED",
        duration: validation.duration,
        videoCodec: validation.videoCodec,
        audioCodec: validation.audioCodec,
        width: validation.width,
        height: validation.height,
        fps: validation.fps,
        validationError: null,
      },
    });

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        stage: "VALIDATED",
        completedAt: new Date(),
        lastHeartbeat: new Date(),
        progressInfo: JSON.stringify(validation),
      },
    });

    return validation;
  } catch (error: unknown) {
    const sanitized = sanitizeErrorMessage(error);
    const errorCode = error instanceof Error && error.message.includes(":")
      ? error.message.split(":")[0].trim()
      : "VALIDATION_FAILED";

    // Mark job and video as FAILED
    await db.cookingVideo.update({
      where: { id: videoId },
      data: {
        validationStatus: "FAILED",
        validationError: sanitized,
      },
    });

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        stage: "FAILED",
        errorCode,
        errorMessage: sanitized,
        completedAt: new Date(),
        lastHeartbeat: new Date(),
      },
    });

    throw error;
  } finally {
    // 8. Always clean up temporary media files
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch (cleanupErr) {
      logger.warn("[VideoValidation] Temp file cleanup warning", { error: cleanupErr });
    }
  }
}
