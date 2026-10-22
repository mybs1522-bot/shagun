"use client";

import { ChevronRight, LayoutPanelTop, Package, Phone, Video, Sparkles } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/cn";

import { Service } from "../../types/services";
import { ServiceDialog, isFloorPlanRequiredService } from "./service-dialog";
import { ServiceSlideshow } from "./service-slideshow";

const SLIDESHOW_MAP: Record<string, string[]> = {
  bedroom: [
    "/images/services/bedroom/bedroom-1.webp",
    "/images/services/bedroom/bedroom-2.webp",
    "/images/services/bedroom/bedroom-3.webp",
    "/images/services/bedroom/bedroom-4.webp",
    "/images/services/bedroom/bedroom-5.webp",
    "/images/services/bedroom/bedroom-6.webp",
  ],
  kitchen: [
    "/images/services/kitchen/kitchen-1.webp",
    "/images/services/kitchen/kitchen-2.webp",
    "/images/services/kitchen/kitchen-3.webp",
    "/images/services/kitchen/kitchen-4.webp",
    "/images/services/kitchen/kitchen-5.webp",
    "/images/services/kitchen/kitchen-6.webp",
  ],
  washroom: [
    "/images/services/washroom/washroom-1.webp",
    "/images/services/washroom/washroom-2.webp",
    "/images/services/washroom/washroom-3.webp",
    "/images/services/washroom/washroom-4.webp",
    "/images/services/washroom/washroom-5.webp",
    "/images/services/washroom/washroom-6.webp",
  ],
  living: [
    "/images/services/living/living-1.webp",
    "/images/services/living/living-2.webp",
    "/images/services/living/living-3.webp",
    "/images/services/living/living-4.webp",
    "/images/services/living/living-5.webp",
    "/images/services/living/living-6.webp",
  ],
};

function getSlideshowImages(title: string): string[] | null {
  const t = title.toLowerCase();
  if (t.includes("bedroom")) return SLIDESHOW_MAP.bedroom;
  if (t.includes("kitchen")) return SLIDESHOW_MAP.kitchen;
  if (t.includes("washroom") || t.includes("bathroom")) return SLIDESHOW_MAP.washroom;
  return null;
}

const RECOMMENDATION_MAP: Record<string, number> = {
  bedroom: 86,
  kitchen: 94,
  washroom: 72,
};

function getRecommendationCount(title: string): number | null {
  const t = title.toLowerCase();
  if (t.includes("bedroom")) return RECOMMENDATION_MAP.bedroom;
  if (t.includes("kitchen")) return RECOMMENDATION_MAP.kitchen;
  if (t.includes("washroom") || t.includes("bathroom")) return RECOMMENDATION_MAP.washroom;
  return null;
}

function getInitials(title: string) {
  return title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getServiceIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("floor plan")) return <LayoutPanelTop className="size-6 text-foreground" />;
  if (t.includes("3d design") || t.includes("3d")) return <Package className="size-6 text-foreground" />;
  if (t.includes("video") || t.includes("google meet") || t.includes("zoom")) return <Video className="size-6 text-foreground" />;
  if (t.includes("call") || t.includes("consultation")) return (
    <Phone className="size-6 text-foreground animate-[ring_1.2s_ease-in-out_infinite]" />
  );
  return <span className="text-sm font-semibold text-foreground">{getInitials(title)}</span>;
}

function getLogoColor(title: string) {
  return "bg-muted";
}

export function ServiceItem({
  service,
  staggerOffset = 0,
}: {
  service: Service;
  staggerOffset?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fallbackAmount = service.title.toLowerCase().includes("ar shagun")
    ? 999
    : service.title.toLowerCase().includes("google meet")
      ? 1999
      : 0;
  const displayAmount = service.amount > 0 ? service.amount : fallbackAmount;
  const slideshowImages = getSlideshowImages(service.title);
  const isFloorPlanRequired = isFloorPlanRequiredService(service);
  const recommendCount = getRecommendationCount(service.title);

  const content = (
    <div className="relative">
      {displayAmount > 0 && (
        <span className="absolute -top-3 right-3 z-10 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md tracking-wide">
          ₹{displayAmount.toLocaleString("en-IN")}
        </span>
      )}
      <button
        onClick={() => setDialogOpen(true)}
        className={cn(
          "w-full text-left group flex items-center gap-4 rounded-xl border border-border/50 p-3.5 sm:p-4",
          "transition-all duration-200 hover:border-border hover:bg-accent/50 cursor-pointer"
        )}
      >
        {slideshowImages ? (
          <ServiceSlideshow
            images={slideshowImages}
            title={service.title}
            staggerOffset={staggerOffset}
          />
        ) : (
          /* Standard Image / Logo */
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl",
              !service.image_url || imgError
                ? getLogoColor(service.title)
                : "bg-muted"
            )}
          >
            {service.image_url && !imgError ? (
              <img
                src={service.image_url}
                alt={service.title}
                className="size-full object-cover"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              getServiceIcon(service.title)
            )}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">
              {service.title}
            </p>
            {isFloorPlanRequired && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase">
                📐 Floor Plan Required
              </span>
            )}
          </div>
          {service.description && (
            <p className="mt-1 text-xs text-muted-foreground whitespace-normal leading-relaxed">
              {service.description}
            </p>
          )}
          {recommendCount && (
            <div className="mt-1.5 flex items-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium tracking-tight">
                <Sparkles className="size-2.5 text-amber-500 shrink-0" />
                Recommended by {recommendCount} Users
              </span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );

  return (
    <>
      {content}
      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={service}
      />
    </>
  );
}
