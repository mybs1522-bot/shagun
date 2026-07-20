"use client";

import { ArrowLeft, BookOpen, Download, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book } from "@/features/books/types";
import { supabase } from "@/lib/supabase";

export default function BookDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  const [formInView, setFormInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const formRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setFormInView(entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch book details
  useEffect(() => {
    if (!id) return;
    const fetchBook = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Failed to load book details");
      } else {
        setBook(data as Book);
      }
      setLoading(false);
    };

    fetchBook();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!email.trim() || !phone.trim()) {
      toast.error("Please enter your email and phone number");
      return;
    }

    setSubmitting(true);
    const isPaymentRequired = book.price > 0;

    if (isPaymentRequired) {
      const leadId = crypto.randomUUID();
      try {
        await supabase.from("book_leads").insert({
          id: leadId,
          email: email.trim(),
          phone: phone.trim(),
          book_id: book.id,
          payment_status: 'pending'
        });

        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: book.price }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        // Save order_id to database lead
        await supabase
          .from("book_leads")
          .update({ razorpay_order_id: data.orderId })
          .eq("id", leadId);

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: book.price * 100,
          currency: "INR",
          name: "Ar Shagun",
          description: book.title,
          order_id: data.orderId,
          handler: async function (response: any) {
            setSubmitting(true);
            try {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  leadId: leadId,
                  type: "book",
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error);

              toast.success("Payment successful! Redirecting...");
              window.location.href = `/thank-you?type=book&bookId=${book.id}&leadId=${leadId}`;
            } catch (err: any) {
              console.error("Verification failed:", err);
              toast.error("Payment verified, redirecting to downloads...");
              window.location.href = `/thank-you?type=book&bookId=${book.id}&leadId=${leadId}`;
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            email: email.trim(),
            contact: phone.trim(),
          },
          theme: {
            color: "#10b981",
          },
          modal: {
            ondismiss: function() {
              setSubmitting(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error(err);
        toast.error("Failed to initialize payment.");
        setSubmitting(false);
      }
    } else {
      const { error } = await supabase.from("book_leads").insert({
        email: email.trim(),
        phone: phone.trim(),
        book_id: book.id,
        payment_status: 'none'
      });

      setSubmitting(false);

      if (error) {
        toast.error("An error occurred. Please try again.");
        console.error(error);
      } else {
        toast.success("Success! Redirecting you to the book...");
        window.open(book.link, "_blank");
        setEmail("");
        setPhone("");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-black dark:text-white">Book Not Found</h1>
        <p className="text-neutral-600 dark:text-neutral-400">The book you are looking for does not exist or has been removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to Profile
        </Link>
      </div>
    );
  }

  const isPaid = book.price > 0;
  const previews = book.preview_images?.filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>

        {/* Main Detail Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-muted/5 overflow-hidden relative">
          
          {/* Cover image area — 9:16 aspect ratio */}
          <div className="md:col-span-5 flex flex-col items-center justify-start gap-4">
            {book.thumbnail_url ? (
              <div className="relative aspect-[9/16] w-48 sm:w-56 overflow-hidden rounded-2xl border border-border/80 shadow-lg shadow-black/10">
                <Image
                  src={book.thumbnail_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 192px, 224px"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-[9/16] w-48 sm:w-56 flex flex-col items-center justify-center rounded-2xl border border-border bg-muted shadow-sm">
                <BookOpen className="size-12 text-neutral-400 mb-2" />
                <span className="text-xs text-neutral-500 font-medium">No Cover Available</span>
              </div>
            )}

            {/* Price Display with Glassmorphism */}
            <div className="w-full max-w-[224px] mt-2 rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md px-4 py-3 text-center shadow-lg shadow-black/5">
              {isPaid ? (
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    Price
                  </div>
                  <div className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
                    ₹{book.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[9px] font-medium tracking-wide text-neutral-400 dark:text-neutral-500 uppercase">
                    One-time payment
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 py-1">
                  <Sparkles className="size-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-sans">Free Download</span>
                </div>
              )}
            </div>

            {/* Preview pages below the price in Column 1 */}
            {previews.length > 0 && (
              <div className="w-full max-w-[224px] space-y-2 mt-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400 text-center">
                  Preview Pages
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {previews.slice(0, 4).map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewOpen(url)}
                      className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border/80 bg-muted shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <Image
                        src={url}
                        alt={`Preview page ${idx + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="60px"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Book details */}
          <div className="md:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white leading-tight">
                {book.title}
              </h1>

              {book.description ? (
                <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              ) : (
                <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base italic">
                  Explore the details and insights from Ar. Shagun Yadav in this premium E-Book publication. Get instant access by filling out your details.
                </p>
              )}
            </div>



            {/* Contact form */}
            <div id="download-form" ref={formRef} className="scroll-mt-24 border border-border/50 bg-muted/30 rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="font-bold text-sm tracking-wide text-black dark:text-white uppercase">
                {isPaid ? "Download E-Book" : "Get Free Access"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-email" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Email Address</Label>
                    <Input
                      id="cust-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-phone" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Phone Number</Label>
                    <Input
                      id="cust-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="bg-background rounded-xl border-border/80"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className={`w-full h-11 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    isPaid 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10" 
                      : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-md"
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : isPaid ? (
                    `Pay ₹${book.price.toLocaleString("en-IN")} & Download`
                  ) : (
                    <>
                      <Download className="mr-2 size-4" />
                      Get Free E-Book
                    </>
                  )}
                </Button>
              </form>

              {isPaid && (
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>Secure checkout powered by Razorpay.</span>
                </div>
              )}
            </div>

          </div>

        </div>
        
      </div>

      {/* Fullscreen Preview Lightbox */}
      {previewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewOpen(null)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] mx-4">
            <Image
              src={previewOpen}
              alt="Preview page"
              width={600}
              height={800}
              className="w-full h-auto rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Sticky mobile CTA — hidden when form is in view */}
      {!formInView && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-background/80 backdrop-blur-md border-t border-border/50 md:hidden animate-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={() => {
              document.getElementById("download-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className={`w-full h-12 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
              isPaid
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <Download className="size-4" />
            {isPaid ? `Download E-Book — ₹${book.price.toLocaleString("en-IN")}` : "Download Free E-Book"}
          </button>
        </div>
      )}
    </div>
  );
}
