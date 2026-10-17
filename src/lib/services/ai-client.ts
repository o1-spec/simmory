import fs from "fs";
import path from "path";

export interface TranscriptSegmentData {
  start: number;
  end: number;
  text: string;
  language?: string | null;
  needs_review: boolean;
  position: number;
}

export interface AudioAnalysisData {
  status:
    | "USABLE_SPEECH"
    | "NO_AUDIO_TRACK"
    | "NO_USABLE_SPEECH"
    | "LOW_CONFIDENCE"
    | "TRANSCRIPTION_FAILED";
  language?: string | null;
  segments: TranscriptSegmentData[];
  notes?: string | null;
}

export interface FrameObservationData {
  frame_id: string;
  timestamp_seconds: number;
  visible_action?: string | null;
  food_appearance?: string | null;
  visible_objects: string[];
  uncertain_details: string[];
}

export interface VisualAnalysisData {
  total_frames_extracted: number;
  total_frames_analyzed: number;
  sampling_interval_seconds: number;
  sampling_strategy?: string;
  sampled_time_range?: number[];
  coverage_ratio?: number;
  observations: FrameObservationData[];
}


export interface ProposedEventData {
  position: number;
  title: string;
  description: string;
  evidence_frames: string[];
  evidence_transcripts: string[];
  observed_timestamps: number[];
  uncertainties: string[];
  question_for_cook?: string | null;
  verified: boolean;
}

export interface TimelineReconstructionData {
  events: ProposedEventData[];
  status: string;
  source_type: string;
}

export interface AIAnalysisResponseData {
  schema_version: string;
  whisper_model: string;
  vision_model: string;
  video_duration: number;
  speech_status:
    | "USABLE_SPEECH"
    | "NO_AUDIO_TRACK"
    | "NO_USABLE_SPEECH"
    | "LOW_CONFIDENCE"
    | "TRANSCRIPTION_FAILED";
  detected_language?: string | null;
  audio: AudioAnalysisData;
  vision: VisualAnalysisData;
  timeline: TimelineReconstructionData;
  summary?: string | null;
}

export interface AIHealthData {
  status: string;
  whisper_available: boolean;
  ollama_available: boolean;
  ollama_model_present: boolean;
  version: string;
}

export class AIServiceClient {
  private baseUrl: string;
  private internalKey: string;
  private timeoutMs: number;

  constructor(
    baseUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001",
    internalKey = process.env.SIMMORY_AI_INTERNAL_KEY || "simmory_dev_internal_ai_secret_key_2026_change_in_prod",
    timeoutMs = 600000 // 10 minutes max for video processing
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.internalKey = internalKey;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Probes the Python AI service health endpoint.
   */
  async checkHealth(): Promise<AIHealthData> {
    const url = `${this.baseUrl}/health`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`AI service health check returned HTTP ${res.status}`);
      }
      return (await res.json()) as AIHealthData;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Invokes the Python AI processing service on a local file path.
   * Uses authenticated loopback transport.
   */
  async analyzeLocalVideoPath(videoFilePath: string): Promise<AIAnalysisResponseData> {
    const resolvedPath = path.resolve(videoFilePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Video file does not exist at path: ${resolvedPath}`);
    }

    const http = await import("node:http");
    const urlObj = new URL(`${this.baseUrl}/api/analyze/path`);
    const postData = JSON.stringify({ video_path: resolvedPath });

    return new Promise<AIAnalysisResponseData>((resolve, reject) => {
      const req = http.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
            "X-Simmory-Internal-Key": this.internalKey,
          },
          timeout: this.timeoutMs,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              return reject(
                new Error(`AI Service error (${res.statusCode}): ${body.slice(0, 500)}`)
              );
            }
            try {
              const data = JSON.parse(body) as AIAnalysisResponseData;
              resolve(data);
            } catch (parseErr) {
              reject(new Error(`Failed to parse AI response: ${parseErr}`));
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`AI processing timed out after ${this.timeoutMs / 1000}s`));
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }
}

export const aiServiceClient = new AIServiceClient();
