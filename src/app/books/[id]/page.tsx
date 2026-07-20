"use client";

import { ArrowLeft, BookOpen, Download, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
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
        // Save the lead immediately before payment as 'pending'
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

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: book.price * 100,
          currency: "INR",
          name: "Ar Shagun",
          description: book.title,
          order_id: data.orderId,
          handler: async function (response: any) {
            // Update the existing record to 'completed'
            const { error } = await supabase
              .from("book_leads")
              .update({ 
                payment_status: 'completed',
                paid_at: new Date().toISOString()
              })
              .eq("id", leadId);

            if (error) {
              toast.error("Payment successful, but failed to save entry.");
              console.error(error);
            } else {
              toast.success("Payment successful! Redirecting...");
              window.location.href = `/thank-you?type=book&bookId=${book.id}&leadId=${leadId}`;
            }
          },
          prefill: {
            email: email.trim(),
            contact: phone.trim(),
          },
          theme: {
            color: "#10b981", // emerald-500
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
        // Redirect to the book link in a new tab
        window.open(book.link, "_blank");
        // Reset form
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
        <h1 className="text-2xl font-bold">Book Not Found</h1>
        <p className="text-muted-foreground">The book you are looking for does not exist or has been removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to Profile
        </Link>
      </div>
    );
  }

  const isPaid = book.price > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>

        {/* Dynamic Detail Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-muted/5 overflow-hidden relative">
          
          {/* Cover image area */}
          <div className="md:col-span-4 flex flex-col items-center justify-start gap-4">
            {book.thumbnail_url ? (
              <div className="relative aspect-[3/4] w-48 sm:w-56 overflow-hidden rounded-2xl border border-border/80 shadow-lg shadow-black/10">
                <Image
                  src={book.thumbnail_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-[3/4] w-48 sm:w-56 flex flex-col items-center justify-center rounded-2xl border border-border bg-muted shadow-sm">
                <BookOpen className="size-12 text-muted-foreground/60 mb-2" />
                <span className="text-xs text-muted-foreground font-medium">No Cover Available</span>
              </div>
            )}

            {/* Price Pill */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <Sparkles className="size-4 shrink-0" />
              <span>{isPaid ? `₹${book.price.toLocaleString("en-IN")}` : "FREE DOWNLOAD"}</span>
            </div>
          </div>

          {/* Book detail details */}
          <div className="md:col-span-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {book.title}
              </h1>

              {book.description ? (
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm sm:text-base italic">
                  Explore the details and insights from Ar. Shagun Yadav in this premium E-Book publication. Get instant access by filling out your details.
                </p>
              )}
            </div>

            {/* Contact details for transaction */}
            <div className="border border-border/50 bg-muted/30 rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="font-bold text-sm tracking-wide text-foreground uppercase">
                {isPaid ? "Unlock E-Book" : "Get Free Access"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-email" className="text-xs font-semibold text-muted-foreground">Email Address</Label>
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
                    <Label htmlFor="cust-phone" className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
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
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>Secure checkout powered by Razorpay.</span>
                </div>
              )}
            </div>

          </div>

        </div>
        
      </div>
    </div>
  );
}
