import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as createKitchenHandler } from "@/app/api/kitchens/route";
import { POST as triggerAiAnalyzeHandler } from "@/app/api/videos/[id]/analyze/route";
import { GET as getAiAnalysisHandler } from "@/app/api/videos/[id]/analysis/route";
import { GET as getAiEventsHandler } from "@/app/api/videos/[id]/analysis/events/route";
import { GET as getAiTranscriptHandler } from "@/app/api/videos/[id]/analysis/transcript/route";
import { GET as getAiObservationsHandler } from "@/app/api/videos/[id]/analysis/observations/route";
import {
  dispatchPendingAiAnalysisJobs,
  createOrGetPendingAiAnalysisJob,
} from "@/lib/services/jobs";

import { persistAIAnalysisResult } from "@/lib/services/ai-analysis";
import { AIAnalysisResponseData } from "@/lib/services/ai-client";
import { closeSharedRedis } from "@/lib/queue/redis";
import { closeQueues } from "@/lib/queue";

describe("Phase 6 AI Video Analysis & Recipe Reconstruction Integration Tests", () => {
  let userACookie: string;
  let userBCookie: string;
  let userCCookie: string;
  let userAId: string;
  let kitchenAId: string;
  let validatedVideoId: string;
  let pendingVideoId: string;

  beforeEach(async () => {
    await clearTestDatabase();

    // 1. Create User A (Owner of Kitchen A)
    const reqA = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Mama Amina",
        email: "amina@familykitchen.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resA = await registerHandler(reqA);
    const dataA = await resA.json();
    userAId = dataA.user.id;
    const cookiesA = resA.headers.getSetCookie();
    userACookie = cookiesA.map((c) => c.split(";")[0]).join("; ");

    // Create Kitchen A
    const kReqA = new NextRequest("http://localhost:3000/api/kitchens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userACookie,
      },
      body: JSON.stringify({
        name: "Amina's Heritage Kitchen",
        description: "West African traditional recipes",
      }),
    });
    const kResA = await createKitchenHandler(kReqA);
    const kDataA = await kResA.json();
    kitchenAId = kDataA.kitchen.id;

    // 2. Create User B (Viewer of Kitchen A)
    const reqB = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Kofi Viewer",
        email: "kofi@familykitchen.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resB = await registerHandler(reqB);
    const dataB = await resB.json();
    const cookiesB = resB.headers.getSetCookie();
    userBCookie = cookiesB.map((c) => c.split(";")[0]).join("; ");

    // Add User B as VIEWER in Kitchen A
    await testDb.kitchenMember.create({
      data: {
        kitchenId: kitchenAId,
        userId: dataB.user.id,
        role: "VIEWER",
      },
    });

    // 3. Create User C (Unrelated outsider)
    const reqC = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Stranger User",
        email: "stranger@otherdomain.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resC = await registerHandler(reqC);
    const cookiesC = resC.headers.getSetCookie();
    userCCookie = cookiesC.map((c) => c.split(";")[0]).join("; ");

    // 4. Create Video 1: VALIDATED state
    const valVideo = await testDb.cookingVideo.create({
      data: {
        kitchenId: kitchenAId,
        uploadedById: userAId,
        originalFilename: "tuwo_cooking_demo.mp4",
        storageKey: `kitchens/${kitchenAId}/videos/tuwo.mp4`,
        contentType: "video/mp4",
        expectedSize: 5242880,
        actualSize: 5242880,
        duration: 217.65,
        videoCodec: "h264",
        audioCodec: "aac",
        width: 1920,
        height: 1080,
        fps: 30.0,
        uploadStatus: "UPLOADED",
        validationStatus: "VALIDATED",
        processingStatus: "NOT_STARTED",
        uploadExpiresAt: new Date(Date.now() + 3600000),
      },
    });
    validatedVideoId = valVideo.id;

    // 5. Create Video 2: PENDING / NOT_VALIDATED state
    const pendVideo = await testDb.cookingVideo.create({
      data: {
        kitchenId: kitchenAId,
        uploadedById: userAId,
        originalFilename: "unvalidated_raw.mp4",
        storageKey: `kitchens/${kitchenAId}/videos/unvalidated.mp4`,
        contentType: "video/mp4",
        expectedSize: 1048576,
        uploadStatus: "UPLOADED",
        validationStatus: "NOT_STARTED",
        processingStatus: "NOT_STARTED",
        uploadExpiresAt: new Date(Date.now() + 3600000),
      },
    });
    pendingVideoId = pendVideo.id;
  });

  afterAll(async () => {
    await closeQueues();
    await closeSharedRedis();
  });

  it("POST /api/videos/[id]/analyze should reject unauthenticated requests", async () => {
    const req = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    const res = await triggerAiAnalyzeHandler(req, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/videos/[id]/analyze should reject videos that have not passed media validation", async () => {
    const req = new NextRequest(`http://localhost:3000/api/videos/${pendingVideoId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userACookie,
      },
    });
    const res = await triggerAiAnalyzeHandler(req, {
      params: Promise.resolve({ id: pendingVideoId }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Only media-validated videos can be analyzed by AI");
  });

  it("POST /api/videos/[id]/analyze should forbid VIEWER role from triggering AI analysis", async () => {
    const req = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userBCookie, // User B is VIEWER
      },
    });
    const res = await triggerAiAnalyzeHandler(req, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(res.status).toBe(404); // Forbidden or not found per permissions policy
  });

  it("POST /api/videos/[id]/analyze should isolate cross-kitchen access", async () => {
    const req = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userCCookie, // User C is unrelated outsider
      },
    });
    const res = await triggerAiAnalyzeHandler(req, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(res.status).toBe(404);
  });

  it("POST /api/videos/[id]/analyze should successfully queue AI analysis for OWNER and prevent duplicates", async () => {
    const req = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userACookie,
      },
    });
    const res = await triggerAiAnalyzeHandler(req, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.job).toBeDefined();
    expect(data.job.jobType).toBe("AI_ANALYSIS");
    expect(data.job.status).toBe("PENDING_DISPATCH");

    // Check video processingStatus moved to QUEUED
    const video = await testDb.cookingVideo.findUnique({ where: { id: validatedVideoId } });
    expect(video?.processingStatus).toBe("QUEUED");

    // Second call must return the existing active job without creating a duplicate
    const req2 = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userACookie,
      },
    });
    const res2 = await triggerAiAnalyzeHandler(req2, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    const data2 = await res2.json();
    expect(data2.job.id).toBe(data.job.id);

    const jobCount = await testDb.processingJob.count({
      where: { videoId: validatedVideoId, jobType: "AI_ANALYSIS" },
    });
    expect(jobCount).toBe(1);
  });

  it("dispatchPendingAiAnalysisJobs should dispatch pending AI analysis jobs to BullMQ", async () => {
    // 1. Create a pending AI job in DB directly
    const job = await createOrGetPendingAiAnalysisJob(testDb, {
      videoId: validatedVideoId,
      kitchenId: kitchenAId,
    });
    expect(job.status).toBe("PENDING_DISPATCH");

    // 2. Dispatch pending jobs
    const dispatchResult = await dispatchPendingAiAnalysisJobs(10);
    expect(dispatchResult.dispatched).toBeGreaterThanOrEqual(1);


    // 3. Verify job transitioned to QUEUED in PostgreSQL
    const updatedJob = await testDb.processingJob.findUnique({ where: { id: job.id } });
    expect(updatedJob?.status).toBe("QUEUED");
    expect(updatedJob?.stage).toBe("QUEUED");
    expect(updatedJob?.bullMqJobId).toContain("ai-analysis-");
  });

  it("persistAIAnalysisResult should store structured analysis, observations, and events with verified=false", async () => {
    const mockAnalysisData: AIAnalysisResponseData = {
      schema_version: "1.0.0",
      whisper_model: "small",
      vision_model: "gemma4:e4b-it-qat",
      video_duration: 217.65,
      speech_status: "NO_USABLE_SPEECH",
      detected_language: "yo",
      summary: "Simmory analyzed visible cooking activity because no usable narration was detected.",
      audio: {
        status: "NO_USABLE_SPEECH",
        language: "yo",
        segments: [],
        notes: "Silence or ungrounded speech filtered by hallucination safeguards.",
      },
      vision: {
        total_frames_extracted: 3,
        total_frames_analyzed: 3,
        sampling_interval_seconds: 10.0,
        observations: [
          {
            frame_id: "frame_001.jpg",
            timestamp_seconds: 10.0,
            visible_action: "Holding utensil over pot",
            food_appearance: "White opaque mixture",
            visible_objects: ["pot", "utensil"],
            uncertain_details: ["Exact flour identity unknown"],
          },
          {
            frame_id: "frame_002.jpg",
            timestamp_seconds: 20.0,
            visible_action: "Stirring mixture vigorously",
            food_appearance: "Thickening paste",
            visible_objects: ["pot", "wooden spatula"],
            uncertain_details: ["Heat setting not visible"],
          },
        ],
      },
      timeline: {
        status: "needs_human_review",
        source_type: "visual_only",
        events: [
          {
            position: 0,
            title: "Pot Preparation and Substance Introduction",
            description: "A white mixture is observed inside a cooking pot.",
            evidence_frames: ["frame_001.jpg"],
            evidence_transcripts: [],
            observed_timestamps: [10.0],
            uncertainties: ["Specific flour type requires confirmation"],
            question_for_cook: "What type of flour or starch is being introduced?",
            verified: false,
          },
          {
            position: 1,
            title: "Stirring and Thickening Stage",
            description: "The mixture transitions from liquid to a thick, uniform paste.",
            evidence_frames: ["frame_002.jpg"],
            evidence_transcripts: [],
            observed_timestamps: [20.0],
            uncertainties: ["Target consistency requires confirmation"],
            question_for_cook: "How do you know when the paste has reached the right texture?",
            verified: false,
          },
        ],
      },
    };

    const saved = await persistAIAnalysisResult({
      videoId: validatedVideoId,
      data: mockAnalysisData,
    });

    expect(saved).toBeDefined();
    expect(saved.speechStatus).toBe("NO_USABLE_SPEECH");
    expect(saved.status).toBe("COMPLETED");

    // Check database records directly
    const storedEvents = await testDb.proposedCookingEvent.findMany({
      where: { analysisId: saved.id },
      orderBy: { position: "asc" },
    });
    expect(storedEvents.length).toBe(2);
    expect(storedEvents[0].title).toBe("Pot Preparation and Substance Introduction");
    expect(storedEvents[0].verified).toBe(false); // MUST NEVER be auto-verified
    expect(storedEvents[1].verified).toBe(false);

    const storedObs = await testDb.visualObservation.findMany({
      where: { analysisId: saved.id },
    });
    expect(storedObs.length).toBe(2);
    expect(storedObs[0].frameId).toBe("frame_001.jpg");

    // Video processingStatus should now be COMPLETED
    const video = await testDb.cookingVideo.findUnique({ where: { id: validatedVideoId } });
    expect(video?.processingStatus).toBe("COMPLETED");
  });

  it("GET /api/videos/[id]/analysis endpoints should return analysis summary, events, and observations", async () => {
    // 1. Persist mock analysis
    const mockData: AIAnalysisResponseData = {
      schema_version: "1.0.0",
      whisper_model: "small",
      vision_model: "gemma4:e4b-it-qat",
      video_duration: 60.0,
      speech_status: "USABLE_SPEECH",
      detected_language: "en",
      summary: "Narrated cooking session analyzed with grounded evidence.",
      audio: {
        status: "USABLE_SPEECH",
        language: "en",
        segments: [
          {
            start: 5.0,
            end: 12.0,
            text: "Add two cups of warm water slowly.",
            language: "en",
            needs_review: false,
            position: 0,
          },
        ],
      },
      vision: {
        total_frames_extracted: 1,
        total_frames_analyzed: 1,
        sampling_interval_seconds: 10.0,
        observations: [
          {
            frame_id: "frame_001.jpg",
            timestamp_seconds: 10.0,
            visible_action: "Pouring water",
            food_appearance: "Liquid mixture",
            visible_objects: ["pot", "measuring cup"],
            uncertain_details: [],
          },
        ],
      },
      timeline: {
        status: "needs_human_review",
        source_type: "audio_visual",
        events: [
          {
            position: 0,
            title: "Adding Water to Pot",
            description: "Spoken instruction matches pouring water action.",
            evidence_frames: ["frame_001.jpg"],
            evidence_transcripts: ["seg_0"],
            observed_timestamps: [10.0],
            uncertainties: ["Water temperature"],
            question_for_cook: "Should the water be lukewarm or boiling?",
            verified: false,
          },
        ],
      },
    };

    await persistAIAnalysisResult({
      videoId: validatedVideoId,
      data: mockData,
    });

    // 2. GET summary
    const sumReq = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analysis`, {
      headers: { host: "localhost:3000", cookie: userACookie },
    });
    const sumRes = await getAiAnalysisHandler(sumReq, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(sumRes.status).toBe(200);
    const sumData = await sumRes.json();
    expect(sumData.speechStatus).toBe("USABLE_SPEECH");
    expect(sumData.proposedEventCount).toBe(1);
    expect(sumData.observationCount).toBe(1);
    expect(sumData.transcriptCount).toBe(1);

    // 3. GET events
    const evReq = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analysis/events`, {
      headers: { host: "localhost:3000", cookie: userACookie },
    });
    const evRes = await getAiEventsHandler(evReq, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(evRes.status).toBe(200);
    const evData = await evRes.json();
    expect(evData.events.length).toBe(1);
    expect(evData.events[0].title).toBe("Adding Water to Pot");
    expect(evData.events[0].verified).toBe(false);

    // 4. GET transcript
    const trReq = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analysis/transcript`, {
      headers: { host: "localhost:3000", cookie: userACookie },
    });
    const trRes = await getAiTranscriptHandler(trReq, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(trRes.status).toBe(200);
    const trData = await trRes.json();
    expect(trData.speechStatus).toBe("USABLE_SPEECH");
    expect(trData.segments.length).toBe(1);
    expect(trData.segments[0].text).toContain("Add two cups of warm water");

    // 5. GET observations
    const obsReq = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analysis/observations`, {
      headers: { host: "localhost:3000", cookie: userACookie },
    });
    const obsRes = await getAiObservationsHandler(obsReq, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(obsRes.status).toBe(200);
    const obsData = await obsRes.json();
    expect(obsData.observations.length).toBe(1);
    expect(obsData.observations[0].frameId).toBe("frame_001.jpg");

    // 6. Cross-kitchen isolation check: outsider User C cannot read analysis
    const outReq = new NextRequest(`http://localhost:3000/api/videos/${validatedVideoId}/analysis`, {
      headers: { host: "localhost:3000", cookie: userCCookie },
    });
    const outRes = await getAiAnalysisHandler(outReq, {
      params: Promise.resolve({ id: validatedVideoId }),
    });
    expect(outRes.status).toBe(404);
  });
});
