"use client";

import React, { useState } from "react";

import { cn } from "@/lib/cn";

import { Review } from "../../types/reviews";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Deterministic color from name for the avatar fallback
function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-600",
    "bg-violet-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-indigo-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function ReviewCard({ review }: { review: Review }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        "flex min-w-[280px] max-w-[340px] shrink-0 flex-col justify-between",
        "rounded-xl border border-border/50 bg-card p-4",
        "transition-colors duration-200"
      )}
    >
      <p className="mb-4 text-sm leading-relaxed text-foreground/90">
        {review.content}
      </p>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
            imgError || !review.author.avatar
              ? getAvatarColor(review.author.name)
              : "bg-muted"
          )}
        >
          {!imgError && review.author.avatar ? (
            <img
              src={review.author.avatar}
              alt={review.author.name}
              className="size-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-xs font-medium text-white">
              {getInitials(review.author.name)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-medium text-foreground">
              {review.author.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
