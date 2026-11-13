"use client";

import React, { useState, useEffect } from "react";
import { rateLimitManager, RateLimitState } from "@/http/rateLimitManager";

const RateLimitBanner = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(() =>
    rateLimitManager.getState()
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = rateLimitManager.subscribe((state) => {
      setRateLimitState(state);
      if (state.isRateLimited) {
        setIsDismissed(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const { isRateLimited, retryAfter, message } = rateLimitState;

  if (isDismissed || !isRateLimited || retryAfter <= 0) {
    return null;
  }

  const formatCountdown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  return (
    <div className="sticky top-0 z-[99] w-full px-4 py-3 text-amber-950 bg-amber-500/95 border-b border-amber-600/30 shadow-md backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-700/20 text-lg">
            ⏳
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-950">
              Please pause for a moment — Try again in:{" "}
              <span className="font-mono font-bold text-amber-900 bg-amber-400/50 px-2 py-0.5 rounded">
                {formatCountdown(retryAfter)}
              </span>
            </p>
            <p className="text-xs text-amber-900/80">
              {message || "You're moving a little fast! Please wait a moment before trying again."}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="rounded-lg bg-amber-700/20 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-700/30 transition"
          title="Dismiss banner"
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
};

export default RateLimitBanner;

