import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as createKitchenHandler } from "@/app/api/kitchens/route";
import { POST as initiateUploadHandler } from "@/app/api/videos/initiate/route";
import { POST as completeUploadHandler } from "@/app/api/videos/[id]/complete/route";
import { GET as getProcessingStatusHandler } from "@/app/api/videos/[id]/processing/route";
import { POST as triggerProcessHandler } from "@/app/api/videos/[id]/process/route";
import {
  dispatchPendingValidationJobs,
  getVideoValidationStats,
} from "@/lib/services/jobs";
import { processVideoValidationJob } from "@/worker/processors/video-validation";
import * as storageModule from "@/lib/storage/r2";
import { closeSharedRedis } from "@/lib/queue/redis";
import { closeQueues } from "@/lib/queue";

describe("Background Processing, Outbox Dispatch & Video Validation Integration Tests", () => {
  let userACookie: string;
  let userBCookie: string;
  let userCCookie: string;
  let kitchenAId: string;
  const sampleFixturePath = path.resolve(process.cwd(), "tests/fixtures/sample-cooking.mp4");
  const corruptFixturePath = path.resolve(process.cwd(), "tests/fixtures/corrupt-video.mp4");

  beforeEach(async () => {
    await clearTestDatabase();

    // Mock storage so unit/integration tests do not require external cloud credentials
    vi.spyOn(storageModule, "isStorageConfigured").mockReturnValue(true);
    vi.spyOn(storageModule, "generatePresignedUploadUrl").mockResolvedValue({
      uploadUrl: "https://mock-r2.cloudflarestorage.com/upload-target",
      storageKey: "kitchens/mock/videos/test.mp4",
      expiresInSeconds: 300,
    });
    vi.spyOn(storageModule, "verifyObjectExists").mockResolvedValue({
      exists: true,
      contentLength: 1048576,
      contentType: "video/mp4",
    });

    // 1. Create User A (Owner of Kitchen A)
    const reqA = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Rosa Martinez",
        email: "rosa@family.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resA = await registerHandler(reqA);
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
        name: "Abuela Rosa's Kitchen",
        description: "Family recipes and recordings",
      }),
    });
    const kResA = await createKitchenHandler(kReqA);
    const kDataA = await kResA.json();
    kitchenAId = kDataA.kitchen.id;

    // 2. Create User B (Member/Viewer of Kitchen A)
    const reqB = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Bob Martinez",
        email: "bob@family.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resB = await registerHandler(reqB);
    const cookiesB = resB.headers.getSetCookie();
    userBCookie = cookiesB.map((c) => c.split(";")[0]).join("; ");

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

    // 3. Create User C (Stranger / Non-member)
    const reqC = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Dave Stranger",
        email: "dave@other.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });
    const resC = await registerHandler(reqC);
    const cookiesC = resC.headers.getSetCookie();
    userCCookie = cookiesC.map((c) => c.split(";")[0]).join("; ");
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await closeQueues();
    await closeSharedRedis();
  });

  describe("Upload Completion to Outbox Job Creation", () => {
    it("should transactionally create a PENDING_DISPATCH job when upload is completed", async () => {
      // 1. Initiate upload
      const initReq = new NextRequest("http://localhost:3000/api/videos/initiate", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: userACookie,
        },
        body: JSON.stringify({
          kitchenId: kitchenAId,
          originalFilename: "tamales_prep.mp4",
          contentType: "video/mp4",
          fileSize: 1048576,
        }),
      });
      const initRes = await initiateUploadHandler(initReq);
      const initData = await initRes.json();
      const videoId = initData.video.id;

      // 2. Complete upload
      const compReq = new NextRequest(
        `http://localhost:3000/api/videos/${videoId}/complete`,
        {
          method: "POST",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const compRes = await completeUploadHandler(compReq, {
        params: Promise.resolve({ id: videoId }),
      });
      expect(compRes.status).toBe(200);

      // Verify PostgreSQL database state
      const videoInDb = await testDb.cookingVideo.findUnique({
        where: { id: videoId },
        include: { processingJobs: true },
      });

      expect(videoInDb!.uploadStatus).toBe("UPLOADED");
      expect(videoInDb!.validationStatus).toBe("QUEUED");
      expect(videoInDb!.processingJobs.length).toBe(1);

      const job = videoInDb!.processingJobs[0];
      expect(job.jobType).toBe("VIDEO_VALIDATION");
      expect(["PENDING_DISPATCH", "QUEUED"]).toContain(job.status);
    });

    it("should be idempotent and not create duplicate jobs on repeated completion calls", async () => {
      // 1. Initiate upload
      const initReq = new NextRequest("http://localhost:3000/api/videos/initiate", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          cookie: userACookie,
        },
        body: JSON.stringify({
          kitchenId: kitchenAId,
          originalFilename: "salsa.mp4",
          contentType: "video/mp4",
          fileSize: 500000,
        }),
      });
      const initRes = await initiateUploadHandler(initReq);
      const { video } = await initRes.json();

      // 2. First completion
      const compReq1 = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/complete`,
        {
          method: "POST",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      await completeUploadHandler(compReq1, {
        params: Promise.resolve({ id: video.id }),
      });

      // 3. Second completion (client retry / duplicate call)
      const compReq2 = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/complete`,
        {
          method: "POST",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const res2 = await completeUploadHandler(compReq2, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(res2.status).toBe(200);

      const totalJobs = await testDb.processingJob.count({
        where: { videoId: video.id },
      });
      expect(totalJobs).toBe(1);
    });
  });

  describe("Outbox Dispatcher & Redis Resilience", () => {
    it("should dispatch pending jobs to BullMQ and record status as QUEUED", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: user!.id,
          originalFilename: "mole.mp4",
          storageKey: "kitchens/test/videos/mole.mp4",
          contentType: "video/mp4",
          expectedSize: 1000000,
          uploadStatus: "UPLOADED",
          validationStatus: "QUEUED",
          uploadExpiresAt: new Date(),
        },
      });

      const job = await testDb.processingJob.create({
        data: {
          videoId: video.id,
          kitchenId: kitchenAId,
          jobType: "VIDEO_VALIDATION",
          status: "PENDING_DISPATCH",
          stage: "WAITING_FOR_DISPATCH",
        },
      });

      const dispatchResult = await dispatchPendingValidationJobs(10);
      expect(dispatchResult.dispatched).toBeGreaterThanOrEqual(1);

      const updatedJob = await testDb.processingJob.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob!.status).toBe("QUEUED");
      expect(updatedJob!.stage).toBe("QUEUED");
      expect(updatedJob!.bullMqJobId).toBe(`video-val-${job.id}`);
      expect(updatedJob!.queuedAt).not.toBeNull();
    });

    it("should survive Redis downtime: leave pending job in PENDING_DISPATCH without losing work", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: user!.id,
          originalFilename: "resilience.mp4",
          storageKey: "kitchens/test/videos/resilience.mp4",
          contentType: "video/mp4",
          expectedSize: 500000,
          uploadStatus: "UPLOADED",
          validationStatus: "QUEUED",
          uploadExpiresAt: new Date(),
        },
      });

      const job = await testDb.processingJob.create({
        data: {
          videoId: video.id,
          kitchenId: kitchenAId,
          jobType: "VIDEO_VALIDATION",
          status: "PENDING_DISPATCH",
          stage: "WAITING_FOR_DISPATCH",
        },
      });

      // Simulate Redis downtime / connection failure
      const queue = (await import("@/lib/queue")).getVideoValidationQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockRejectedValueOnce(new Error("ECONNREFUSED: Connection refused to Redis"));

      try {
        const dispatchResult = await dispatchPendingValidationJobs(10);
        // Dispatcher reports failure gracefully without throwing
        expect(dispatchResult.failed).toBeGreaterThanOrEqual(1);

        // Job in DB remains safely stored in PENDING_DISPATCH
        const jobInDb = await testDb.processingJob.findUnique({
          where: { id: job.id },
        });
        expect(jobInDb!.status).toBe("PENDING_DISPATCH");
      } finally {
        addSpy.mockRestore();
      }
    });
  });

  describe("End-to-End Video Validation Processor Execution", () => {
    it("should successfully validate decodable video fixture and persist stream metadata", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: user!.id,
          originalFilename: "real_cooking.mp4",
          storageKey: "kitchens/test/videos/real_cooking.mp4",
          contentType: "video/mp4",
          expectedSize: 18000,
          uploadStatus: "UPLOADED",
          validationStatus: "QUEUED",
          uploadExpiresAt: new Date(),
        },
      });

      const job = await testDb.processingJob.create({
        data: {
          videoId: video.id,
          kitchenId: kitchenAId,
          jobType: "VIDEO_VALIDATION",
          status: "QUEUED",
          stage: "QUEUED",
        },
      });

      // Mock storage download to copy our valid fixture
      storageModule.setDownloadHandlerForTesting(async (_key, dest) => {
        await fs.promises.copyFile(sampleFixturePath, dest);
        const stat = await fs.promises.stat(dest);
        return { bytesWritten: stat.size };
      });

      try {
        const result = await processVideoValidationJob({
          jobId: job.id,
          videoId: video.id,
          kitchenId: kitchenAId,
          storageKey: video.storageKey,
          expectedSize: video.expectedSize,
        });

        expect(result.videoCodec).toBe("h264");
        expect(result.width).toBe(320);
        expect(result.height).toBe(240);
        expect(result.duration).toBeGreaterThan(0.8);

        // Check PostgreSQL records
        const updatedVideo = await testDb.cookingVideo.findUnique({
          where: { id: video.id },
        });
        expect(updatedVideo!.validationStatus).toBe("VALIDATED");
        expect(updatedVideo!.videoCodec).toBe("h264");
        expect(updatedVideo!.width).toBe(320);
        expect(updatedVideo!.height).toBe(240);
        expect(updatedVideo!.duration).toBeGreaterThan(0.8);
        expect(updatedVideo!.validationError).toBeNull();

        const updatedJob = await testDb.processingJob.findUnique({
          where: { id: job.id },
        });
        expect(updatedJob!.status).toBe("COMPLETED");
        expect(updatedJob!.stage).toBe("VALIDATED");
        expect(updatedJob!.completedAt).not.toBeNull();
      } finally {
        storageModule.setDownloadHandlerForTesting(null);
      }
    });

    it("should mark video as FAILED when media container is corrupted or invalid", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: user!.id,
          originalFilename: "corrupted_file.mp4",
          storageKey: "kitchens/test/videos/corrupted_file.mp4",
          contentType: "video/mp4",
          expectedSize: 100,
          uploadStatus: "UPLOADED",
          validationStatus: "QUEUED",
          uploadExpiresAt: new Date(),
        },
      });

      const job = await testDb.processingJob.create({
        data: {
          videoId: video.id,
          kitchenId: kitchenAId,
          jobType: "VIDEO_VALIDATION",
          status: "QUEUED",
          stage: "QUEUED",
        },
      });

      // Mock storage download to copy corrupt fixture
      storageModule.setDownloadHandlerForTesting(async (_key, dest) => {
        await fs.promises.copyFile(corruptFixturePath, dest);
        const stat = await fs.promises.stat(dest);
        return { bytesWritten: stat.size };
      });

      try {
        await expect(
          processVideoValidationJob({
            jobId: job.id,
            videoId: video.id,
            kitchenId: kitchenAId,
            storageKey: video.storageKey,
            expectedSize: video.expectedSize,
          })
        ).rejects.toThrow();

        // Verify status transition to FAILED
        const updatedVideo = await testDb.cookingVideo.findUnique({
          where: { id: video.id },
        });
        expect(updatedVideo!.validationStatus).toBe("FAILED");
        expect(updatedVideo!.validationError).toBeDefined();

        const updatedJob = await testDb.processingJob.findUnique({
          where: { id: job.id },
        });
        expect(updatedJob!.status).toBe("FAILED");
        expect(updatedJob!.stage).toBe("FAILED");
        expect(updatedJob!.errorMessage).toBeDefined();
      } finally {
        storageModule.setDownloadHandlerForTesting(null);
      }
    });
  });

  describe("Processing APIs & Access Control", () => {
    it("should allow kitchen members to query processing status and reject strangers with 404", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: user!.id,
          originalFilename: "status_test.mp4",
          storageKey: "kitchens/test/videos/status_test.mp4",
          contentType: "video/mp4",
          expectedSize: 1000,
          uploadStatus: "UPLOADED",
          validationStatus: "VALIDATED",
          videoCodec: "h264",
          duration: 45.2,
          uploadExpiresAt: new Date(),
        },
      });

      // 1. Viewer Bob queries status -> 200
      const reqB = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/processing`,
        {
          headers: { host: "localhost:3000", cookie: userBCookie },
        }
      );
      const resB = await getProcessingStatusHandler(reqB, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(resB.status).toBe(200);
      const dataB = await resB.json();
      expect(dataB.video.validationStatus).toBe("VALIDATED");
      expect(dataB.video.videoCodec).toBe("h264");

      // 2. Stranger Dave queries status -> 404 (isolated multi-tenancy)
      const reqC = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/processing`,
        {
          headers: { host: "localhost:3000", cookie: userCCookie },
        }
      );
      const resC = await getProcessingStatusHandler(reqC, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(resC.status).toBe(404);
    });

    it("should allow owner to retry validation and reject viewer from triggering validation", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });
      const video = await testDb.cookingVideo.create({
        data: {
          kitchenId: kitchenAId,
          uploadedById: user!.id,
          originalFilename: "retry_test.mp4",
          storageKey: "kitchens/test/videos/retry_test.mp4",
          contentType: "video/mp4",
          expectedSize: 1000,
          uploadStatus: "UPLOADED",
          validationStatus: "FAILED",
          validationError: "Previous inspection error",
          uploadExpiresAt: new Date(),
        },
      });

      // 1. Viewer Bob tries to trigger validation -> 404 / Forbidden
      const reqB = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/process`,
        {
          method: "POST",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userBCookie,
          },
        }
      );
      const resB = await triggerProcessHandler(reqB, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(resB.status).toBe(404);

      // 2. Owner Rosa triggers retry -> 200 & creates new job
      const reqA = new NextRequest(
        `http://localhost:3000/api/videos/${video.id}/process`,
        {
          method: "POST",
          headers: {
            host: "localhost:3000",
            origin: "http://localhost:3000",
            cookie: userACookie,
          },
        }
      );
      const resA = await triggerProcessHandler(reqA, {
        params: Promise.resolve({ id: video.id }),
      });
      expect(resA.status).toBe(200);

      const dbVideo = await testDb.cookingVideo.findUnique({
        where: { id: video.id },
      });
      expect(dbVideo!.validationStatus).toBe("QUEUED");
      expect(dbVideo!.validationError).toBeNull();
    });

    it("should accurately compute database-derived video validation metrics", async () => {
      const user = await testDb.user.findUnique({ where: { email: "rosa@family.com" } });

      // Create 1 validated, 1 queued, 1 failed
      await testDb.cookingVideo.createMany({
        data: [
          {
            kitchenId: kitchenAId,
            uploadedById: user!.id,
            originalFilename: "v1.mp4",
            storageKey: "k/v1.mp4",
            contentType: "video/mp4",
            expectedSize: 1000,
            uploadStatus: "UPLOADED",
            validationStatus: "VALIDATED",
            uploadExpiresAt: new Date(),
          },
          {
            kitchenId: kitchenAId,
            uploadedById: user!.id,
            originalFilename: "v2.mp4",
            storageKey: "k/v2.mp4",
            contentType: "video/mp4",
            expectedSize: 1000,
            uploadStatus: "UPLOADED",
            validationStatus: "QUEUED",
            uploadExpiresAt: new Date(),
          },
          {
            kitchenId: kitchenAId,
            uploadedById: user!.id,
            originalFilename: "v3.mp4",
            storageKey: "k/v3.mp4",
            contentType: "video/mp4",
            expectedSize: 1000,
            uploadStatus: "UPLOADED",
            validationStatus: "FAILED",
            uploadExpiresAt: new Date(),
          },
        ],
      });

      const stats = await getVideoValidationStats(user!.id);
      expect(stats.uploaded).toBe(3);
      expect(stats.validated).toBe(1);
      expect(stats.awaitingValidation).toBe(1);
      expect(stats.failedValidation).toBe(1);
    });
  });
});
