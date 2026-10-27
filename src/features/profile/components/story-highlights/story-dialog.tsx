"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { USER } from "@/data/user";
import { StoryHighlight } from "@/features/profile/data/stories";
import { VerifiedIcon } from "@/features/profile/components/verified-icon";

interface StoryDialogProps {
  stories: StoryHighlight[];
  initialIndex: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryDialog({
  stories,
  initialIndex,
  open,
  onOpenChange,
}: StoryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex ?? 0);

  useEffect(() => {
    if (initialIndex !== null) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex]);

  const currentStory = stories[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : stories.length - 1));
  }, [stories.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < stories.length - 1 ? prev + 1 : 0));
  }, [stories.length]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext]);

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] w-[95vw] p-0 overflow-hidden bg-zinc-950 text-white border-zinc-800 rounded-3xl shadow-2xl focus:outline-none"
      >
        <DialogTitle className="sr-only">
          {currentStory.title} - Story Highlight
        </DialogTitle>

        <div className="relative flex flex-col h-[640px] max-h-[85vh] select-none bg-zinc-950">
          {/* Progress Bars (Instagram Style) */}
          <div className="absolute top-2.5 inset-x-3 z-30 flex gap-1">
            {stories.map((story, i) => (
              <div
                key={story.id}
                className="h-1 flex-1 rounded-full overflow-hidden bg-white/25 backdrop-blur-xs cursor-pointer"
                onClick={() => setCurrentIndex(i)}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    i === currentIndex
                      ? "bg-white"
                      : i < currentIndex
                      ? "bg-white/80"
                      : "bg-transparent"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Top Story Header */}
          <div className="absolute top-6 inset-x-3 z-30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full overflow-hidden ring-1.5 ring-white/50 bg-zinc-800">
                <Image
                  src={USER.avatar}
                  alt={USER.displayName}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-semibold text-xs text-white">
                    {USER.displayName}
                  </span>
                  <VerifiedIcon className="size-3.5 text-[#3b82f6] shrink-0" />
                </div>
                <span className="text-[10px] text-white/70 font-mono">
                  {currentStory.category}
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white backdrop-blur-md transition-colors"
              aria-label="Close story"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Story Main Image */}
          <div className="relative flex-1 w-full overflow-hidden bg-zinc-900">
            <Image
              src={currentStory.image}
              alt={currentStory.title}
              fill
              className="object-cover"
              priority
            />

            {/* Tap areas for next/prev navigation */}
            <div
              className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-pointer"
              onClick={handlePrev}
              title="Previous story"
            />
            <div
              className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-pointer"
              onClick={handleNext}
              title="Next story"
            />

            {/* Navigation Chevron Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all max-sm:hidden"
              aria-label="Previous story"
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all max-sm:hidden"
              aria-label="Next story"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Gradient Overlay for bottom text readability */}
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent z-10 pointer-events-none" />
          </div>

          {/* Bottom Story Content Card */}
          <div className="relative z-20 p-4 pb-5 space-y-3 bg-zinc-950">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur-md">
                <Sparkles className="size-2.5" />
                <span>{currentStory.tagline}</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {currentStory.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentStory.description}
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {currentStory.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-300"
                >
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                asChild
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs h-9 rounded-xl shadow-lg transition-transform active:scale-95"
                onClick={() => onOpenChange(false)}
              >
                <Link href={currentStory.serviceLink || "/#services"}>
                  <span>{currentStory.actionText || "Book Consultation"}</span>
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
