import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as createKitchenHandler } from "@/app/api/kitchens/route";
import { GET as getReviewHandler, POST as initReviewHandler } from "@/app/api/videos/[id]/review/route";
import {
  GET as getReviewByIdHandler,
  PATCH as patchReviewHandler,
} from "@/app/api/reviews/[reviewId]/route";
import {
  PATCH as patchEventHandler,
  DELETE as deleteEventHandler,
} from "@/app/api/reviews/[reviewId]/events/[eventId]/route";
import { POST as addEventHandler } from "@/app/api/reviews/[reviewId]/events/route";
import { POST as clarificationHandler } from "@/app/api/reviews/[reviewId]/clarifications/route";
import { POST as ingredientHandler } from "@/app/api/reviews/[reviewId]/ingredients/route";
import { POST as completeReviewHandler } from "@/app/api/reviews/[reviewId]/complete/route";
import { POST as convertRecipeHandler } from "@/app/api/reviews/[reviewId]/recipe/route";

import { persistAIAnalysisResult } from "@/lib/services/ai-analysis";
import { AIAnalysisResponseData } from "@/lib/services/ai-client";
import { closeSharedRedis } from "@/lib/queue/redis";
import { closeQueues } from "@/lib/queue";

describe("Phase 7 Human Recipe Review, Reconstruction & Verification Tests", () => {
  let userACookie: string;
  let userBCookie: string;
  let userCCookie: string;
  let userAId: string;
  let userBId: string;
  let kitchenAId: string;
  let videoWithAnalysisId: string;
  let videoWithoutAnalysisId: string;

  beforeEach(async () => {
    await clearTestDatabase();

    // 1. User A (Owner of Kitchen A)
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

    // Kitchen A
    const kReqA = new NextRequest("http://localhost:3000/api/kitchens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({
        name: "Amina's Family Kitchen",
        description: "Preserving authentic Tuwo recipes",
      }),
    });
    const kResA = await createKitchenHandler(kReqA);
    const kDataA = await kResA.json();
    kitchenAId = kDataA.kitchen.id;

    // 2. User B (Viewer of Kitchen A)
    const reqB = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Viewer Zainab",
        email: "zainab@familykitchen.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resB = await registerHandler(reqB);
    const dataB = await resB.json();
    userBId = dataB.user.id;
    const cookiesB = resB.headers.getSetCookie();
    userBCookie = cookiesB.map((c) => c.split(";")[0]).join("; ");

    // Add User B as VIEWER in Kitchen A
    await testDb.kitchenMember.create({
      data: {
        kitchenId: kitchenAId,
        userId: userBId,
        role: "VIEWER",
      },
    });

    // 3. User C (External User in Kitchen C)
    const reqC = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Stranger Bob",
        email: "bob@stranger.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resC = await registerHandler(reqC);
    const cookiesC = resC.headers.getSetCookie();
    userCCookie = cookiesC.map((c) => c.split(";")[0]).join("; ");

    // 4. Create Videos in Kitchen A
    const v1 = await testDb.cookingVideo.create({
      data: {
        kitchenId: kitchenAId,
        uploadedById: userAId,
        originalFilename: "tuwo_cooking.mp4",
        storageKey: "kitchens/a/videos/tuwo.mp4",
        contentType: "video/mp4",
        expectedSize: 10485760,
        actualSize: 10485760,
        duration: 217.65,
        uploadStatus: "UPLOADED",
        validationStatus: "VALIDATED",
        processingStatus: "COMPLETED",
        uploadExpiresAt: new Date(Date.now() + 86400000),
      },
    });
    videoWithAnalysisId = v1.id;

    const v2 = await testDb.cookingVideo.create({
      data: {
        kitchenId: kitchenAId,
        uploadedById: userAId,
        originalFilename: "unprocessed.mp4",
        storageKey: "kitchens/a/videos/unproc.mp4",
        contentType: "video/mp4",
        expectedSize: 5242880,
        actualSize: 5242880,
        duration: 60.0,
        uploadStatus: "UPLOADED",
        validationStatus: "VALIDATED",
        processingStatus: "NOT_STARTED",
        uploadExpiresAt: new Date(Date.now() + 86400000),
      },
    });
    videoWithoutAnalysisId = v2.id;

    // 5. Seed completed AI analysis for v1
    const mockAiOutput: AIAnalysisResponseData = {
      schema_version: "1.0.0",
      whisper_model: "small",
      vision_model: "gemma4:e4b-it-qat",
      video_duration: 217.65,
      speech_status: "NO_USABLE_SPEECH",
      detected_language: "yo",
      audio: {
        status: "NO_USABLE_SPEECH",
        language: "yo",
        segments: [],
        notes: "No intelligible narration detected",
      },
      vision: {
        total_frames_extracted: 4,
        total_frames_analyzed: 4,
        sampling_interval_seconds: 10.0,
        sampling_strategy: "uniform_full_coverage",
        sampled_time_range: [0.0, 216.65],
        coverage_ratio: 0.995,
        observations: [
          {
            frame_id: "frame_001.jpg",
            timestamp_seconds: 0.0,
            visible_action: "Pan on heat",
            food_appearance: "White powder in water",
            visible_objects: ["pan", "wooden spoon"],
            uncertain_details: ["Ingredients unknown"],
          },
        ],
      },
      timeline: {
        status: "needs_human_review",
        source_type: "visual_only",
        events: [
          {
            position: 0,
            title: "Initial Preparation of White Mixture",
            description: "A person appears to mix a white powder into liquid inside a cooking pan.",
            evidence_frames: ["frame_001.jpg"],
            evidence_transcripts: [],
            observed_timestamps: [0.0, 10.0],
            uncertainties: ["Exact flour type unknown", "Ratio unmeasured"],
            question_for_cook: "What type of flour is being mixed here?",
            verified: false,
          },
          {
            position: 1,
            title: "Vigorous Stirring of Thickening Paste",
            description: "Cook uses a wooden paddle to stir the opaque white mass as it thickens.",
            evidence_frames: ["frame_002.jpg"],
            evidence_transcripts: [],
            observed_timestamps: [72.38],
            uncertainties: ["Temperature setting unknown"],
            question_for_cook: "How do you know when it reaches the right firmness?",
            verified: false,
          },
        ],
      },
    };

    await persistAIAnalysisResult({
      videoId: videoWithAnalysisId,
      data: mockAiOutput,
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
    await closeSharedRedis();
    await closeQueues();
  });

  // 1. Creating review from completed analysis
  it("should initialize a CookingReview with unreviewed events and unanswered clarifications from AI output", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/videos/${videoWithAnalysisId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
      }
    );

    const res = await initReviewHandler(req, {
      params: Promise.resolve({ id: videoWithAnalysisId }),
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.review).toBeDefined();
    expect(data.review.status).toBe("IN_PROGRESS");
    expect(data.review.events).toHaveLength(2);
    expect(data.review.events[0].status).toBe("UNREVIEWED");
    expect(data.review.events[0].originalAiTitle).toBe("Initial Preparation of White Mixture");
    expect(data.review.clarifications).toHaveLength(2);
    expect(data.review.clarifications[0].status).toBe("UNANSWERED");
    expect(data.review.analysis.samplingStrategy).toBe("uniform_full_coverage");
  });

  // 2. Rejecting review creation from incomplete analysis
  it("should reject review initialization if video does not have completed AI analysis", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/videos/${videoWithoutAnalysisId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
      }
    );

    const res = await initReviewHandler(req, {
      params: Promise.resolve({ id: videoWithoutAnalysisId }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/No completed AI analysis found/i);
  });

  // 3 & 4. Accepting and Editing an AI event
  it("should allow reviewer to accept and edit candidate cooking events while preserving original AI text", async () => {
    // First get review
    const getReq = new NextRequest(
      `http://localhost:3000/api/videos/${videoWithAnalysisId}/review`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          Cookie: userACookie,
        },
      }
    );
    const getRes = await getReviewHandler(getReq, {
      params: Promise.resolve({ id: videoWithAnalysisId }),
    });
    const reviewData = await getRes.json();
    const event0 = reviewData.review.events[0];
    const event1 = reviewData.review.events[1];

    // Accept Event 0
    const acceptReq = new NextRequest(
      `http://localhost:3000/api/reviews/${reviewData.review.id}/events/${event0.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          status: "ACCEPTED",
        }),
      }
    );
    const acceptRes = await patchEventHandler(acceptReq, {
      params: Promise.resolve({ reviewId: reviewData.review.id, eventId: event0.id }),
    });
    expect(acceptRes.status).toBe(200);
    const acceptData = await acceptRes.json();
    expect(acceptData.event.status).toBe("ACCEPTED");

    // Edit Event 1 (Correct title and description, add sensory cue)
    const editReq = new NextRequest(
      `http://localhost:3000/api/reviews/${reviewData.review.id}/events/${event1.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          title: "Vigorous Turning with Omorogun",
          description: "Vigorously turn the Tuwo paste using a traditional wooden paddle to prevent lumps.",
          sensoryCue: "The paste pulls completely away from the pot wall and develops a glossy sheen.",
          status: "EDITED",
        }),
      }
    );
    const editRes = await patchEventHandler(editReq, {
      params: Promise.resolve({ reviewId: reviewData.review.id, eventId: event1.id }),
    });
    expect(editRes.status).toBe(200);
    const editData = await editRes.json();
    expect(editData.event.title).toBe("Vigorous Turning with Omorogun");
    expect(editData.event.sensoryCue).toContain("glossy sheen");
    expect(editData.event.status).toBe("EDITED");
    // Verify AI provenance was NOT destroyed
    expect(editData.event.originalAiTitle).toBe("Vigorous Stirring of Thickening Paste");
  });

  // 5. Rejecting an event safely (preserving audit trail)
  it("should mark rejected AI events as REJECTED without permanently deleting the audit trail", async () => {
    const getReq = new NextRequest(
      `http://localhost:3000/api/videos/${videoWithAnalysisId}/review`,
      {
        method: "GET",
        headers: { host: "localhost:3000", Cookie: userACookie },
      }
    );
    const getRes = await getReviewHandler(getReq, {
      params: Promise.resolve({ id: videoWithAnalysisId }),
    });
    const { review } = await getRes.json();
    const event = review.events[0];

    const delReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/events/${event.id}`,
      {
        method: "DELETE",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
      }
    );
    const delRes = await deleteEventHandler(delReq, {
      params: Promise.resolve({ reviewId: review.id, eventId: event.id }),
    });
    expect(delRes.status).toBe(200);

    const recheck = await testDb.reviewedCookingEvent.findUnique({
      where: { id: event.id },
    });
    expect(recheck).not.toBeNull();
    expect(recheck?.status).toBe("REJECTED");
  });

  // 6. Adding a human-authored cooking event
  it("should allow reviewer to add a missing cooking action seen in footage", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    const addReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          title: "Steaming the Tuwo under cover",
          description: "Cover the pot tightly and let the mixture steam on low heat for 5 minutes.",
          startTimestamp: 120.0,
          endTimestamp: 150.0,
          sensoryCue: "A sweet roasted grain aroma begins to rise from the edges.",
        }),
      }
    );

    const addRes = await addEventHandler(addReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(addRes.status).toBe(201);
    const addData = await addRes.json();
    expect(addData.event.title).toBe("Steaming the Tuwo under cover");
    expect(addData.event.sourceProposedEventId).toBeNull();
    expect(addData.event.status).toBe("EDITED");
  });

  // 7. Rejecting out-of-range timestamps
  it("should reject out-of-range timestamps exceeding video duration", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();
    const event = review.events[0];

    const patchReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/events/${event.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          startTimestamp: 10.0,
          endTimestamp: 5000.0, // Far exceeds 217.65s video duration
        }),
      }
    );
    const patchRes = await patchEventHandler(patchReq, {
      params: Promise.resolve({ reviewId: review.id, eventId: event.id }),
    });
    expect(patchRes.status).toBe(400);
    const data = await patchRes.json();
    expect(data.error).toMatch(/exceeds video duration/i);
  });

  // 8. Clarification Q&A persistence
  it("should record natural language answers to clarification questions", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();
    const clar = review.clarifications[0];

    const ansReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/clarifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          clarificationId: clar.id,
          answer: "Finely ground white corn flour sifted twice.",
          status: "ANSWERED",
        }),
      }
    );

    const ansRes = await clarificationHandler(ansReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(ansRes.status).toBe(200);
    const ansData = await ansRes.json();
    expect(ansData.clarification.status).toBe("ANSWERED");
    expect(ansData.clarification.answer).toBe("Finely ground white corn flour sifted twice.");
  });

  // 9. Traditional qualitative ingredient measurements
  it("should save traditional qualitative ingredient measurements without forced numeric conversions", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    const ingReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/ingredients`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          name: "Sifted White Corn Flour",
          quantity: "2 handfuls (about half a calabash)",
          notes: "Do not pack tightly; add gradually",
          provenance: "HUMAN_CONFIRMED",
        }),
      }
    );

    const ingRes = await ingredientHandler(ingReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(ingRes.status).toBe(200);
    const ingData = await ingRes.json();
    expect(ingData.ingredient.quantity).toBe("2 handfuls (about half a calabash)");
    expect(ingData.ingredient.provenance).toBe("HUMAN_CONFIRMED");
  });

  // 10. Optimistic concurrency conflict handling
  it("should return 409 Conflict when expectedVersion does not match review version", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    const patchReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          notes: "Concurrent note",
          expectedVersion: review.version + 999, // Stale version
        }),
      }
    );

    const patchRes = await patchReviewHandler(patchReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(patchRes.status).toBe(409);
    const data = await patchRes.json();
    expect(data.error).toMatch(/Conflict/i);
  });

  // 11. Completion validation requires all events to be reviewed
  it("should fail review completion if any event remains UNREVIEWED", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    // Reset an event to UNREVIEWED
    await testDb.reviewedCookingEvent.update({
      where: { id: review.events[0].id },
      data: { status: "UNREVIEWED" },
    });

    const completeReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/complete`,
      {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
      }
    );
    const completeRes = await completeReviewHandler(completeReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(completeRes.status).toBe(400);
    const data = await completeRes.json();
    expect(data.error).toMatch(/have not been reviewed yet/i);
  });

  // 12. Recipe conversion with evidence grounding & verification semantics
  it("should convert reviewed events into Recipe, RecipeStep, and RecipeEvidence without automatic cook verification", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    // Set all events to ACCEPTED or EDITED (except one REJECTED to verify exclusion)
    await testDb.reviewedCookingEvent.update({
      where: { id: review.events[0].id },
      data: { status: "ACCEPTED" },
    });

    // Make sure cookVerified is false to test that it is NOT automatically verified
    await testDb.cookingReview.update({
      where: { id: review.id },
      data: { cookVerified: false },
    });

    const convReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/recipe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          mode: "CREATE_NEW",
          title: "Authentic Family Tuwo Shinkafa",
          cookName: "Mama Amina",
        }),
      }
    );

    const convRes = await convertRecipeHandler(convReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(convRes.status).toBe(201);
    const convData = await convRes.json();

    expect(convData.recipe.title).toBe("Authentic Family Tuwo Shinkafa");
    // Crucial requirement: No automatic VERIFIED_BY_COOK status unless attested!
    expect(convData.recipe.status).toBe("REVIEW_PENDING");
    expect(convData.recipe.cookVerified).toBe(false);
    expect(convData.recipe.steps.length).toBeGreaterThan(0);
    // Verify RecipeEvidence links
    expect(convData.recipe.steps[0].evidence).toBeDefined();
    expect(convData.recipe.steps[0].evidence.length).toBeGreaterThan(0);
    expect(convData.recipe.steps[0].evidence[0].videoId).toBe(videoWithAnalysisId);
  });

  // 13. Viewer cannot mutate reviews
  it("should forbid kitchen viewers from modifying reviews or events", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    const patchReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}/events/${review.events[0].id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userBCookie, // User B is VIEWER
        },
        body: JSON.stringify({ title: "Hacked by Viewer" }),
      }
    );

    const patchRes = await patchEventHandler(patchReq, {
      params: Promise.resolve({ reviewId: review.id, eventId: review.events[0].id }),
    });
    expect(patchRes.status).toBe(403);
  });

  // 14. Cross-kitchen isolation
  it("should prevent non-members from accessing or modifying another family's review", async () => {
    const getRes = await getReviewHandler(
      new NextRequest(`http://localhost:3000/api/videos/${videoWithAnalysisId}/review`, {
        headers: { host: "localhost:3000", Cookie: userACookie },
      }),
      { params: Promise.resolve({ id: videoWithAnalysisId }) }
    );
    const { review } = await getRes.json();

    const strangerReq = new NextRequest(
      `http://localhost:3000/api/reviews/${review.id}`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          Cookie: userCCookie, // User C is stranger
        },
      }
    );

    const strangerRes = await getReviewByIdHandler(strangerReq, {
      params: Promise.resolve({ reviewId: review.id }),
    });
    expect(strangerRes.status).toBe(403);
  });
});
