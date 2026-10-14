"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Bell, Clock, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CookingTimerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  label?: string;
  onClose?: () => void;
}

export function CookingTimer({
  initialMinutes = 5,
  initialSeconds = 0,
  label = "Cooking Timer",
  onClose,
}: CookingTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(
    initialMinutes * 60 + initialSeconds
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialMinutes * 60 + initialSeconds
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Use absolute end timestamp for background tab accuracy
  const endTimeRef = useRef<number | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  // Play a soft pleasant harmonic chime using Web Audio API
  const playAlertChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      // Dual tone pleasant chime (C5 & E5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.85);
      });
    } catch {
      // Audio playback blocked by browser permissions, ignore safely
    }
  }, []);

  const handleTick = useCallback(() => {
    if (!endTimeRef.current) return;
    const now = Date.now();
    const diff = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
    setRemainingSeconds(diff);

    if (diff <= 0) {
      setIsRunning(false);
      setIsFinished(true);
      endTimeRef.current = null;
      playAlertChime();
    }
  }, [playAlertChime]);

  useEffect(() => {
    if (isRunning) {
      timerIdRef.current = setInterval(handleTick, 500);
    } else {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    }

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isRunning, handleTick]);

  // Handle visibility change (tab coming back to foreground)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning) {
        handleTick();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isRunning, handleTick]);

  const startTimer = () => {
    if (remainingSeconds <= 0) {
      setRemainingSeconds(totalSeconds);
      endTimeRef.current = Date.now() + totalSeconds * 1000;
    } else {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }
    setIsRunning(true);
    setIsFinished(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (endTimeRef.current) {
      const diff = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(diff);
      endTimeRef.current = null;
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    endTimeRef.current = null;
    setRemainingSeconds(totalSeconds);
  };

  const setPreset = (mins: number) => {
    const secs = mins * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(false);
    setIsFinished(false);
    endTimeRef.current = null;
  };

  const addMinute = () => {
    const newTotal = totalSeconds + 60;
    const newRem = remainingSeconds + 60;
    setTotalSeconds(newTotal);
    setRemainingSeconds(newRem);
    if (isRunning) {
      endTimeRef.current = (endTimeRef.current || Date.now()) + 60000;
    }
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPercent = totalSeconds > 0
    ? Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-warm-200/80 shadow-md p-4 sm:p-5 relative transition-all">
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close timer"
          className="absolute top-3 right-3 text-warm-400 hover:text-warm-700 p-1 rounded-lg hover:bg-warm-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-terracotta-600" />
        <span className="text-xs font-semibold text-warm-900 tracking-wide uppercase">
          {label}
        </span>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center my-2">
        <div
          className={`font-mono text-4xl sm:text-5xl font-bold tracking-tight transition-colors ${
            isFinished
              ? "text-rose-600 animate-pulse"
              : isRunning
                ? "text-terracotta-700"
                : "text-warm-900"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-warm-100 h-2 rounded-full overflow-hidden mt-3 max-w-xs">
          <div
            className={`h-full transition-all duration-300 ${
              isFinished ? "bg-rose-500" : "bg-terracotta-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isFinished && (
          <div className="flex items-center gap-1.5 mt-2 text-rose-600 font-semibold text-xs animate-bounce">
            <Bell className="w-3.5 h-3.5" />
            <span>Time&apos;s up! Check your food.</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {isRunning ? (
          <Button
            variant="secondary"
            size="md"
            onClick={pauseTimer}
            leftIcon={<Pause className="w-4 h-4" />}
          >
            Pause
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={startTimer}
            leftIcon={<Play className="w-4 h-4 fill-white" />}
          >
            {remainingSeconds === 0 ? "Restart" : "Start"}
          </Button>
        )}

        <Button
          variant="secondary"
          size="md"
          onClick={resetTimer}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          title="Reset"
        >
          Reset
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={addMinute}
          leftIcon={<Plus className="w-3 h-3" />}
          title="Add 1 minute"
        >
          +1m
        </Button>
      </div>

      {/* Preset Quick Buttons */}
      <div className="mt-4 pt-3 border-t border-warm-100 flex items-center justify-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-warm-500 mr-1">Presets:</span>
        {[1, 3, 5, 10, 15, 20].map((mins) => (
          <button
            key={mins}
            onClick={() => setPreset(mins)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              totalSeconds === mins * 60
                ? "border-terracotta-500 bg-terracotta-50 text-terracotta-800 font-semibold"
                : "border-warm-200 bg-warm-50 text-warm-600 hover:bg-warm-100 hover:text-warm-900"
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Extracts numeric minutes from typical step duration strings, e.g. "5 minutes", "10-15 mins".
 */
export function extractDurationMinutes(duration?: string | null): number | null {
  if (!duration) return null;
  const cleaned = duration.toLowerCase();
  const match = cleaned.match(/(\d+)\s*(?:min|minute)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
