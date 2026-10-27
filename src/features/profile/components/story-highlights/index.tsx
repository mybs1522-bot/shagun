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

      {/* Highlight Title with 2-line wrapping to prevent truncation */}
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
      {/* Inline styles ensure the marquee animation is 100% active and cannot be purged by CSS compilers */}
      <style>{`
        @keyframes storyMarqueeAnimation {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .story-marquee-track {
          display: flex;
          width: max-content;
          animation: storyMarqueeAnimation 28s linear infinite;
        }
        .story-marquee-track.paused {
          animation-play-state: paused !important;
        }
        @media (min-width: 640px) {
          .story-marquee-track {
            animation: none !important;
            transform: none !important;
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <section
        id="highlights"
        className={cn(
          "screen-line-before screen-line-after border-x border-grid select-none overflow-hidden",
          className
        )}
      >
        <div className="py-3 px-3 sm:px-4">
          {/* Header with bold 'Services' */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Services
            </h2>
            <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
              Tap to view
            </span>
          </div>

          {/* Story Container */}
          <div
            className="relative flex overflow-hidden group touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Subtle Fade Edges on Mobile */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent sm:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:hidden" />

            {/* Seamless Infinite Marquee Track */}
            <div
              className={cn(
                "story-marquee-track flex gap-4 sm:gap-6 pr-4 sm:pr-0",
                isPaused && "paused"
              )}
            >
              {/* Set 1: Original 7 items */}
              {STORY_HIGHLIGHTS.map((story, index) => (
                <StoryItem
                  key={`set1-${story.id}`}
                  story={story}
                  onClick={() => handleOpenStory(index)}
                />
              ))}

              {/* Set 2: Duplicate for seamless infinite loop on mobile (hidden on desktop) */}
              {STORY_HIGHLIGHTS.map((story, index) => (
                <div key={`set2-${story.id}`} className="sm:hidden shrink-0">
                  <StoryItem
                    story={story}
                    onClick={() => handleOpenStory(index)}
                  />
                </div>
              ))}
            </div>
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
