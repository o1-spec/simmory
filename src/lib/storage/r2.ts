import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"] as const;

export class StorageNotConfiguredError extends Error {
  constructor(message = "Storage service is not configured.") {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

/**
 * Returns the maximum allowed video upload size in bytes.
 * Configured via MAX_VIDEO_SIZE_MB (default 250MB).
 */
export function getMaxVideoSizeBytes(): number {
  const mb = parseInt(process.env.MAX_VIDEO_SIZE_MB || "250", 10);
  return (isNaN(mb) || mb <= 0 ? 250 : mb) * 1024 * 1024;
}

/**
 * Checks whether valid Cloudflare R2 / S3 storage credentials are configured.
 * Does not throw; returns a boolean for safe UI state rendering and feature gating.
 */
export function isStorageConfigured(): boolean {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const endpoint = process.env.R2_ENDPOINT?.trim();

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    return false;
  }

  // Reject placeholder values
  if (
    accessKeyId.includes("your_r2_access_key_id") ||
    secretAccessKey.includes("your_r2_secret_access_key") ||
    accessKeyId.includes("replace_with_")
  ) {
    return false;
  }

  // Must have either an explicit S3 endpoint or an R2 Account ID
  if (!endpoint && (!accountId || accountId.includes("your_cloudflare_account_id"))) {
    return false;
  }

  return true;
}

/**
 * Retrieves normalized storage configuration or throws StorageNotConfiguredError.
 */
export function getStorageConfig() {
  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError(
      "Cloudflare R2 / S3 object storage is not configured. Please supply R2 credentials in environment variables."
    );
  }

  const accessKeyId = process.env.R2_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!.trim();
  const bucket = process.env.R2_BUCKET_NAME!.trim();
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
  };
}

let s3ClientInstance: S3Client | null = null;

/**
 * Lazily instantiates and caches the S3Client.
 */
export function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  const config = getStorageConfig();

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return s3ClientInstance;
}

/**
 * For unit testing: allows overriding or resetting the S3 client instance.
 */
export function setS3ClientForTesting(client: S3Client | null) {
  s3ClientInstance = client;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

/**
 * Generates a short-lived presigned PUT URL for direct browser-to-R2 upload.
 */
export async function generatePresignedUploadUrl({
  storageKey,
  contentType,
  expectedSize,
  expiresInSeconds = 300, // 5 minutes
}: {
  storageKey: string;
  contentType: string;
  expectedSize: number;
  expiresInSeconds?: number;
}): Promise<PresignedUploadResult> {
  const client = getS3Client();
  const config = getStorageConfig();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
    ContentType: contentType,
    ContentLength: expectedSize,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    storageKey,
    expiresInSeconds,
  };
}

export interface HeadObjectResult {
  exists: boolean;
  contentLength?: number;
  contentType?: string;
  eTag?: string;
}

/**
 * Verifies object existence and inspects metadata on Cloudflare R2 using HEAD request.
 */
export async function verifyObjectExists(
  storageKey: string
): Promise<HeadObjectResult> {
  const client = getS3Client();
  const config = getStorageConfig();

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
    });

    const response = await client.send(command);

    return {
      exists: true,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      eTag: response.ETag,
    };
  } catch (error: unknown) {
    // S3 NotFound or NoSuchKey status
    if (
      typeof error === "object" &&
      error !== null &&
      ("name" in error && (error.name === "NotFound" || error.name === "NoSuchKey") ||
        "$metadata" in error && (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
    ) {
      return { exists: false };
    }
    throw error;
  }
}

export interface PresignedPlaybackResult {
  playbackUrl: string;
  expiresInSeconds: number;
}

/**
 * Generates an authorized, short-lived presigned GET URL for secure video playback.
 */
export async function generatePresignedPlaybackUrl({
  storageKey,
  expiresInSeconds = 900, // 15 minutes
}: {
  storageKey: string;
  expiresInSeconds?: number;
}): Promise<PresignedPlaybackResult> {
  const client = getS3Client();
  const config = getStorageConfig();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
  });

  const playbackUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    playbackUrl,
    expiresInSeconds,
  };
}

/**
 * Deletes an object from Cloudflare R2 / S3 storage.
 */
export async function deleteStorageObject(
  storageKey: string
): Promise<{ success: boolean }> {
  const client = getS3Client();
  const config = getStorageConfig();

  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
  });

  await client.send(command);
  return { success: true };
}

type DownloadHandler = (
  storageKey: string,
  destinationFilePath: string
) => Promise<{ bytesWritten: number }>;

let downloadHandlerOverride: DownloadHandler | null = null;

/**
 * Sets a custom download handler for unit and integration testing without cloud credentials.
 */
export function setDownloadHandlerForTesting(handler: DownloadHandler | null) {
  downloadHandlerOverride = handler;
}

/**
 * Downloads a private media object from Cloudflare R2 / S3 storage to a local file.
 * Used by the background worker for media validation.
 */
export async function downloadStorageObject(
  storageKey: string,
  destinationFilePath: string
): Promise<{ bytesWritten: number }> {
  if (downloadHandlerOverride) {
    return downloadHandlerOverride(storageKey, destinationFilePath);
  }

  const client = getS3Client();
  const config = getStorageConfig();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: storageKey,
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new Error(`Empty response body for storageKey: ${storageKey}`);
  }

  const fs = await import("fs");
  const { pipeline } = await import("stream/promises");
  const writeStream = fs.createWriteStream(destinationFilePath);

  // AWS SDK v3 Body in Node environment is a stream.Readable
  const readableStream = response.Body as NodeJS.ReadableStream;
  await pipeline(readableStream, writeStream);

  const stats = await fs.promises.stat(destinationFilePath);
  return { bytesWritten: stats.size };
}

