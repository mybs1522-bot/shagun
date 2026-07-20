"use client";

// Thank You Page Component for Bookings and Purchases

import { CheckCircle2, Calendar, Clock, ArrowLeft, Download, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { Book } from "@/features/books/types";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const bookId = searchParams.get("bookId");
  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");

  const [book, setBook] = useState<Book | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);

  useEffect(() => {
    if (type === "book" && bookId) {
      const fetchBook = async () => {
        setLoadingBook(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .single();

        if (error) {
          console.error("Error fetching book details:", error);
        } else {
          setBook(data as Book);
        }
        setLoadingBook(false);
      };
      fetchBook();
    }
  }, [type, bookId]);

  const formattedDate = dateParam ? dayjs(dateParam).format("MMMM D, YYYY") : null;
  const isBook = type === "book";

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
          {isBook 
            ? "Your payment was successful. You can download your E-Book below." 
            : "You will receive a call at your selected time."}
        </p>

        {/* E-Book download details card */}
        {isBook && (
          <div className="w-full bg-muted/40 border border-border/30 rounded-2xl p-4 mb-6 text-left">
            {loadingBook ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : book ? (
              <div className="flex gap-4">
                {book.thumbnail_url ? (
                  <div className="relative h-24 w-16 overflow-hidden rounded border border-border/80 shrink-0 shadow-sm">
                    <Image
                      src={book.thumbnail_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-16 items-center justify-center rounded border border-border/80 bg-muted shrink-0">
                    <BookOpen className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col justify-center gap-1.5 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  {book.pdf_url || book.link ? (
                    <a
                      href={book.pdf_url || book.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Download className="size-3.5" />
                      Download PDF
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No download file available</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Failed to load book details.
              </p>
            )}
          </div>
        )}

        {/* Appointment details summary card */}
        {!isBook && formattedDate && timeParam && (
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

        {isBook && book && (book.pdf_url || book.link) && (
          <a
            href={book.pdf_url || book.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-[0.98] cursor-pointer mb-3"
          >
            <Download className="size-4" />
            Download E-Book
          </a>
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
