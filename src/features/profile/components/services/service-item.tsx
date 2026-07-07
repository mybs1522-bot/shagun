"use client";

import { ChevronRight, LayoutPanelTop, Package, Phone, Video } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/cn";

import { Service } from "../../types/services";
import { ServiceDialog } from "./service-dialog";

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


export function ServiceItem({ service }: { service: Service }) {
  const [imgError, setImgError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fallbackAmount = service.title.toLowerCase().includes("ar shagun") ? 999 : service.title.toLowerCase().includes("google meet") ? 1999 : 0;
  const displayAmount = service.amount > 0 ? service.amount : fallbackAmount;

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
          "w-full text-left group flex items-center gap-4 rounded-xl border border-border/50 p-4",
          "transition-all duration-200 hover:border-border hover:bg-accent/50 cursor-pointer"
        )}
      >
      {/* Image / Logo */}
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

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {service.title}
        </p>
        {service.description && (
          <p className="mt-1 text-xs text-muted-foreground whitespace-normal">
            {service.description}
          </p>
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
