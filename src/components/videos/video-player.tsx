"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Play, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoUploadStatus } from "@/generated/prisma/client";

interface VideoPlayerProps {
  videoId: string;
  uploadStatus: VideoUploadStatus;
  storageConfigured: boolean;
}

export function VideoPlayer({
  videoId,
  uploadStatus,
  storageConfigured,
}: VideoPlayerProps) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(
    storageConfigured && uploadStatus === "UPLOADED"
  );
  const [error, setError] = useState<string | null>(null);

  const refreshPlaybackUrl = async () => {
    if (!storageConfigured || uploadStatus !== "UPLOADED") return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/videos/${videoId}/playback`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load secure video stream.");
      }
      const data = await res.json();
      setPlaybackUrl(data.playbackUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error loading video stream."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (!storageConfigured || uploadStatus !== "UPLOADED") {
      return;
    }

    fetch(`/api/videos/${videoId}/playback`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load secure video stream.");
        }
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setPlaybackUrl(data.playbackUrl);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Error loading video stream."
          );
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId, storageConfigured, uploadStatus]);

  if (!storageConfigured) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-warm-900 flex flex-col items-center justify-center p-6 text-center text-white border border-warm-800">
        <Lock className="w-10 h-10 text-amber-400 mb-3" />
        <h3 className="font-serif text-lg font-medium mb-1">
          Cloudflare R2 Storage Configuration Required
        </h3>
        <p className="text-xs text-warm-300 max-w-md mb-4">
          The video metadata is safely recorded in PostgreSQL. Playback requires
          Cloudflare R2 credentials in <code>.env</code> to generate temporary
          authorized stream tokens.
        </p>
      </div>
    );
  }

  if (uploadStatus !== "UPLOADED") {
    return (
      <div className="w-full aspect-video rounded-2xl bg-warm-900 flex flex-col items-center justify-center p-6 text-center text-white border border-warm-800">
        <AlertCircle className="w-10 h-10 text-warm-400 mb-3" />
        <h3 className="font-serif text-lg font-medium mb-1">
          Upload Incomplete
        </h3>
        <p className="text-xs text-warm-300 max-w-md">
          This recording is currently in <strong>{uploadStatus}</strong> state.
          Playback will become available once the direct upload is finalized.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-warm-900 flex flex-col items-center justify-center p-6 text-center text-white border border-warm-800 space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshPlaybackUrl}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Authorized Stream
        </Button>
      </div>
    );
  }

  if (isLoading || !playbackUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-warm-900 flex flex-col items-center justify-center p-6 text-center text-white border border-warm-800">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-warm-300 font-mono">
          Authorizing secure playback token...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-warm-800">
      <video
        key={playbackUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full aspect-video rounded-2xl"
        src={playbackUrl}
        onError={() =>
          setError(
            "Playback token expired or stream unreachable. Click below to refresh your session token."
          )
        }
      >
        Your browser does not support the video tag.
      </video>

      <div className="px-4 py-2 bg-warm-950 flex items-center justify-between text-[11px] text-warm-400 border-t border-warm-800/60">
        <span className="flex items-center gap-1.5">
          <Play className="w-3 h-3 text-terracotta-500" />
          Native HTML5 video stream &bull; 15-minute temporary signed bearer URL
        </span>
        <button
          onClick={refreshPlaybackUrl}
          className="text-terracotta-400 hover:text-terracotta-300 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Renew stream token
        </button>
      </div>
    </div>
  );
}
