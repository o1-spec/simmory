import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as createKitchenHandler } from "@/app/api/kitchens/route";
import { POST as createRecipeHandler } from "@/app/api/recipes/route";
import { POST as initiateUploadHandler } from "@/app/api/videos/initiate/route";
import { POST as completeUploadHandler } from "@/app/api/videos/[id]/complete/route";
import { GET as getPlaybackHandler } from "@/app/api/videos/[id]/playback/route";
import {
  GET as getVideoHandler,
  DELETE as deleteVideoHandler,
} from "@/app/api/videos/[id]/route";
import { GET as listVideosHandler } from "@/app/api/videos/route";
import * as storageModule from "@/lib/storage/r2";

describe("Cooking Videos & Media Ingestion Integration Tests", () => {
  let userACookie: string;
  let userBCookie: string;
  let userCCookie: string;
  let kitchenAId: string;
  let kitchenBId: string;
  let recipeAId: string;

  beforeEach(async () => {
    await clearTestDatabase();

    // 1. Register User A (Chef Rosa)
    const regReqA = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Chef Rosa",
        email: "rosa@family.com",
        password: "RosaPassword2026!",
        confirmPassword: "RosaPassword2026!",
      }),
    });
    const regResA = await registerHandler(regReqA);
    expect(regResA.status).toBe(201);
    userACookie = regResA.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    // 2. Register User B (Family Viewer)
    const regReqB = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Viewer Bob",
        email: "bob@family.com",
        password: "BobPassword2026!",
        confirmPassword: "BobPassword2026!",
      }),
    });
    const regResB = await registerHandler(regReqB);
    expect(regResB.status).toBe(201);
    userBCookie = regResB.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    // 3. Register User C (Unrelated Stranger)
    const regReqC = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Stranger Dave",
        email: "dave@stranger.com",
        password: "DavePassword2026!",
        confirmPassword: "DavePassword2026!",
      }),
    });
    const regResC = await registerHandler(regReqC);
    expect(regResC.status).toBe(201);
    userCCookie = regResC.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    // 4. Create Kitchen A for Chef Rosa
    const kResA = await createKitchenHandler(
      new NextRequest("http://localhost:3000/api/kitchens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: userACookie,
        },
        body: JSON.stringify({
          name: "Rosa's Catalan Hearth",
          description: "Generational recipes from Barcelona",
        }),
      })
    );
    const kDataA = await kResA.json();
    kitchenAId = kDataA.kitchen.id;

    // 5. Create Kitchen B for Stranger Dave
    const kResB = await createKitchenHandler(
      new NextRequest("http://localhost:3000/api/kitchens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: userCCookie,
        },
        body: JSON.stringify({
          name: "Dave's Diner",
          description: "Private test kitchen",
        }),
      })
    );
    const kDataB = await kResB.json();
    kitchenBId = kDataB.kitchen.id;

    // 6. Add Viewer Bob to Kitchen A with role VIEWER
    const userBRecord = await testDb.user.findUnique({
      where: { email: "bob@family.com" },
    });
    await testDb.kitchenMember.create({
      data: {
        kitchenId: kitchenAId,
        userId: userBRecord!.id,
        role: "VIEWER",
      },
    });

    // 7. Create Recipe in Kitchen A
    const rResA = await createRecipeHandler(
      new NextRequest("http://localhost:3000/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: userACookie,
        },
        body: JSON.stringify({
          kitchenId: kitchenAId,
          title: "Traditional Romesco Sauce",
          cookName: "Rosa",
          ingredients: [{ name: "Nora Peppers", quantity: "4 dried" }],
          steps: [{ instruction: "Rehydrate peppers in boiling water" }],
        }),
      })
    );
    const rDataA = await rResA.json();
    recipeAId = rDataA.recipe.id;
  });

  afterAll(async () => {
    await testDb.$disconnect();
    vi.restoreAllMocks();
  });

  it("should return HTTP 503 when storage is not configured", async () => {
    // Force isStorageConfigured to return false
    vi.spyOn(storageModule, "isStorageConfigured").mockReturnValue(false);

    const initReq = new NextRequest("http://localhost:3000/api/videos/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: userACookie,
      },
      body: JSON.stringify({
        kitchenId: kitchenAId,
        originalFilename: "romesco_peppers.mp4",
        contentType: "video/mp4",
        fileSize: 10 * 1024 * 1024,
      }),
    });

    const initRes = await initiateUploadHandler(initReq);
    expect(initRes.status).toBe(503);
    const errData = await initRes.json();
    expect(errData.error).toBe("Storage not configured");
  });

  describe("With Storage Mock Enabled", () => {
    beforeEach(() => {
      vi.spyOn(storageModule, "isStorageConfigured").mockReturnValue(true);
      vi.spyOn(storageModule, "generatePresignedUploadUrl").mockResolvedValue({
        uploadUrl: "https://r2.mock.cloudflarestorage.com/upload-presigned-url",
        storageKey: "kitchens/mock/videos/test.mp4",
        expiresInSeconds: 300,
      });
      vi.spyOn(storageModule, "verifyObjectExists").mockResolvedValue({
        exists: true,
        contentLength: 10 * 1024 * 1024,
        contentType: "video/mp4",
      });
      vi.spyOn(storageModule, "generatePresignedPlaybackUrl").mockResolvedValue({
        playbackUrl: "https://r2.mock.cloudflarestorage.com/playback-signed-url",
        expiresInSeconds: 900,
      });
      vi.spyOn(storageModule, "deleteStorageObject").mockResolvedValue({
        success: true,
      });
    });

    it("should allow owner to initiate upload and create PENDING_UPLOAD in DB", async () => {
      const initReq = new NextRequest(
        "http://localhost:3000/api/videos/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
          body: JSON.stringify({
            kitchenId: kitchenAId,
            recipeId: recipeAId,
            originalFilename: "romesco_making.mp4",
            contentType: "video/mp4",
            fileSize: 10 * 1024 * 1024,
          }),
        }
      );

      const initRes = await initiateUploadHandler(initReq);
      expect(initRes.status).toBe(201);
      const data = await initRes.json();

      expect(data.video.id).toBeDefined();
      expect(data.video.uploadStatus).toBe("PENDING_UPLOAD");
      expect(data.video.processingStatus).toBe("NOT_STARTED");
      expect(data.video.kitchenId).toBe(kitchenAId);
      expect(data.video.recipeId).toBe(recipeAId);
      expect(data.uploadUrl).toContain("https://r2.mock.cloudflarestorage.com");

      // Verify DB record exists
      const dbVideo = await testDb.cookingVideo.findUnique({
        where: { id: data.video.id },
      });
      expect(dbVideo).not.toBeNull();
      expect(dbVideo?.uploadStatus).toBe("PENDING_UPLOAD");
    });

    it("should reject upload initiation from a viewer role (mutations forbidden)", async () => {
      const initReq = new NextRequest(
        "http://localhost:3000/api/videos/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userBCookie, // Viewer Bob
          },
          body: JSON.stringify({
            kitchenId: kitchenAId,
            originalFilename: "viewer_attempt.mp4",
            contentType: "video/mp4",
            fileSize: 5 * 1024 * 1024,
          }),
        }
      );

      const initRes = await initiateUploadHandler(initReq);
      expect(initRes.status).toBe(403);
    });

    it("should reject cross-kitchen recipe associations", async () => {
      // User A attempts to link a video in Kitchen A to a recipe in Kitchen B
      const recipeB = await testDb.recipe.create({
        data: {
          kitchenId: kitchenBId,
          title: "Dave's Secret Burger",
          cookName: "Dave",
          createdById: (await testDb.user.findUnique({ where: { email: "dave@stranger.com" } }))!.id,
        },
      });

      const initReq = new NextRequest(
        "http://localhost:3000/api/videos/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
          body: JSON.stringify({
            kitchenId: kitchenAId,
            recipeId: recipeB.id,
            originalFilename: "mismatch_attempt.mp4",
            contentType: "video/mp4",
            fileSize: 5 * 1024 * 1024,
          }),
        }
      );

      const initRes = await initiateUploadHandler(initReq);
      expect(initRes.status).toBe(400);
      const err = await initRes.json();
      expect(err.error).toContain("does not belong to this family kitchen");
    });

    it("should complete upload after verifying object in storage and remain idempotent", async () => {
      // 1. Initiate upload
      const initReq = new NextRequest(
        "http://localhost:3000/api/videos/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
          body: JSON.stringify({
            kitchenId: kitchenAId,
            originalFilename: "garlic_roasting.mp4",
            contentType: "video/mp4",
            fileSize: 10 * 1024 * 1024,
          }),
        }
      );
      const initRes = await initiateUploadHandler(initReq);
      const { video } = await initRes.json();

      // 2. Call complete upload
      const compReq = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const compRes = await completeUploadHandler(compReq, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(compRes.status).toBe(200);
      const compData = await compRes.json();
      expect(compData.video.uploadStatus).toBe("UPLOADED");
      expect(compData.video.actualSize).toBe(10 * 1024 * 1024);
      expect(compData.video.completedAt).not.toBeNull();

      // 3. Complete again idempotently
      const compReq2 = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const compRes2 = await completeUploadHandler(compReq2, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(compRes2.status).toBe(200);
    });

    it("should allow kitchen members (including viewers) to stream playback, but reject non-members", async () => {
      // Create an UPLOADED video in Kitchen A
      const videoRecord = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: (await testDb.user.findUnique({ where: { email: "rosa@family.com" } }))!.id,
          originalFilename: "sofrito_simmer.mp4",
          storageKey: "kitchens/test/videos/sofrito.mp4",
          contentType: "video/mp4",
          expectedSize: 5000000,
          actualSize: 5000000,
          uploadStatus: "UPLOADED",
          uploadExpiresAt: new Date(Date.now() + 3600 * 1000),
          completedAt: new Date(),
        },
      });

      // 1. Owner Rosa requests playback -> Allowed
      const playReqA = new NextRequest(
        `http://localhost:3000/api/videos/${videoRecord.id}/playback`,
        {
          headers: {
            host: "localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const playResA = await getPlaybackHandler(playReqA, {
        params: Promise.resolve({ id: videoRecord.id }),
      });
      expect(playResA.status).toBe(200);
      const dataA = await playResA.json();
      expect(dataA.playbackUrl).toBeDefined();

      // 2. Viewer Bob requests playback -> Allowed
      const playReqB = new NextRequest(
        `http://localhost:3000/api/videos/${videoRecord.id}/playback`,
        {
          headers: {
            host: "localhost:3000",
            cookie: userBCookie,
          },
        }
      );
      const playResB = await getPlaybackHandler(playReqB, {
        params: Promise.resolve({ id: videoRecord.id }),
      });
      expect(playResB.status).toBe(200);

      // 3. Stranger Dave requests playback -> 404 (IDOR protection)
      const playReqC = new NextRequest(
        `http://localhost:3000/api/videos/${videoRecord.id}/playback`,
        {
          headers: {
            host: "localhost:3000",
            cookie: userCCookie,
          },
        }
      );
      const playResC = await getPlaybackHandler(playReqC, {
        params: Promise.resolve({ id: videoRecord.id }),
      });
      expect(playResC.status).toBe(404);
    });

    it("should isolate video libraries across different users and kitchens", async () => {
      // Rosa has a video in Kitchen A
      await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: (await testDb.user.findUnique({ where: { email: "rosa@family.com" } }))!.id,
          originalFilename: "rosa_private.mp4",
          storageKey: "kitchens/test/videos/rosa.mp4",
          contentType: "video/mp4",
          expectedSize: 1000000,
          uploadStatus: "UPLOADED",
          uploadExpiresAt: new Date(),
        },
      });

      // 1. Rosa lists videos -> sees 1 video
      const listReqA = new NextRequest("http://localhost:3000/api/videos", {
        headers: { host: "localhost:3000", cookie: userACookie },
      });
      const listResA = await listVideosHandler(listReqA);
      const listDataA = await listResA.json();
      expect(listDataA.videos.length).toBe(1);
      expect(listDataA.videos[0].originalFilename).toBe("rosa_private.mp4");

      // 2. Stranger Dave lists videos -> sees 0 videos (complete isolation)
      const listReqC = new NextRequest("http://localhost:3000/api/videos", {
        headers: { host: "localhost:3000", cookie: userCCookie },
      });
      const listResC = await listVideosHandler(listReqC);
      const listDataC = await listResC.json();
      expect(listDataC.videos.length).toBe(0);
    });

    it("should return video details for authorized member and 404 for stranger", async () => {
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: (await testDb.user.findUnique({ where: { email: "rosa@family.com" } }))!.id,
          originalFilename: "details_test.mp4",
          storageKey: "kitchens/test/videos/details_test.mp4",
          contentType: "video/mp4",
          expectedSize: 2000000,
          uploadStatus: "UPLOADED",
          uploadExpiresAt: new Date(),
        },
      });

      // Member Bob (viewer) -> 200
      const getReqB = new NextRequest(`http://localhost:3000/api/videos/${video.id}`, {
        headers: { host: "localhost:3000", cookie: userBCookie },
      });
      const getResB = await getVideoHandler(getReqB, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(getResB.status).toBe(200);
      const dataB = await getResB.json();
      expect(dataB.video.id).toBe(video.id);
      expect(dataB.video.originalFilename).toBe("details_test.mp4");

      // Non-member Dave -> 404
      const getReqC = new NextRequest(`http://localhost:3000/api/videos/${video.id}`, {
        headers: { host: "localhost:3000", cookie: userCCookie },
      });
      const getResC = await getVideoHandler(getReqC, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(getResC.status).toBe(404);
    });

    it("should allow owner to delete video and reject viewer deletion", async () => {
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: (await testDb.user.findUnique({ where: { email: "rosa@family.com" } }))!.id,
          originalFilename: "to_delete.mp4",
          storageKey: "kitchens/test/videos/to_delete.mp4",
          contentType: "video/mp4",
          expectedSize: 2000000,
          uploadStatus: "UPLOADED",
          uploadExpiresAt: new Date(),
        },
      });

      // 1. Viewer Bob tries to delete -> 404/403
      const delReqB = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}`,
        {
          method: "DELETE",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userBCookie,
          },
        }
      );
      const delResB = await deleteVideoHandler(delReqB, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(delResB.status).toBe(404);

      // 2. Owner Rosa deletes -> 200 and removed from DB
      const delReqA = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}`,
        {
          method: "DELETE",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const delResA = await deleteVideoHandler(delReqA, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(delResA.status).toBe(200);

      const dbCheck = await testDb.cookingVideo.findUnique({
        where: { id: video.id },
      });
      expect(dbCheck).toBeNull();
    });
  });
});
