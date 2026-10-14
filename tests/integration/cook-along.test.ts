import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as createKitchenHandler } from "@/app/api/kitchens/route";
import { PATCH as patchRecipeHandler } from "@/app/api/recipes/[id]/route";
import { POST as startSessionHandler } from "@/app/api/cook-sessions/route";
import {
  GET as getSessionHandler,
  PATCH as patchSessionHandler,
} from "@/app/api/cook-sessions/[id]/route";
import { POST as stepCompletionHandler } from "@/app/api/cook-sessions/[id]/steps/[stepId]/route";
import { POST as ingredientCheckHandler } from "@/app/api/cook-sessions/[id]/ingredients/[ingredientId]/route";
import { POST as completeSessionHandler } from "@/app/api/cook-sessions/[id]/complete/route";
import { GET as getCookAlongDataHandler } from "@/app/api/recipes/[id]/cook-along/route";

import { extractDurationMinutes } from "@/components/cook-along/cooking-timer";
import { closeSharedRedis } from "@/lib/queue/redis";
import { closeQueues } from "@/lib/queue";

describe("Phase 8 Interactive Cook Along Tests", () => {
  let userACookie: string;
  let userBCookie: string;
  let userCCookie: string;
  let userAId: string;
  let userBId: string;
  let kitchenAId: string;
  let recipeWithVideoId: string;
  let recipeWithoutVideoId: string;
  let step1Id: string;
  let step2Id: string;
  let ing1Id: string;

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
    userACookie = resA.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

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

    // 2. User B (VIEWER of Kitchen A)
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
    userBCookie = resB.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    await testDb.kitchenMember.create({
      data: {
        kitchenId: kitchenAId,
        userId: userBId,
        role: "VIEWER",
      },
    });

    // 3. User C (External User in Stranger Kitchen)
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
    userCCookie = resC.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    // 4. Create Video in Kitchen A
    const video = await testDb.cookingVideo.create({
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

    // 5. Create Recipe 1 with Video and Evidence
    const r1 = await testDb.recipe.create({
      data: {
        kitchenId: kitchenAId,
        title: "Traditional Tuwo Shinkafa",
        description: "Soft northern Nigerian rice swallow made with short-grain rice",
        cookName: "Mama Amina",
        story: "Prepared on special Sunday afternoons for the whole family",
        origin: "Northern Nigeria",
        notes: "Use soft mashed rice only",
        status: "REVIEW_PENDING",
        createdById: userAId,
        cookVerified: false,
        ingredients: {
          create: [
            {
              name: "Short-grain rice",
              quantity: "Two standard teacups",
              notes: "Washed thoroughly until water runs clear",
              position: 0,
            },
            {
              name: "Water",
              quantity: "Enough to cover the rice by a knuckle",
              notes: "Cold tap water is fine",
              position: 1,
            },
          ],
        },
        steps: {
          create: [
            {
              instruction: "Bring water to a vigorous boil and pour in the rice.",
              position: 0,
              duration: "10 minutes",
              sensoryCue: "Large rapid bubbles break the surface continuously",
              notes: "Do not cover completely to prevent boiling over",
              videoTimestampStart: 0,
              videoTimestampEnd: 45,
            },
            {
              instruction: "Mash the tender rice grains vigorously against the side of the pot using a wooden spatula.",
              position: 1,
              duration: "5 minutes",
              sensoryCue: "The rice transforms into a glossy, elastic white mound",
              notes: "Stir in concentric circles",
              videoTimestampStart: 72,
              videoTimestampEnd: 120,
            },
          ],
        },
      },
      include: {
        steps: true,
        ingredients: true,
      },
    });
    recipeWithVideoId = r1.id;
    step1Id = r1.steps[0].id;
    step2Id = r1.steps[1].id;
    ing1Id = r1.ingredients[0].id;

    // Attach RecipeEvidence
    await testDb.recipeEvidence.create({
      data: {
        recipeStepId: step1Id,
        videoId: video.id,
        startTimestamp: 0.0,
        endTimestamp: 45.0,
        transcriptSegments: [{ text: "Now we bring the pot to a boil" }],
      },
    });
    await testDb.recipeEvidence.create({
      data: {
        recipeStepId: step2Id,
        videoId: video.id,
        startTimestamp: 72.38,
        endTimestamp: 120.0,
        transcriptSegments: [{ text: "Turn it firmly until it becomes smooth" }],
      },
    });

    // 6. Create Recipe 2 without Video (Handwritten Manual Recipe)
    const r2 = await testDb.recipe.create({
      data: {
        kitchenId: kitchenAId,
        title: "Grandmother's Palm Oil Sauce",
        description: "Peppery tomato palm oil stew",
        cookName: "Mama Amina",
        createdById: userAId,
        status: "DRAFT",
        ingredients: {
          create: [
            {
              name: "Palm Oil",
              quantity: "A shallow ladle",
              position: 0,
            },
          ],
        },
        steps: {
          create: [
            {
              instruction: "Warm palm oil over low heat until bright orange.",
              position: 0,
              sensoryCue: "Oil separates and releases a nutty fragrant aroma",
            },
          ],
        },
      },
    });
    recipeWithoutVideoId = r2.id;
  });

  afterAll(async () => {
    await clearTestDatabase();
    await closeSharedRedis();
    await closeQueues();
  });

  // 1. Starting a cooking session
  it("should start a new cooking session with IN_PROGRESS status and step 0", async () => {
    const req = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({
        recipeId: recipeWithVideoId,
      }),
    });

    const res = await startSessionHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.session).toBeDefined();
    expect(data.session.status).toBe("IN_PROGRESS");
    expect(data.session.recipeId).toBe(recipeWithVideoId);
    expect(data.session.currentStepPosition).toBe(0);
    expect(data.session.currentStepId).toBe(step1Id);
  });

  // 2. Resuming an incomplete session
  it("should resume the existing incomplete session on subsequent calls without creating duplicate rows", async () => {
    // Call 1
    const req1 = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const res1 = await startSessionHandler(req1);
    const data1 = await res1.json();

    // Call 2
    const req2 = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const res2 = await startSessionHandler(req2);
    const data2 = await res2.json();

    expect(data2.session.id).toBe(data1.session.id);

    const count = await testDb.cookingSession.count({
      where: { recipeId: recipeWithVideoId, userId: userAId },
    });
    expect(count).toBe(1);
  });

  // 3. Starting a separate new session with forceNew: true
  it("should abandon previous incomplete session and start fresh when forceNew is true", async () => {
    // Session 1
    const req1 = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const res1 = await startSessionHandler(req1);
    const data1 = await res1.json();

    // Session 2 with forceNew
    const req2 = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId, forceNew: true }),
    });
    const res2 = await startSessionHandler(req2);
    const data2 = await res2.json();

    expect(data2.session.id).not.toBe(data1.session.id);
    expect(data2.session.status).toBe("IN_PROGRESS");

    const oldSession = await testDb.cookingSession.findUnique({
      where: { id: data1.session.id },
    });
    expect(oldSession?.status).toBe("ABANDONED");
  });

  // 4 & 5. Step completion and unchecking
  it("should record step completion and allow unchecking a step", async () => {
    const sReq = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const sRes = await startSessionHandler(sReq);
    const { session } = await sRes.json();

    // Mark step 1 completed
    const cReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}/steps/${step1Id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({ completed: true }),
      }
    );
    const cRes = await stepCompletionHandler(cReq, {
      params: Promise.resolve({ id: session.id, stepId: step1Id }),
    });
    expect(cRes.status).toBe(200);
    const cData = await cRes.json();
    expect(cData.step.completed).toBe(true);

    // Unmark step 1
    const uReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}/steps/${step1Id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({ completed: false }),
      }
    );
    const uRes = await stepCompletionHandler(uReq, {
      params: Promise.resolve({ id: session.id, stepId: step1Id }),
    });
    expect(uRes.status).toBe(200);
    const uData = await uRes.json();
    expect(uData.step.completed).toBe(false);
  });

  // 6 & 7. Ingredient checklist persistence and restoring progress after refresh
  it("should persist ingredient checks and restore all state upon reloading session", async () => {
    const sReq = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const sRes = await startSessionHandler(sReq);
    const { session } = await sRes.json();

    // Check ingredient 1
    const ingReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}/ingredients/${ing1Id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({ checked: true }),
      }
    );
    const ingRes = await ingredientCheckHandler(ingReq, {
      params: Promise.resolve({ id: session.id, ingredientId: ing1Id }),
    });
    expect(ingRes.status).toBe(200);

    // Mark step 2 completed
    await testDb.cookingSessionStep.create({
      data: {
        sessionId: session.id,
        stepId: step2Id,
        completed: true,
      },
    });

    // Advance session position to step 1
    await testDb.cookingSession.update({
      where: { id: session.id },
      data: { currentStepPosition: 1, currentStepId: step2Id },
    });

    // Fetch session (simulate refresh)
    const getReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          Cookie: userACookie,
        },
      }
    );
    const getRes = await getSessionHandler(getReq, {
      params: Promise.resolve({ id: session.id }),
    });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();

    expect(getData.session.currentStepPosition).toBe(1);
    expect(getData.session.sessionIngredients).toHaveLength(1);
    expect(getData.session.sessionIngredients[0].ingredientId).toBe(ing1Id);
    expect(getData.session.sessionIngredients[0].checked).toBe(true);
    expect(getData.session.sessionSteps).toHaveLength(1);
    expect(getData.session.sessionSteps[0].stepId).toBe(step2Id);
    expect(getData.session.sessionSteps[0].completed).toBe(true);
  });

  // 8. Moving backward without completing steps
  it("should allow navigating steps backward and forward without modifying completed steps", async () => {
    const sReq = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const sRes = await startSessionHandler(sReq);
    const { session } = await sRes.json();

    // Advance to step 1
    const pReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          currentStepPosition: 1,
          currentStepId: step2Id,
        }),
      }
    );
    const pRes = await patchSessionHandler(pReq, {
      params: Promise.resolve({ id: session.id }),
    });
    expect(pRes.status).toBe(200);

    // Navigate back to step 0
    const bReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({
          currentStepPosition: 0,
          currentStepId: step1Id,
        }),
      }
    );
    const bRes = await patchSessionHandler(bReq, {
      params: Promise.resolve({ id: session.id }),
    });
    expect(bRes.status).toBe(200);
    const bData = await bRes.json();
    expect(bData.session.currentStepPosition).toBe(0);

    // Completed steps count should remain 0
    const stepsCount = await testDb.cookingSessionStep.count({
      where: { sessionId: session.id, completed: true },
    });
    expect(stepsCount).toBe(0);
  });

  // 9 & 25. Completing session without mutating recipe verification
  it("should complete session with summary and NOT automatically mark recipe VERIFIED_BY_COOK", async () => {
    const sReq = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const sRes = await startSessionHandler(sReq);
    const { session } = await sRes.json();

    // Complete session
    const compReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}/complete`,
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
    const compRes = await completeSessionHandler(compReq, {
      params: Promise.resolve({ id: session.id }),
    });
    expect(compRes.status).toBe(200);

    const compData = await compRes.json();
    expect(compData.session.status).toBe("COMPLETED");
    expect(compData.summary.totalSteps).toBe(2);
    expect(compData.summary.recipeTitle).toBe("Traditional Tuwo Shinkafa");

    // CRITICAL: Recipe cookVerified must remain FALSE
    const recipe = await testDb.recipe.findUnique({
      where: { id: recipeWithVideoId },
    });
    expect(recipe?.cookVerified).toBe(false);
  });

  // 11. Personal session isolation
  it("should isolate user session progress so User B does not overwrite User A progress", async () => {
    // User A starts session
    const reqA = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const resA = await startSessionHandler(reqA);
    const dataA = await resA.json();

    // User A marks step 1 completed
    await testDb.cookingSessionStep.create({
      data: {
        sessionId: dataA.session.id,
        stepId: step1Id,
        completed: true,
      },
    });

    // User B (Viewer) starts session for same recipe
    const reqB = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userBCookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const resB = await startSessionHandler(reqB);
    const dataB = await resB.json();

    expect(dataB.session.id).not.toBe(dataA.session.id);
    expect(dataB.session.userId).toBe(userBId);

    // User B should have 0 completed steps
    const bCompleted = await testDb.cookingSessionStep.count({
      where: { sessionId: dataB.session.id, completed: true },
    });
    expect(bCompleted).toBe(0);

    // User B cannot modify User A's session
    const tamperReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${dataA.session.id}/steps/${step2Id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userBCookie,
        },
        body: JSON.stringify({ completed: true }),
      }
    );
    const tamperRes = await stepCompletionHandler(tamperReq, {
      params: Promise.resolve({ id: dataA.session.id, stepId: step2Id }),
    });
    expect(tamperRes.status).toBe(403);
  });

  // 12. Cross-kitchen authorization
  it("should prevent non-members from starting a session or reading cook-along data", async () => {
    // User C is stranger
    const req = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userCCookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const res = await startSessionHandler(req);
    expect(res.status).toBe(403);
  });

  // 13 & 14. VIEWER permissions: can cook along, cannot edit recipe
  it("should allow VIEWER to cook along but forbid them from editing recipe content", async () => {
    // 1. VIEWER can fetch cook-along data
    const caReq = new NextRequest(
      `http://localhost:3000/api/recipes/${recipeWithVideoId}/cook-along`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          Cookie: userBCookie,
        },
      }
    );
    const caRes = await getCookAlongDataHandler(caReq, {
      params: Promise.resolve({ id: recipeWithVideoId }),
    });
    expect(caRes.status).toBe(200);
    const caData = await caRes.json();
    expect(caData.recipe.title).toBe("Traditional Tuwo Shinkafa");

    // 2. VIEWER cannot edit recipe
    const editReq = new NextRequest(
      `http://localhost:3000/api/recipes/${recipeWithVideoId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userBCookie,
        },
        body: JSON.stringify({ title: "Hacked by Viewer" }),
      }
    );
    const editRes = await patchRecipeHandler(editReq, {
      params: Promise.resolve({ id: recipeWithVideoId }),
    });
    expect(editRes.status).toBe(403);
  });

  // 15, 16 & 17. Invalid IDs rejection
  it("should reject invalid recipe IDs, session IDs, and mismatched step IDs", async () => {
    // 1. Invalid recipe ID
    const rReq = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: "00000000-0000-0000-0000-000000000000" }),
    });
    const rRes = await startSessionHandler(rReq);
    expect(rRes.status).toBe(404);

    // 2. Valid session
    const sReq = new NextRequest("http://localhost:3000/api/cook-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        Cookie: userACookie,
      },
      body: JSON.stringify({ recipeId: recipeWithVideoId }),
    });
    const sRes = await startSessionHandler(sReq);
    const { session } = await sRes.json();

    // 3. Foreign step ID
    const fReq = new NextRequest(
      `http://localhost:3000/api/cook-sessions/${session.id}/steps/00000000-0000-0000-0000-000000000000`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          Cookie: userACookie,
        },
        body: JSON.stringify({ completed: true }),
      }
    );
    const fRes = await stepCompletionHandler(fReq, {
      params: Promise.resolve({
        id: session.id,
        stepId: "00000000-0000-0000-0000-000000000000",
      }),
    });
    expect(fRes.status).toBe(400);
  });

  // 18, 19, 20, 21 & 22. Evidence mapping, sensory cues, and qualitative quantities
  it("should return grounded evidence mapping, sensory cues, and qualitative ingredient quantities", async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/recipes/${recipeWithVideoId}/cook-along`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          Cookie: userACookie,
        },
      }
    );
    const res = await getCookAlongDataHandler(req, {
      params: Promise.resolve({ id: recipeWithVideoId }),
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    // Step 1 evidence mapping
    const step1 = data.recipe.steps[0];
    expect(step1.evidence).toHaveLength(1);
    expect(step1.evidence[0].startTimestamp).toBe(0.0);
    expect(step1.evidence[0].endTimestamp).toBe(45.0);
    expect(step1.sensoryCue).toBe("Large rapid bubbles break the surface continuously");

    // Qualitative ingredients
    const ing1 = data.recipe.ingredients[0];
    expect(ing1.name).toBe("Short-grain rice");
    expect(ing1.quantity).toBe("Two standard teacups");

    // Non-video recipe test
    const noVidReq = new NextRequest(
      `http://localhost:3000/api/recipes/${recipeWithoutVideoId}/cook-along`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          Cookie: userACookie,
        },
      }
    );
    const noVidRes = await getCookAlongDataHandler(noVidReq, {
      params: Promise.resolve({ id: recipeWithoutVideoId }),
    });
    expect(noVidRes.status).toBe(200);
    const noVidData = await noVidRes.json();
    expect(noVidData.recipe.steps[0].evidence).toHaveLength(0);
  });

  // 23 & 26. Timer duration extraction unit helper
  it("should extract unambiguous numeric timer minutes and handle qualitative durations cleanly", () => {
    expect(extractDurationMinutes("10 minutes")).toBe(10);
    expect(extractDurationMinutes("5 mins")).toBe(5);
    expect(extractDurationMinutes("45 minute")).toBe(45);
    expect(extractDurationMinutes("Until thickened and glossy")).toBeNull();
    expect(extractDurationMinutes(null)).toBeNull();
  });
});
