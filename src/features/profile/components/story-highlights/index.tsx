"use client";

import Image from "next/image";
import React, { useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { StoryHighlight, STORY_HIGHLIGHTS } from "../../data/stories";
import { StoryDialog } from "./story-dialog";

function StoryItem({
  story,
  onClick,
}: {
  story: StoryHighlight;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none transition-transform active:scale-95"
      aria-label={`View ${story.title} story highlight`}
    >
      {/* Instagram Gradient Ring */}
      <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] shadow-xs group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
        <div className="p-[2px] bg-background rounded-full">
          <div className="relative size-14 sm:size-16 rounded-full overflow-hidden bg-muted">
            <Image
              src={story.image}
              alt={story.title}
              fill
              sizes="(max-width: 640px) 56px, 64px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
      </div>

      {/* Highlight Title with 2-line wrapping to prevent awkward truncation */}
      <div className="h-7 sm:h-8 flex items-center justify-center">
        <span className="text-[10px] sm:text-[11px] font-medium text-foreground tracking-tight text-center leading-tight line-clamp-2 max-w-[72px] sm:max-w-[80px] group-hover:text-primary transition-colors">
          {story.title}
        </span>
      </div>
    </button>
  );
}

export function StoryHighlights({ className }: { className?: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenStory = (index: number) => {
    setSelectedIndex(index);
    setDialogOpen(true);
  };

  const handleTouchStart = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1200);
  };

  return (
    <>
      <section
        id="highlights"
        className={cn(
          "screen-line-before screen-line-after border-x border-grid select-none overflow-hidden",
          className
        )}
      >
        <div className="py-3 px-3 sm:px-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] sm:text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Featured Highlights
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/80">
              Tap to view
            </span>
          </div>

          {/* Mobile Auto-Scroll Marquee (< 640px) */}
          <div
            className="sm:hidden relative flex overflow-hidden group touch-pan-y"
            style={{ "--marquee-duration": "30s" } as React.CSSProperties}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Subtle Fade Edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent" />

            {/* Seamless Double Copy Loop */}
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className={cn(
                  "flex shrink-0 gap-4 pr-4",
                  "animate-marquee-left",
                  isPaused && "[animation-play-state:paused]"
                )}
                aria-hidden={copy === 1}
              >
                {STORY_HIGHLIGHTS.map((story, index) => (
                  <StoryItem
                    key={`${copy}-${story.id}`}
                    story={story}
                    onClick={() => handleOpenStory(index)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Desktop Static Centered Row (>= 640px) */}
          <div className="hidden sm:flex justify-center items-start gap-6 py-1 px-2">
            {STORY_HIGHLIGHTS.map((story, index) => (
              <StoryItem
                key={story.id}
                story={story}
                onClick={() => handleOpenStory(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Story Viewer Modal */}
      <StoryDialog
        stories={STORY_HIGHLIGHTS}
        initialIndex={selectedIndex}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
