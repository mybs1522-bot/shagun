"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function ServiceSlideshow({
  images,
  title,
  staggerOffset = 0,
}: {
  images: string[];
  title: string;
  staggerOffset?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    let intervalId: NodeJS.Timeout | undefined;

    // Initial stagger offset so different cards don't transition at the exact same instant
    const initialTimeout = setTimeout(() => {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => {
          setPreviousIndex(prev);
          return (prev + 1) % images.length;
        });
      }, 3400);
    }, staggerOffset);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [images, staggerOffset]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
      {/* Stacked Images for Smooth Crossfade */}
      {images.map((src, idx) => {
        const isCurrent = idx === currentIndex;
        const isPrev = idx === previousIndex;

        return (
          <img
            key={src}
            src={src}
            alt={`${title} 3D design concept ${idx + 1}`}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out select-none pointer-events-none",
              isCurrent
                ? "opacity-100 z-[2]"
                : isPrev
                  ? "opacity-100 z-[1]"
                  : "opacity-0 z-0"
            )}
            loading="eager"
          />
        );
      })}

      {/* Subtle bottom gradient to make dots and badge pop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30 pointer-events-none z-[3]" />

      {/* 3D Tag */}
      <span className="absolute top-1.5 left-1.5 z-[4] rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-black/75 text-white backdrop-blur-sm border border-white/20 shadow-xs">
        3D
      </span>

      {/* Smooth Indicator Dots */}
      <div className="absolute bottom-1.5 inset-x-0 z-[4] flex justify-center items-center gap-1 pointer-events-none">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              idx === currentIndex
                ? "w-3 bg-white shadow-xs"
                : "w-1 bg-white/45"
            )}
          />
        ))}
      </div>
    </div>
  );
}
