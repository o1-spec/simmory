import { db } from "../db";
import { Prisma } from "../../generated/prisma/client";
import { AIAnalysisResponseData } from "./ai-client";
import { getVideoWithAccess } from "../auth/permissions";

/**
 * Persists complete, structured AI video analysis results into PostgreSQL.
 * Uses atomic transactions, defines versioned records, and prevents auto-verification.
 */
export async function persistAIAnalysisResult(params: {
  videoId: string;
  jobId?: string;
  data: AIAnalysisResponseData;
}) {
  const { videoId, jobId, data } = params;

  return db.$transaction(async (tx) => {
    // 1. Create top-level AIAnalysis record
    const analysis = await tx.aIAnalysis.create({
      data: {
        videoId,
        jobId: jobId || null,
        schemaVersion: data.schema_version,
        whisperModel: data.whisper_model,
        visionModel: data.vision_model,
        speechStatus: data.speech_status,
        detectedLanguage: data.detected_language,
        status: "COMPLETED",
        summary: data.summary,
        totalFrames: data.vision.total_frames_analyzed,
        samplingStrategy: data.vision.sampling_strategy || null,
        coverageRatio: data.vision.coverage_ratio ?? null,
        sampledTimeRange: (data.vision.sampled_time_range || null) as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    // 2. Persist transcript segments (if usable speech or reviewable speech detected)
    if (data.audio.segments.length > 0) {
      await tx.transcriptSegment.createMany({
        data: data.audio.segments.map((seg, idx) => ({
          analysisId: analysis.id,
          start: seg.start,
          end: seg.end,
          text: seg.text,
          language: seg.language || data.detected_language || null,
          needsReview: seg.needs_review,
          position: idx,
        })),
      });
    }

    // 3. Persist visual observations
    if (data.vision.observations.length > 0) {
      await tx.visualObservation.createMany({
        data: data.vision.observations.map((obs, idx) => ({
          analysisId: analysis.id,
          frameId: obs.frame_id,
          timestampSeconds: obs.timestamp_seconds,
          visibleObjects: obs.visible_objects as unknown as Prisma.InputJsonValue,
          visibleAction: obs.visible_action || null,
          foodAppearance: obs.food_appearance || null,
          uncertainDetails: obs.uncertain_details as unknown as Prisma.InputJsonValue,
          position: idx,
        })),
      });
    }

    // 4. Persist proposed cooking events with grounded evidence (NEVER pre-verified)
    if (data.timeline.events.length > 0) {
      await tx.proposedCookingEvent.createMany({
        data: data.timeline.events.map((ev, idx) => ({
          analysisId: analysis.id,
          position: idx,
          title: ev.title,
          description: ev.description,
          evidenceFrames: ev.evidence_frames as unknown as Prisma.InputJsonValue,
          evidenceTranscripts: (ev.evidence_transcripts || []) as unknown as Prisma.InputJsonValue,
          observedTimestamps: ev.observed_timestamps as unknown as Prisma.InputJsonValue,
          uncertainties: ev.uncertainties as unknown as Prisma.InputJsonValue,
          questionForCook: ev.question_for_cook || null,
          verified: false, // Strict requirement: never mark AI events as verified
        })),
      });
    }

    // 5. Update cooking video processing status to COMPLETED
    await tx.cookingVideo.update({
      where: { id: videoId },
      data: {
        processingStatus: "COMPLETED",
      },
    });

    // 6. Update processing job status to COMPLETED if provided
    if (jobId) {
      await tx.processingJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          stage: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    return analysis;
  });
}

/**
 * Retrieves the latest AI analysis summary for an authorized kitchen member.
 */
export async function getLatestAIAnalysis(videoId: string, userId: string) {
  const access = await getVideoWithAccess(videoId, userId);
  if (!access) return null;

  const analysis = await db.aIAnalysis.findFirst({
    where: { videoId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          transcriptSegments: true,
          visualObservations: true,
          proposedEvents: true,
        },
      },
    },
  });

  if (!analysis) return null;

  return {
    id: analysis.id,
    videoId: analysis.videoId,
    status: analysis.status,
    speechStatus: analysis.speechStatus,
    detectedLanguage: analysis.detectedLanguage,
    whisperModel: analysis.whisperModel,
    visionModel: analysis.visionModel,
    summary: analysis.summary,
    totalFrames: analysis.totalFrames,
    samplingStrategy: analysis.samplingStrategy,
    coverageRatio: analysis.coverageRatio,
    sampledTimeRange: analysis.sampledTimeRange,
    transcriptCount: analysis._count.transcriptSegments,
    observationCount: analysis._count.visualObservations,
    proposedEventCount: analysis._count.proposedEvents,
    needsReview: true, // All AI output requires human review before becoming verified steps
    completedAt: analysis.completedAt,
    createdAt: analysis.createdAt,
  };
}

/**
 * Retrieves proposed cooking events with their evidence timestamps.
 * Authorized for any member of the kitchen (OWNER, EDITOR, VIEWER).
 */
export async function getProposedCookingEvents(videoId: string, userId: string) {
  const access = await getVideoWithAccess(videoId, userId);
  if (!access) return null;

  const analysis = await db.aIAnalysis.findFirst({
    where: { videoId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  if (!analysis) return [];

  const events = await db.proposedCookingEvent.findMany({
    where: { analysisId: analysis.id },
    orderBy: { position: "asc" },
  });

  return events.map((ev) => ({
    id: ev.id,
    position: ev.position,
    title: ev.title,
    description: ev.description,
    evidenceFrames: ev.evidenceFrames,
    evidenceTranscripts: ev.evidenceTranscripts,
    observedTimestamps: ev.observedTimestamps,
    uncertainties: ev.uncertainties,
    questionForCook: ev.questionForCook,
    verified: ev.verified,
  }));
}

/**
 * Retrieves transcript segments with review flags and timestamps.
 */
export async function getTranscriptSegments(videoId: string, userId: string) {
  const access = await getVideoWithAccess(videoId, userId);
  if (!access) return null;

  const analysis = await db.aIAnalysis.findFirst({
    where: { videoId },
    orderBy: { createdAt: "desc" },
  });

  if (!analysis) return { speechStatus: "NOT_STARTED", segments: [] };

  const segments = await db.transcriptSegment.findMany({
    where: { analysisId: analysis.id },
    orderBy: { position: "asc" },
  });

  return {
    speechStatus: analysis.speechStatus,
    detectedLanguage: analysis.detectedLanguage,
    segments: segments.map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      text: s.text,
      language: s.language,
      needsReview: s.needsReview,
      position: s.position,
    })),
  };
}

/**
 * Retrieves visual observations with timestamps.
 */
export async function getVisualObservations(videoId: string, userId: string) {
  const access = await getVideoWithAccess(videoId, userId);
  if (!access) return null;

  const analysis = await db.aIAnalysis.findFirst({
    where: { videoId },
    orderBy: { createdAt: "desc" },
  });

  if (!analysis) return [];

  const observations = await db.visualObservation.findMany({
    where: { analysisId: analysis.id },
    orderBy: { position: "asc" },
  });

  return observations.map((obs) => ({
    id: obs.id,
    frameId: obs.frameId,
    timestampSeconds: obs.timestampSeconds,
    visibleObjects: obs.visibleObjects,
    visibleAction: obs.visibleAction,
    foodAppearance: obs.foodAppearance,
    uncertainDetails: obs.uncertainDetails,
  }));
}
