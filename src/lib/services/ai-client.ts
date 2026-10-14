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

    const url = `${this.baseUrl}/api/analyze/path`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Simmory-Internal-Key": this.internalKey,
        },
        body: JSON.stringify({ video_path: resolvedPath }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorDetail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson.detail) errorDetail = errJson.detail;
        } catch {
          // ignore parsing error
        }
        throw new Error(`AI Service error (${res.status}): ${errorDetail}`);
      }

      const data = (await res.json()) as AIAnalysisResponseData;
      return data;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`AI processing timed out after ${this.timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const aiServiceClient = new AIServiceClient();
