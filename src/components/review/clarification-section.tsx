"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  CheckCircle,
  HelpCircle as QuestionIcon,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ClarificationData {
  id: string;
  reviewId: string;
  eventId: string | null;
  question: string;
  answer: string | null;
  status: "UNANSWERED" | "ANSWERED" | "UNKNOWN" | "NOT_APPLICABLE";
  source: "AI_GENERATED" | "HUMAN_ADDED";
  createdAt: string | Date;
}

interface ClarificationSectionProps {
  clarifications: ClarificationData[];
  canEdit: boolean;
  onSaveClarification: (data: {
    clarificationId?: string;
    question?: string;
    answer?: string;
    status?: "UNANSWERED" | "ANSWERED" | "UNKNOWN" | "NOT_APPLICABLE";
  }) => Promise<void>;
}

export function ClarificationSection({
  clarifications,
  canEdit,
  onSaveClarification,
}: ClarificationSectionProps) {
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  const handleOpenAnswer = (c: ClarificationData) => {
    setActiveAnswerId(c.id);
    setAnswerText(c.answer || "");
  };

  const handleSubmitAnswer = async (c: ClarificationData) => {
    if (!answerText.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveClarification({
        clarificationId: c.id,
        answer: answerText.trim(),
        status: "ANSWERED",
      });
      setActiveAnswerId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkStatus = async (
    c: ClarificationData,
    status: "UNKNOWN" | "NOT_APPLICABLE"
  ) => {
    setIsSubmitting(true);
    try {
      await onSaveClarification({
        clarificationId: c.id,
        answer: status === "UNKNOWN" ? "Marked as unknown by reviewer" : "Not applicable",
        status,
      });
      setActiveAnswerId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewQuestion = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveClarification({
        question: newQuestion.trim(),
      });
      setNewQuestion("");
      setIsAddingNew(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-medium text-warm-900">
            Clarification Questions for the Cook
          </h3>
          <p className="text-xs text-warm-600 font-sans">
            AI identifies what cannot be proved from video alone. Record traditional knowledge, unwritten cues, or exact family touches.
          </p>
        </div>
        {canEdit && !isAddingNew && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Question
          </Button>
        )}
      </div>

      {isAddingNew && (
        <div className="p-4 rounded-2xl bg-terracotta-50/50 border border-terracotta-200/80 space-y-3">
          <label className="block text-xs font-semibold text-warm-800">
            Ask the family cook a question:
          </label>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
            placeholder='e.g. "What kind of oil or fat did grandma prefer for this step?"'
          />
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNewQuestion}
              isLoading={isSubmitting}
            >
              Save Question
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewQuestion("");
                setIsAddingNew(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {clarifications.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-warm-50 border border-warm-200 text-xs text-warm-500">
          No clarification questions yet. Add one if you need to ask family members for missing recipe secrets!
        </div>
      ) : (
        <div className="space-y-3">
          {clarifications.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border transition-all ${
                c.status === "ANSWERED"
                  ? "bg-white border-emerald-200"
                  : c.status === "UNKNOWN" || c.status === "NOT_APPLICABLE"
                    ? "bg-warm-50 border-warm-200 opacity-70"
                    : "bg-white border-amber-200/80 shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <QuestionIcon className="w-4 h-4 text-terracotta-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-warm-900">
                    {c.question}
                  </span>
                </div>
                {c.status === "ANSWERED" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    Answered
                  </span>
                ) : c.status === "UNKNOWN" ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warm-100 text-warm-600">
                    Unknown
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Awaiting Answer
                  </span>
                )}
              </div>

              {c.answer && (
                <div className="mt-2 text-xs text-warm-700 bg-warm-50 p-3 rounded-xl border border-warm-100 font-sans">
                  <span className="font-semibold text-warm-800 block text-[11px] uppercase tracking-wider mb-0.5">
                    Family Answer:
                  </span>
                  {c.answer}
                </div>
              )}

              {canEdit && (
                <div className="mt-3 pt-2 border-t border-warm-100 flex items-center justify-between gap-2">
                  {activeAnswerId === c.id ? (
                    <div className="w-full space-y-2 mt-1">
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                        placeholder="Write the cook's answer or qualitative explanation..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSubmitAnswer(c)}
                          isLoading={isSubmitting}
                          leftIcon={<Send className="w-3 h-3" />}
                        >
                          Submit Answer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkStatus(c, "UNKNOWN")}
                        >
                          Mark Unknown
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveAnswerId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenAnswer(c)}
                      leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                    >
                      {c.answer ? "Edit Answer" : "Answer Question"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
