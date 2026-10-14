"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  ShieldCheck,
  Eye,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/videos/video-player";
import { EventCard, ReviewedEventData } from "./event-card";
import { ClarificationSection, ClarificationData } from "./clarification-section";
import { IngredientSection, ReviewedIngredientData } from "./ingredient-section";
import { RecipeConvertSection } from "./recipe-convert-section";
import { RecipePreviewSection } from "./recipe-preview-section";

interface ReviewWorkspaceProps {
  initialReview: {
    id: string;
    videoId: string;
    kitchenId: string;
    status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
    notes: string | null;
    cookVerified: boolean;
    cookVerifiedBy: string | null;
    cookVerifiedAt: string | Date | null;
    version: number;
    video: {
      id: string;
      originalFilename: string;
      duration: number | null;
      storageKey: string;
      kitchenId: string;
    };
    analysis: {
      id: string;
      status: string;
      speechStatus: string;
      summary: string | null;
      samplingStrategy: string | null;
      coverageRatio: number | null;
      sampledTimeRange: unknown;
      whisperModel: string;
      visionModel: string;
      createdAt: string | Date;
    };
    recipe?: {
      id: string;
      title: string;
      status: string;
    } | null;
    events: ReviewedEventData[];
    clarifications: ClarificationData[];
    ingredients: ReviewedIngredientData[];
  };
  kitchenName: string;
  userRole: string;
  storageConfigured: boolean;
}

export function RecipeReviewWorkspace({
  initialReview,
  kitchenName,
  userRole,
  storageConfigured,
}: ReviewWorkspaceProps) {
  const router = useRouter();
  const canEdit = userRole === "OWNER" || userRole === "EDITOR" || userRole === "ADMIN";

  const [review, setReview] = useState(initialReview);
  const [events, setEvents] = useState<ReviewedEventData[]>(initialReview.events);
  const [clarifications, setClarifications] = useState<ClarificationData[]>(
    initialReview.clarifications
  );
  const [ingredients, setIngredients] = useState<ReviewedIngredientData[]>(
    initialReview.ingredients
  );

  const [activeTab, setActiveTab] = useState<"EVENTS" | "CLARIFICATIONS" | "INGREDIENTS">("EVENTS");
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showConvertSection, setShowConvertSection] = useState(false);
  const [showPreviewSection, setShowPreviewSection] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventStart, setNewEventStart] = useState("0");
  const [newEventEnd, setNewEventEnd] = useState("");
  const [newEventSensory, setNewEventSensory] = useState("");

  const videoDuration = review.video.duration || 3600.0;

  // Derived progress stats
  const totalEvents = events.length;
  const reviewedEventsCount = events.filter((e) => e.status !== "UNREVIEWED").length;
  const answeredQuestionsCount = clarifications.filter(
    (c) => c.status === "ANSWERED"
  ).length;
  const totalQuestionsCount = clarifications.length;

  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
  };

  const handleUpdateEvent = async (
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
  ) => {
    setSaveStatus("SAVING");
    try {
      const res = await fetch(`/api/reviews/${review.id}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update event");
      }

      const resData = await res.json();
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, ...resData.event } : ev))
      );
      setSaveStatus("SAVED");
    } catch (err: unknown) {
      setSaveStatus("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Error saving changes");
    }
  };

  const handleMoveEvent = async (eventId: string, direction: "UP" | "DOWN") => {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx < 0) return;
    const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= events.length) return;

    const newEvents = [...events];
    const [moved] = newEvents.splice(idx, 1);
    newEvents.splice(targetIdx, 0, moved);

    setEvents(newEvents);

    try {
      await fetch(`/api/reviews/${review.id}/events/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: newEvents.map((e) => e.id) }),
      });
    } catch {
      // Revert if failed
      setEvents(events);
    }
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDesc.trim()) return;
    setSaveStatus("SAVING");
    try {
      const parsedStart = parseFloat(newEventStart);
      const parsedEnd = newEventEnd.trim() ? parseFloat(newEventEnd) : null;

      const res = await fetch(`/api/reviews/${review.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDesc.trim(),
          startTimestamp: isNaN(parsedStart) ? 0 : parsedStart,
          endTimestamp: parsedEnd,
          sensoryCue: newEventSensory.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add event");
      }

      const data = await res.json();
      setEvents((prev) => [...prev, data.event]);
      setIsAddingEvent(false);
      setNewEventTitle("");
      setNewEventDesc("");
      setNewEventStart("0");
      setNewEventEnd("");
      setNewEventSensory("");
      setSaveStatus("SAVED");
    } catch (err: unknown) {
      setSaveStatus("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Failed to add event");
    }
  };

  const handleSaveClarification = async (data: {
    clarificationId?: string;
    question?: string;
    answer?: string;
    status?: "UNANSWERED" | "ANSWERED" | "UNKNOWN" | "NOT_APPLICABLE";
  }) => {
    setSaveStatus("SAVING");
    try {
      const res = await fetch(`/api/reviews/${review.id}/clarifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save clarification");
      }

      const resData = await res.json();
      const updated = resData.clarification;

      setClarifications((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === updated.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setSaveStatus("SAVED");
    } catch (err: unknown) {
      setSaveStatus("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Error saving clarification");
    }
  };

  const handleSaveIngredient = async (data: {
    ingredientId?: string;
    name: string;
    quantity?: string | null;
    notes?: string | null;
    provenance?: "SPOKEN_INSTRUCTION" | "VISUALLY_SUGGESTED" | "HUMAN_SUPPLIED" | "HUMAN_CONFIRMED";
    isUnknownQuantity?: boolean;
    position?: number;
  }) => {
    setSaveStatus("SAVING");
    try {
      const res = await fetch(`/api/reviews/${review.id}/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save ingredient");
      }

      const resData = await res.json();
      const updated = resData.ingredient;

      setIngredients((prev) => {
        const idx = prev.findIndex((i) => i.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setSaveStatus("SAVED");
    } catch (err: unknown) {
      setSaveStatus("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Error saving ingredient");
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    try {
      await fetch(`/api/reviews/${review.id}/ingredients/${ingredientId}`, {
        method: "DELETE",
      });
      setIngredients((prev) => prev.filter((i) => i.id !== ingredientId));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error deleting ingredient");
    }
  };

  const handleToggleCookVerified = async (verified: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookVerified: verified,
          cookVerifiedBy: verified ? "Family Cook" : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReview((prev) => ({
          ...prev,
          cookVerified: data.review.cookVerified,
          cookVerifiedBy: data.review.cookVerifiedBy,
          cookVerifiedAt: data.review.cookVerifiedAt,
        }));
      }
    } catch {}
  };

  const handleConvertRecipe = async (options: {
    mode: "CREATE_NEW" | "MERGE_EXISTING";
    targetRecipeId?: string;
    title?: string;
    cookName?: string;
    story?: string;
    origin?: string;
    notes?: string;
  }) => {
    const res = await fetch(`/api/reviews/${review.id}/recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to convert recipe");
    }

    const data = await res.json();
    router.push(`/recipes/${data.recipe.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-warm-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-warm-500 font-sans">
            <Link
              href={`/videos/${review.videoId}`}
              className="inline-flex items-center gap-1 hover:text-warm-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Video</span>
            </Link>
            <span>•</span>
            <span>{kitchenName}</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-warm-900 font-medium tracking-tight">
            Reviewing Cooking Reconstruction
          </h1>
          <p className="text-xs sm:text-sm text-warm-600 font-sans">
            AI proposed candidate stages from the recording. Confirm details, add unwritten sensory cues, and preserve genuine family heritage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowPreviewSection(true)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Preview Recipe
          </Button>

          {canEdit && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowConvertSection(true)}
              disabled={events.filter((e) => e.status === "ACCEPTED" || e.status === "EDITED").length === 0}
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              Save as Recipe
            </Button>
          )}
        </div>
      </div>

      {/* Progress & Autosave Bar */}
      <div className="p-4 rounded-2xl bg-white border border-warm-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-warm-500 block text-[11px]">Reviewed Events:</span>
            <span className="font-semibold text-warm-900">
              {reviewedEventsCount} of {totalEvents} decided
            </span>
          </div>

          <div className="h-6 w-px bg-warm-200" />

          <div>
            <span className="text-warm-500 block text-[11px]">Cook Clarifications:</span>
            <span className="font-semibold text-warm-900">
              {answeredQuestionsCount} of {totalQuestionsCount} answered
            </span>
          </div>

          <div className="h-6 w-px bg-warm-200" />

          <div>
            <span className="text-warm-500 block text-[11px]">Ingredients:</span>
            <span className="font-semibold text-warm-900">
              {ingredients.length} items recorded
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cook Verification Attestation */}
          {canEdit && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-warm-50 px-3 py-1.5 rounded-xl border border-warm-200">
              <input
                type="checkbox"
                checked={review.cookVerified}
                onChange={(e) => handleToggleCookVerified(e.target.checked)}
                className="rounded border-warm-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-warm-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified by Cook
              </span>
            </label>
          )}

          {/* Autosave Status */}
          <div className="inline-flex items-center gap-1.5 text-warm-500 text-[11px]">
            {saveStatus === "SAVING" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Saving to PostgreSQL...</span>
              </>
            ) : saveStatus === "ERROR" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-600">Save failed</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Draft saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {review.recipe?.id && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Converted to Recipe: <strong className="font-semibold">{review.recipe.title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/cook/${review.recipe.id}`}>
              <Button size="sm" variant="primary" className="bg-emerald-700 hover:bg-emerald-800 gap-1.5 font-medium">
                <Play className="w-3.5 h-3.5 fill-white" />
                Cook This Recipe
              </Button>
            </Link>
            <Link href={`/recipes/${review.recipe.id}`}>
              <Button size="sm" variant="secondary">
                View Recipe
              </Button>
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Player & Coverage Metadata */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl overflow-hidden border border-warm-200 bg-warm-900 shadow-md">
            <VideoPlayer
              videoId={review.videoId}
              uploadStatus="UPLOADED"
              storageConfigured={storageConfigured}
              seekTime={seekTime}
            />
          </div>

          {/* Video & Analysis Context Card */}
          <div className="p-4 rounded-2xl bg-white border border-warm-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warm-900 truncate">
                {review.video.originalFilename}
              </span>
              <Badge variant="saffron" size="sm">
                {review.analysis.speechStatus === "NO_USABLE_SPEECH"
                  ? "Silent Footage"
                  : "Narrated Video"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-warm-600 pt-1 border-t border-warm-100 font-sans">
              <div>
                <span className="text-warm-400 block text-[10px] uppercase">Duration</span>
                <span className="font-medium text-warm-800">
                  {Math.round(videoDuration)} seconds
                </span>
              </div>
              <div>
                <span className="text-warm-400 block text-[10px] uppercase">Coverage</span>
                <span className="font-medium text-warm-800">
                  {review.analysis.samplingStrategy === "uniform_full_coverage"
                    ? "Full Video Coverage"
                    : "Fixed Interval Coverage"}
                </span>
              </div>
              <div>
                <span className="text-warm-400 block text-[10px] uppercase">Whisper Speech</span>
                <span className="font-medium text-warm-800">
                  {review.analysis.whisperModel} (int8)
                </span>
              </div>
              <div>
                <span className="text-warm-400 block text-[10px] uppercase">Vision Model</span>
                <span className="font-medium text-warm-800">
                  {review.analysis.visionModel}
                </span>
              </div>
            </div>

            {review.analysis.speechStatus === "NO_USABLE_SPEECH" && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 leading-relaxed font-sans">
                No usable narration was detected. Simmory analyzed visible actions and highlighted questions for the cook to fill in missing ingredients.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Review Workspace & Tabs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tabs Selector */}
          <div className="flex items-center gap-2 border-b border-warm-200/80 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("EVENTS")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "EVENTS"
                  ? "bg-terracotta-500 text-white shadow-xs"
                  : "bg-white text-warm-700 hover:bg-warm-100 border border-warm-200/80"
              }`}
            >
              Candidate Steps ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CLARIFICATIONS")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "CLARIFICATIONS"
                  ? "bg-terracotta-500 text-white shadow-xs"
                  : "bg-white text-warm-700 hover:bg-warm-100 border border-warm-200/80"
              }`}
            >
              Clarifications ({clarifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("INGREDIENTS")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "INGREDIENTS"
                  ? "bg-terracotta-500 text-white shadow-xs"
                  : "bg-white text-warm-700 hover:bg-warm-100 border border-warm-200/80"
              }`}
            >
              Ingredients ({ingredients.length})
            </button>
          </div>

          {/* TAB 1: EVENTS */}
          {activeTab === "EVENTS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-medium text-warm-900">
                    Review Cooking Steps
                  </h3>
                  <p className="text-xs text-warm-600 font-sans">
                    Click any timestamp to inspect the video. Accept, edit, or exclude candidate actions.
                  </p>
                </div>
                {canEdit && !isAddingEvent && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddingEvent(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Missing Step
                  </Button>
                )}
              </div>

              {/* Add Custom Event Form */}
              {isAddingEvent && (
                <div className="p-4 sm:p-5 rounded-2xl bg-terracotta-50/50 border border-terracotta-200/80 space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-bold text-warm-800 uppercase tracking-wider">
                    Add Human-Authored Cooking Step
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-warm-700 mb-1">
                      Step Title *
                    </label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder='e.g. "Mix dry flour with cold water"'
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-warm-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-warm-700 mb-1">
                      Cooking Instruction *
                    </label>
                    <textarea
                      rows={2}
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      placeholder="Explain what the cook does..."
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-warm-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-warm-700 mb-1">
                        Start Second
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newEventStart}
                        onChange={(e) => setNewEventStart(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-warm-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-warm-700 mb-1">
                        End Second (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newEventEnd}
                        onChange={(e) => setNewEventEnd(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-warm-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-warm-700 mb-1">
                      Sensory Cue (Optional)
                    </label>
                    <input
                      type="text"
                      value={newEventSensory}
                      onChange={(e) => setNewEventSensory(e.target.value)}
                      placeholder='e.g. "Until completely smooth without lumps"'
                      className="w-full text-xs px-3 py-2 rounded-xl border border-warm-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={handleAddEvent}>
                      Add Step
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingEvent(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Event Cards List */}
              <div className="space-y-4">
                {events.map((ev, idx) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    index={idx}
                    totalEvents={events.length}
                    videoDuration={videoDuration}
                    canEdit={canEdit}
                    onSeek={handleSeek}
                    onUpdate={handleUpdateEvent}
                    onMoveUp={canEdit ? (id) => handleMoveEvent(id, "UP") : undefined}
                    onMoveDown={canEdit ? (id) => handleMoveEvent(id, "DOWN") : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CLARIFICATIONS */}
          {activeTab === "CLARIFICATIONS" && (
            <ClarificationSection
              clarifications={clarifications}
              canEdit={canEdit}
              onSaveClarification={handleSaveClarification}
            />
          )}

          {/* TAB 3: INGREDIENTS */}
          {activeTab === "INGREDIENTS" && (
            <IngredientSection
              ingredients={ingredients}
              canEdit={canEdit}
              onSaveIngredient={handleSaveIngredient}
              onDeleteIngredient={handleDeleteIngredient}
            />
          )}
        </div>
      </div>

      {/* Inline Convert to Recipe Section */}
      <RecipeConvertSection
        isOpen={showConvertSection}
        onClose={() => setShowConvertSection(false)}
        defaultTitle={review.video.originalFilename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}
        defaultCookName="Family Cook"
        onConvert={handleConvertRecipe}
      />

      {/* Inline Recipe Heirloom Preview Section */}
      <RecipePreviewSection
        isOpen={showPreviewSection}
        onClose={() => setShowPreviewSection(false)}
        title={review.video.originalFilename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}
        cookName="Family Cook"
        kitchenName={kitchenName}
        notes={review.notes}
        cookVerified={review.cookVerified}
        cookVerifiedBy={review.cookVerifiedBy}
        events={events}
        ingredients={ingredients}
        onSeek={handleSeek}
      />
    </div>
  );
}
