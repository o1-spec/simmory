"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UploadForm({ defaultCookName }: { defaultCookName: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [cookName, setCookName] = useState(defaultCookName);
  const [cookRelationship, setCookRelationship] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Video Dropzone & Recipe Metadata Form */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 sm:p-8">
          <h2 className="font-serif text-xl text-warm-900 font-medium mb-1">
            Cooking Video File
          </h2>
          <p className="text-xs text-warm-500 mb-4">
            Supported formats: MP4, MOV, WEBM. Phone recordings welcome.
          </p>

          {/* Dropzone Area */}
          <div className="relative border-2 border-dashed border-warm-300 hover:border-terracotta-400 rounded-2xl p-8 sm:p-12 text-center transition-colors bg-warm-50/50 flex flex-col items-center justify-center">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="video-upload-input"
            />

            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-warm-200/80 flex items-center justify-center text-terracotta-500 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <Badge variant="sage" className="mb-2">
                  File Selected
                </Badge>
                <p className="text-sm font-medium text-warm-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-warm-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-warm-900">
                  Drag and drop your video file here, or{" "}
                  <span className="text-terracotta-600 underline">browse</span>
                </p>
                <p className="text-xs text-warm-500">
                  Full resolution video is preserved without destructive compression
                </p>
              </div>
            )}
          </div>

          {/* Metadata Fields */}
          <div className="mt-8 space-y-4 pt-6 border-t border-warm-100">
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              Dish & Cook Details
            </h3>

            <Input
              label="Recipe or Dish Name"
              placeholder="e.g. Abuela Rosa's Braised Sofrito"
              value={recipeTitle}
              onChange={(e) => setRecipeTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cook's Name"
                placeholder="e.g. Rosa Maria Garcia"
                value={cookName}
                onChange={(e) => setCookName(e.target.value)}
              />
              <Input
                label="Relationship to Family"
                placeholder="e.g. Grandmother, Mom, Uncle"
                value={cookRelationship}
                onChange={(e) => setCookRelationship(e.target.value)}
              />
            </div>
          </div>

          {/* Action Button & Notice */}
          <div className="mt-8 pt-6 border-t border-warm-100 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled
              title="Cloudflare R2 and AI queue worker are scheduled for Phase 3"
            >
              Start AI Analysis & Review Preparation
            </Button>

            <div className="flex items-start gap-2 p-3.5 bg-warm-100/70 rounded-xl text-xs text-warm-600 border border-warm-200/60">
              <Info className="w-4 h-4 text-terracotta-500 shrink-0 mt-0.5" />
              <span>
                <strong>Pipeline Transparency Notice:</strong> Direct upload to Cloudflare R2 and the BullMQ processing queue will be enabled in subsequent phases. No mock progress or fake uploads will run.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Processing Pipeline Transparency Guide */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-terracotta-500" />
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              Future Processing Pipeline
            </h3>
          </div>
          <p className="text-xs text-warm-600 leading-relaxed mb-6 font-sans">
            Here is what happens automatically once the background AI worker is connected in future phases:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-warm-200 text-warm-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Audio Transcription (Faster-Whisper)
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  Transcribes spoken narration, side comments, and verbal ingredient confirmations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Visual Cue Extraction (Gemma 4 Vision)
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  Inspects video frames to identify pan transitions, color shifts, and physical actions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Candidate Timeline Synthesis
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  Correlates speech timestamps with visual cues into an initial proposed recipe structure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-sage-50 border border-sage-200">
              <div className="w-6 h-6 rounded-full bg-sage-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-sage-900">
                  Cook Verification & Review (Crucial)
                </p>
                <p className="text-[11px] text-sage-700 leading-relaxed">
                  The human cook reviews the proposed steps, clarifies missing measurements, and grants the verified seal.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-warm-100">
            <Link
              href="/review/demo"
              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-medium flex items-center gap-1 hover:underline"
            >
              Preview the AI Recipe Review Editor &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
