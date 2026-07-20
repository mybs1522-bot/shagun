"use client";

import { Download, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book } from "@/features/books/types";
import { supabase } from "@/lib/supabase";

export function BookDialog({
  open,
  onClose,
  book,
}: {
  open: boolean;
  onClose: () => void;
  book: Book | null;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
              onClose();
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
        onClose();
        // Redirect to the book link in a new tab
        window.open(book.link, "_blank");
        // Reset form
        setEmail("");
        setPhone("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {book && book.price > 0 ? `Get E-Book — ₹${book.price}` : "Download Free Book"}
          </DialogTitle>
          <DialogDescription>
            {book && book.price > 0 ? (
              <>
                Enter your details below to purchase{" "}
                <span className="font-semibold text-foreground">
                  {book.title}
                </span>
                .
              </>
            ) : (
              <>
                Enter your details below to get access to{" "}
                <span className="font-semibold text-foreground">
                  {book?.title}
                </span>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="lead-email">Email Address</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone">Phone Number</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : book && book.price > 0 ? (
              "Pay & Download"
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Get Free Access
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
