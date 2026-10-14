import { describe, it, expect } from "vitest";
import path from "path";
import { runFFprobeInspection } from "@/worker/processors/video-validation";

describe("FFprobe Video Validation Unit Tests", () => {
  const validFixturePath = path.resolve(process.cwd(), "tests/fixtures/sample-cooking.mp4");
  const corruptFixturePath = path.resolve(process.cwd(), "tests/fixtures/corrupt-video.mp4");

  it("should successfully inspect a valid video fixture and extract metadata", async () => {
    const result = await runFFprobeInspection(validFixturePath);

    expect(result.duration).toBeGreaterThan(0.8);
    expect(result.videoCodec).toBe("h264");
    expect(result.width).toBe(320);
    expect(result.height).toBe(240);
    expect(result.fps).toBe(30);
    expect(result.audioCodec).toBe("aac");
  });

  it("should reject an invalid or corrupted file container with a clear error", async () => {
    await expect(runFFprobeInspection(corruptFixturePath)).rejects.toThrow();
  });

  it("should throw an error if the media file does not exist", async () => {
    const nonexistent = path.resolve(process.cwd(), "tests/fixtures/does-not-exist.mp4");
    await expect(runFFprobeInspection(nonexistent)).rejects.toThrow();
  });
});
