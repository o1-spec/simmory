"use client";

import React, { useState } from "react";
import {
  Play,
  CheckCircle2,
  Edit3,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUp,
  ArrowDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReviewedEventData {
  id: string;
  reviewId: string;
  sourceProposedEventId: string | null;
  position: number;
  title: string;
  description: string;
  originalAiTitle: string | null;
  originalAiDescription: string | null;
  startTimestamp: number;
  endTimestamp: number | null;
  status: "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED";
  humanClarification: string | null;
  sensoryCue: string | null;
  evidenceFrames: unknown;
  transcriptSegments: unknown;
}

interface EventCardProps {
  event: ReviewedEventData;
  index: number;
  totalEvents: number;
  videoDuration: number;
  canEdit: boolean;
  onSeek: (seconds: number) => void;
  onUpdate: (
    eventId: string,
    data: {
      title?: string;
      description?: string;
      startTimestamp?: number;
      endTimestamp?: number | null;
      status?: "UNREVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED";
      humanClarification?: string | null;
      sensoryCue?: string | null;
    }
  ) => Promise<void>;
  onMoveUp?: (eventId: string) => void;
  onMoveDown?: (eventId: string) => void;
}

export function EventCard({
  event,
  index,
  totalEvents,
  videoDuration,
  canEdit,
  onSeek,
  onUpdate,
  onMoveUp,
  onMoveDown,
}: EventCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showOriginalAi, setShowOriginalAi] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startTime, setStartTime] = useState(event.startTimestamp.toString());
  const [endTime, setEndTime] = useState(
    event.endTimestamp != null ? event.endTimestamp.toString() : ""
  );
  const [sensoryCue, setSensoryCue] = useState(event.sensoryCue || "");
  const [clarification, setClarification] = useState(
    event.humanClarification || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const formatTimestamp = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAccept = async () => {
    setIsSaving(true);
    try {
      await onUpdate(event.id, { status: "ACCEPTED" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    setIsSaving(true);
    try {
      await onUpdate(event.id, { status: "REJECTED" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const parsedStart = parseFloat(startTime);
      const parsedEnd = endTime.trim() ? parseFloat(endTime) : null;

      await onUpdate(event.id, {
        title: title.trim(),
        description: description.trim(),
        startTimestamp: isNaN(parsedStart) ? event.startTimestamp : parsedStart,
        endTimestamp: parsedEnd,
        sensoryCue: sensoryCue.trim() || null,
        humanClarification: clarification.trim() || null,
        status: "EDITED",
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const statusBadge = () => {
    switch (event.status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Accepted
          </span>
        );
      case "EDITED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            Human Edited
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Excluded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-800 border border-terracotta-200">
            <HelpCircle className="w-3.5 h-3.5 text-terracotta-600" />
            Unreviewed Proposal
          </span>
        );
    }
  };

  const evidenceFrames = Array.isArray(event.evidenceFrames)
    ? (event.evidenceFrames as string[])
    : [];

  return (
    <div
      className={`rounded-2xl border transition-all ${
        event.status === "REJECTED"
          ? "bg-warm-100/40 border-warm-200 opacity-60"
          : event.status === "ACCEPTED"
            ? "bg-white border-emerald-200/80 shadow-xs"
            : event.status === "EDITED"
              ? "bg-white border-amber-200 shadow-xs"
              : "bg-white border-terracotta-200/60 shadow-xs"
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-warm-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-warm-100 text-warm-700 text-xs font-bold">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={() => onSeek(event.startTimestamp)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 text-xs font-medium border border-terracotta-200/80 transition-colors"
            title="Click to jump video to this moment"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {formatTimestamp(event.startTimestamp)}
              {event.endTimestamp != null && ` - ${formatTimestamp(event.endTimestamp)}`}
            </span>
          </button>
          {statusBadge()}
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            {onMoveUp && index > 0 && (
              <button
                type="button"
                onClick={() => onMoveUp(event.id)}
                className="p-1.5 rounded-md hover:bg-warm-100 text-warm-500 hover:text-warm-800 transition-colors"
                title="Move step up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
            {onMoveDown && index < totalEvents - 1 && (
              <button
                type="button"
                onClick={() => onMoveDown(event.id)}
                className="p-1.5 rounded-md hover:bg-warm-100 text-warm-500 hover:text-warm-800 transition-colors"
                title="Move step down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}
            {!isEditing && event.status !== "REJECTED" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Step Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                placeholder="e.g. Bring water to boil"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Cooking Instruction & Action
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 font-sans leading-relaxed"
                placeholder="Explain what the cook does in this step..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Start (Seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={videoDuration}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-warm-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  End (Seconds, optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={videoDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-warm-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Sensory Cue (Texture, aroma, sound, or visual sign)
              </label>
              <input
                type="text"
                value={sensoryCue}
                onChange={(e) => setSensoryCue(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder='e.g. "Stir until the paste stops sticking to the side of the pot"'
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Cook Clarification or Memory
              </label>
              <input
                type="text"
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                placeholder='e.g. "My mother always cautioned to use cold water first"'
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdits}
                isLoading={isSaving}
              >
                Save Changes
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTitle(event.title);
                  setDescription(event.description);
                  setStartTime(event.startTimestamp.toString());
                  setEndTime(event.endTimestamp != null ? event.endTimestamp.toString() : "");
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-serif text-base sm:text-lg font-medium text-warm-900 mb-1">
              {event.title}
            </h3>
            <p className="text-xs sm:text-sm text-warm-700 leading-relaxed font-sans">
              {event.description}
            </p>

            {event.sensoryCue && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-amber-900 block">
                    Sensory Cue:
                  </span>
                  <span className="text-amber-800">{event.sensoryCue}</span>
                </div>
              </div>
            )}

            {event.humanClarification && (
              <div className="mt-2.5 p-3 bg-terracotta-50/60 border border-terracotta-200/70 rounded-xl flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-terracotta-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-terracotta-900 block">
                    Cook Clarification:
                  </span>
                  <span className="text-terracotta-800">{event.humanClarification}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Supporting Evidence Bar */}
        <div className="pt-3 border-t border-warm-100 flex flex-wrap items-center justify-between gap-2 text-xs text-warm-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-warm-600">Video Evidence:</span>
            {evidenceFrames.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded bg-warm-100 text-warm-600 font-mono text-[11px]"
              >
                {f}
              </span>
            ))}
          </div>

          {event.originalAiTitle && (
            <button
              type="button"
              onClick={() => setShowOriginalAi(!showOriginalAi)}
              className="inline-flex items-center gap-1 text-[11px] text-warm-500 hover:text-warm-800 underline transition-colors"
            >
              <span>{showOriginalAi ? "Hide AI Proposal" : "Compare Original AI"}</span>
              {showOriginalAi ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Original AI Proposal Drawer (Preserving Provenance) */}
        {showOriginalAi && event.originalAiTitle && (
          <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-200 text-xs text-warm-600 space-y-1 animate-fadeIn">
            <span className="font-semibold text-warm-800 block text-[11px] uppercase tracking-wider">
              Original AI Candidate Proposal (Pre-Review)
            </span>
            <p className="font-medium text-warm-800">{event.originalAiTitle}</p>
            <p className="text-warm-600 leading-relaxed font-sans">
              {event.originalAiDescription}
            </p>
          </div>
        )}

        {/* Review Action Buttons */}
        {canEdit && !isEditing && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {event.status !== "ACCEPTED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAccept}
                isLoading={isSaving}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Accept Step
              </Button>
            )}
            {event.status !== "EDITED" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Correct Step
              </Button>
            )}
            {event.status !== "REJECTED" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                isLoading={isSaving}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Exclude from Recipe
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAccept}
                isLoading={isSaving}
              >
                Restore Step
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
