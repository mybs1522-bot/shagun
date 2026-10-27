"use client";

import Image from "next/image";
import React, { useState } from "react";

import { cn } from "@/lib/cn";
import { STORY_HIGHLIGHTS } from "../../data/stories";
import { StoryDialog } from "./story-dialog";

export function StoryHighlights({ className }: { className?: string }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handleOpenStory = (index: number) => {
    setSelectedIndex(index);
    setDialogOpen(true);
  };

  return (
    <>
      <section
        id="highlights"
        className={cn(
          "screen-line-before screen-line-after border-x border-grid select-none",
          className
        )}
      >
        <div className="py-3 px-3 sm:px-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] sm:text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Featured Highlights
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/80">
              Tap to view
            </span>
          </div>

          <div className="flex items-start gap-4 sm:gap-5 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth">
            {STORY_HIGHLIGHTS.map((story, index) => (
              <button
                key={story.id}
                onClick={() => handleOpenStory(index)}
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

                {/* Highlight Title */}
                <span className="text-[11px] sm:text-xs font-medium text-foreground tracking-tight text-center max-w-[72px] sm:max-w-[80px] truncate group-hover:text-primary transition-colors">
                  {story.title}
                </span>
              </button>
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
