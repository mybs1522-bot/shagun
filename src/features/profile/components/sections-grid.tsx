"use client";

import { BookOpen, Brush, Phone } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import { useRef,useState } from "react";

import { cn } from "@/lib/cn";

interface SectionsGridProps {
  designsContent: React.ReactNode;
  booksContent: React.ReactNode;
}

type Section = "designs" | "books" | null;

export function SectionsGrid({
  designsContent,
  booksContent,
}: SectionsGridProps) {
  const [activeSection, setActiveSection] = useState<Section>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: Section) => {
    setActiveSection((prev) => {
      const next = prev === section ? null : section;
      if (next) {
        setTimeout(() => {
          containerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 150);
      }
      return next;
    });
  };

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-6 scroll-mt-20">
      <div className="flex justify-center gap-4 sm:gap-6">

        <button
          onClick={() => toggleSection("designs")}
          className={cn(
            "group flex aspect-square w-32 sm:w-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all duration-200",
            activeSection === "designs"
              ? "border-primary bg-primary text-primary-foreground shadow-none translate-y-[4px]"
              : "border-border border-b-[6px] bg-card hover:-translate-y-[2px] hover:border-b-[8px] active:border-b-2 active:translate-y-[4px]"
          )}
        >
          <Brush
            className={cn(
              "size-6 sm:size-8 transition-transform group-hover:scale-110",
              activeSection === "designs"
                ? "text-primary-foreground"
                : "text-muted-foreground"
            )}
          />
          <span className="text-xs font-bold sm:text-sm">My Designs</span>
        </button>

        <button
          onClick={() => toggleSection("books")}
          className={cn(
            "group flex aspect-square w-32 sm:w-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all duration-200",
            activeSection === "books"
              ? "border-primary bg-primary text-primary-foreground shadow-none translate-y-[4px]"
              : "border-border border-b-[6px] bg-card hover:-translate-y-[2px] hover:border-b-[8px] active:border-b-2 active:translate-y-[4px]"
          )}
        >
          <BookOpen
            className={cn(
              "size-6 sm:size-8 transition-transform group-hover:scale-110",
              activeSection === "books"
                ? "text-primary-foreground"
                : "text-muted-foreground"
            )}
          />
          <span className="text-xs font-bold sm:text-sm">Books</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection && (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {activeSection === "designs" && designsContent}
              {activeSection === "books" && booksContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
