"use client";

import { CheckCircle2, Calendar, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dayjs from "dayjs";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");

  const formattedDate = dateParam ? dayjs(dateParam).format("MMMM D, YYYY") : null;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 shadow-xl shadow-emerald-500/5">
        
        {/* Animated Check Icon */}
        <div className="relative flex size-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
          <CheckCircle2 className="size-10 relative z-10" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">
          Thank You!
        </h1>
        
        <p className="text-muted-foreground text-sm sm:text-base mb-6">
          You will receive a call at your selected time.
        </p>

        {/* Appointment details summary card */}
        {formattedDate && timeParam && (
          <div className="w-full bg-muted/40 border border-border/30 rounded-2xl p-4 mb-8 flex flex-col gap-3 text-left">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Booking details
            </p>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <Calendar className="size-4 text-emerald-500 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <Clock className="size-4 text-emerald-500 shrink-0" />
              <span>{timeParam}</span>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
