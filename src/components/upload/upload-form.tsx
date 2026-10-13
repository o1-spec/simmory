"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Info,
  ArrowRight,
  RefreshCw,
  Layers,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KitchenRole } from "@/generated/prisma/client";

interface KitchenOption {
  id: string;
  name: string;
  role: KitchenRole;
}

interface RecipeOption {
  id: string;
  title: string;
  kitchenId: string;
  cookName: string;
}

interface UploadFormProps {
  kitchens: KitchenOption[];
  recipes: RecipeOption[];
  storageConfigured: boolean;
  maxUploadSizeMb: number;
  defaultCookName: string;
}

type UploadStatus =
  | "idle"
  | "initiating"
  | "uploading"
  | "verifying"
  | "success"
  | "error";

export function UploadForm({
  kitchens,
  recipes,
  storageConfigured,
  maxUploadSizeMb,
  defaultCookName,
}: UploadFormProps) {
  const [selectedKitchenId, setSelectedKitchenId] = useState<string>(
    kitchens[0]?.id || ""
  );
  const [recipeOption, setRecipeOption] = useState<"none" | "existing" | "draft">(
    "none"
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [draftRecipeTitle, setDraftRecipeTitle] = useState<string>("");
  const [draftCookName, setDraftCookName] = useState<string>(defaultCookName);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedVideo, setCompletedVideo] = useState<{
    id: string;
    originalFilename: string;
  } | null>(null);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredRecipes = recipes.filter(
    (r) => r.kitchenId === selectedKitchenId
  );

  const maxFileSizeBytes = maxUploadSizeMb * 1024 * 1024;

  const handleFile = (file: File) => {
    setErrorMessage(null);

    const lower = file.name.toLowerCase();
    const validExt =
      lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm");

    if (!validExt) {
      setErrorMessage(
        "Unsupported video file type. Please select an MP4, MOV, or WebM file."
      );
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setErrorMessage(
        `File size (${(file.size / (1024 * 1024)).toFixed(
          1
        )} MB) exceeds the maximum allowed limit of ${maxUploadSizeMb} MB.`
      );
      return;
    }

    setSelectedFile(file);
    if (!draftRecipeTitle) {
      // Suggest clean title from filename
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setDraftRecipeTitle(
        baseName.charAt(0).toUpperCase() + baseName.slice(1)
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setStatus("idle");
    setProgress(0);
    setBytesUploaded(0);
    setTotalBytes(0);
  };

  const startUpload = async () => {
    if (!selectedFile || !selectedKitchenId) return;

    if (!storageConfigured) {
      setErrorMessage(
        "Cloudflare R2 / S3 storage credentials are not configured. Upload is paused."
      );
      return;
    }

    setErrorMessage(null);
    setStatus("initiating");
    setProgress(0);
    setBytesUploaded(0);
    setTotalBytes(selectedFile.size);

    try {
      let recipeIdToAttach: string | null = null;

      // If user chose to create a draft recipe, create it first
      if (recipeOption === "draft" && draftRecipeTitle.trim()) {
        const createRecipeRes = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kitchenId: selectedKitchenId,
            title: draftRecipeTitle.trim(),
            cookName: draftCookName.trim() || defaultCookName,
            description: "Preserved from original family cooking footage.",
            status: "DRAFT",
            ingredients: [],
            steps: [],
          }),
        });

        if (!createRecipeRes.ok) {
          const errData = await createRecipeRes.json().catch(() => ({}));
          throw new Error(
            errData.error || "Failed to create draft recipe for this video."
          );
        }

        const recipeData = await createRecipeRes.json();
        recipeIdToAttach = recipeData.recipe?.id || null;
      } else if (recipeOption === "existing" && selectedRecipeId) {
        recipeIdToAttach = selectedRecipeId;
      }

      // 1. Request presigned upload URL from Next.js server
      const initiateRes = await fetch("/api/videos/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitchenId: selectedKitchenId,
          recipeId: recipeIdToAttach,
          originalFilename: selectedFile.name,
          contentType: selectedFile.type || "video/mp4",
          fileSize: selectedFile.size,
        }),
      });

      if (!initiateRes.ok) {
        const errData = await initiateRes.json().catch(() => ({}));
        if (initiateRes.status === 503) {
          throw new Error(
            errData.message ||
              "Cloudflare R2 storage is not configured in this environment."
          );
        }
        throw new Error(errData.error || "Failed to initiate video upload.");
      }

      const { video, uploadUrl } = await initiateRes.json();

      // 2. Direct browser-to-R2 upload using XMLHttpRequest for real progress
      setStatus("uploading");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
            setBytesUploaded(event.loaded);
            setTotalBytes(event.total);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new Error(
                `Direct upload to storage provider failed (HTTP ${xhr.status}).`
              )
            );
          }
        };

        xhr.onerror = () => {
          reject(
            new Error(
              "Network failure during direct video upload. Please verify connection and CORS settings."
            )
          );
        };

        xhr.onabort = () => {
          reject(new Error("UPLOAD_ABORTED"));
        };

        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader(
          "Content-Type",
          selectedFile.type || "video/mp4"
        );
        xhr.send(selectedFile);
      });

      // 3. Confirm and finalize upload with server (R2 HEAD verification)
      setStatus("verifying");

      const completeRes = await fetch(`/api/videos/${video.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!completeRes.ok) {
        const errData = await completeRes.json().catch(() => ({}));
        throw new Error(
          errData.error || "Failed to verify video completion with storage."
        );
      }

      const completeData = await completeRes.json();
      setCompletedVideo(completeData.video);
      setStatus("success");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UPLOAD_ABORTED") {
        return;
      }
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected upload error occurred."
      );
    } finally {
      xhrRef.current = null;
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setStatus("idle");
    setProgress(0);
    setBytesUploaded(0);
    setTotalBytes(0);
    setErrorMessage(null);
    setCompletedVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // If upload succeeded, show the celebration screen with direct navigation links
  if (status === "success" && completedVideo) {
    return (
      <Card className="p-8 max-w-2xl mx-auto text-center border-sage-200 bg-warm-50/50">
        <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <Badge variant="sage" className="mb-2">
          Upload Complete
        </Badge>

        <h2 className="font-serif text-2xl text-warm-900 font-medium mb-2">
          Your video has been uploaded successfully.
        </h2>

        <p className="text-sm text-warm-600 max-w-md mx-auto mb-6">
          <strong>{completedVideo.originalFilename}</strong> is safely preserved in
          your private family kitchen. The recording is ready for authorized playback
          and future AI timeline extraction.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={`/videos/${completedVideo.id}`}>
            <Button variant="primary" size="lg">
              View Video Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={resetForm}>
            Upload Another Video
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form & Dropzone */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 sm:p-8">
          {/* Storage Alert if Not Configured */}
          {!storageConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-medium">
                  Cloudflare R2 Storage Setup Pending
                </p>
                <p className="text-amber-700 leading-relaxed">
                  Object storage credentials are not yet configured in the server
                  environment. Video upload initiation will return a 503 response
                  until R2 credentials are added to <code>.env</code>.
                </p>
              </div>
            </div>
          )}

          <h2 className="font-serif text-xl text-warm-900 font-medium mb-1">
            Cooking Video File
          </h2>
          <p className="text-xs text-warm-500 mb-6">
            Supported formats: MP4, MOV, WebM. Maximum size: {maxUploadSizeMb} MB.
          </p>

          {/* Kitchen Selector */}
          <div className="mb-6">
            <label
              htmlFor="kitchen-select"
              className="block text-xs font-medium text-warm-700 mb-1.5"
            >
              Select Family Kitchen <span className="text-terracotta-600">*</span>
            </label>
            {kitchens.length > 0 ? (
              <select
                id="kitchen-select"
                value={selectedKitchenId}
                onChange={(e) => {
                  setSelectedKitchenId(e.target.value);
                  setSelectedRecipeId("");
                }}
                disabled={status === "uploading" || status === "verifying"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-colors"
              >
                {kitchens.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.role.toLowerCase()})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-warm-100 rounded-xl text-xs text-warm-600">
                You do not currently belong to any kitchens where you have editing
                permissions. Please create or request editor access to a kitchen.
              </div>
            )}
          </div>

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all flex flex-col items-center justify-center ${
              isDragOver
                ? "border-terracotta-500 bg-terracotta-50/40"
                : "border-warm-300 hover:border-terracotta-400 bg-warm-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              disabled={status === "uploading" || status === "verifying"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="video-upload-input"
            />

            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-warm-200/80 flex items-center justify-center text-terracotta-500 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1.5 pointer-events-none">
                <Badge variant="sage" className="mb-1">
                  File Selected
                </Badge>
                <p className="text-sm font-medium text-warm-900 flex items-center justify-center gap-1.5">
                  <FileVideo className="w-4 h-4 text-warm-600" />
                  {selectedFile.name}
                </p>
                <p className="text-xs text-warm-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB &bull;{" "}
                  {selectedFile.type || "video"}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 pointer-events-none">
                <p className="text-sm font-medium text-warm-900">
                  Drag and drop your video file here, or{" "}
                  <span className="text-terracotta-600 underline">browse</span>
                </p>
                <p className="text-xs text-warm-500">
                  Original full-resolution footage is preserved directly in Cloudflare R2
                </p>
              </div>
            )}
          </div>

          {/* Recipe Association Options */}
          <div className="mt-6 pt-6 border-t border-warm-100 space-y-4">
            <h3 className="font-serif text-base text-warm-900 font-medium">
              Recipe Association
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecipeOption("none")}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  recipeOption === "none"
                    ? "border-terracotta-500 bg-terracotta-50/50 font-medium text-warm-900 shadow-xs"
                    : "border-warm-200 bg-white hover:bg-warm-50 text-warm-600"
                }`}
              >
                <Layers className="w-4 h-4 mb-1 text-warm-500" />
                Unassigned Video
              </button>

              <button
                type="button"
                onClick={() => setRecipeOption("existing")}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  recipeOption === "existing"
                    ? "border-terracotta-500 bg-terracotta-50/50 font-medium text-warm-900 shadow-xs"
                    : "border-warm-200 bg-white hover:bg-warm-50 text-warm-600"
                }`}
              >
                <FileText className="w-4 h-4 mb-1 text-warm-500" />
                Link Existing Recipe
              </button>

              <button
                type="button"
                onClick={() => setRecipeOption("draft")}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  recipeOption === "draft"
                    ? "border-terracotta-500 bg-terracotta-50/50 font-medium text-warm-900 shadow-xs"
                    : "border-warm-200 bg-white hover:bg-warm-50 text-warm-600"
                }`}
              >
                <Sparkles className="w-4 h-4 mb-1 text-terracotta-500" />
                Create Draft Recipe
              </button>
            </div>

            {/* Existing Recipe Selector */}
            {recipeOption === "existing" && (
              <div className="pt-2">
                <label
                  htmlFor="recipe-select"
                  className="block text-xs font-medium text-warm-700 mb-1"
                >
                  Select Existing Recipe
                </label>
                {filteredRecipes.length > 0 ? (
                  <select
                    id="recipe-select"
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  >
                    <option value="">-- Choose a recipe --</option>
                    {filteredRecipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} (by {r.cookName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-warm-500 italic">
                    No recipes exist in this kitchen yet. You can create a draft
                    recipe below.
                  </p>
                )}
              </div>
            )}

            {/* Create Draft Recipe Fields */}
            {recipeOption === "draft" && (
              <div className="pt-2 space-y-3">
                <Input
                  label="Recipe Title"
                  placeholder="e.g. Abuela Rosa's Braised Sofrito"
                  value={draftRecipeTitle}
                  onChange={(e) => setDraftRecipeTitle(e.target.value)}
                  required
                />
                <Input
                  label="Original Cook's Name"
                  placeholder="e.g. Grandma Rosa"
                  value={draftCookName}
                  onChange={(e) => setDraftCookName(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Tracking Bar */}
          {(status === "uploading" ||
            status === "initiating" ||
            status === "verifying") && (
            <div className="mt-6 p-4 rounded-xl bg-warm-100/70 border border-warm-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-warm-800">
                <span>
                  {status === "initiating" && "Requesting secure upload authorization..."}
                  {status === "uploading" && `Uploading to Cloudflare R2 (${progress}%)`}
                  {status === "verifying" && "Verifying upload integrity..."}
                </span>
                <span>
                  {(bytesUploaded / (1024 * 1024)).toFixed(1)} /{" "}
                  {(totalBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-warm-200 overflow-hidden">
                <div
                  className="h-full bg-terracotta-500 transition-all duration-150 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-warm-500">
                  {status === "verifying"
                    ? "Running S3 HEAD integrity check..."
                    : "Direct browser-to-bucket transfer"}
                </span>
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 pt-6 border-t border-warm-100 flex items-center justify-between gap-4">
            {status === "error" ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={startUpload}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Upload
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                disabled={
                  !selectedFile ||
                  !selectedKitchenId ||
                  !storageConfigured ||
                  status === "uploading" ||
                  status === "verifying" ||
                  status === "initiating"
                }
                onClick={startUpload}
              >
                {status === "uploading"
                  ? `Uploading (${progress}%)...`
                  : status === "verifying"
                  ? "Verifying Integrity..."
                  : "Upload Video to Family Kitchen"}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Information & Pipeline Guide */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-terracotta-500" />
            <h3 className="font-serif text-lg text-warm-900 font-medium">
              Cloudflare R2 Media Storage
            </h3>
          </div>
          <p className="text-xs text-warm-600 leading-relaxed mb-6">
            All cooking videos are preserved in full quality in your private Cloudflare
            R2 bucket. Presigned URLs allow direct, fast browser uploads without
            exposing secret keys.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-warm-200 text-warm-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Direct Presigned Upload
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  Your browser uploads straight to Cloudflare R2 with a short-lived
                  bearer token, avoiding serverless timeout limits.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-warm-200 text-warm-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Independent Verification
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  The server checks the object&apos;s presence and size using an S3 HEAD
                  request before marking the upload completed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-warm-200 text-warm-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Authorized Playback
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  Videos remain strictly private. Family members stream using
                  temporary 15-minute signed URLs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-warm-50 border border-warm-200/60">
              <div className="w-6 h-6 rounded-full bg-warm-200 text-warm-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-warm-900">
                  Future AI Timeline Extraction
                </p>
                <p className="text-[11px] text-warm-500 leading-relaxed">
                  In future phases, background workers (FFmpeg, Faster-Whisper,
                  Gemma 4) will extract audio and visual sensory cues.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-warm-100 flex items-center gap-2 text-xs text-warm-500">
            <Info className="w-4 h-4 text-warm-400 shrink-0" />
            <span>AI processing will be integrated in subsequent phases.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
