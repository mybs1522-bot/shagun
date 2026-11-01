"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Factory,
  Flame,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { ChanhDaiMark } from "@/components/chanhdai-mark";
import { Footer } from "@/components/footer";
import { ToggleTheme } from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER } from "@/data/user";
import { VerifiedIcon } from "@/features/profile/components/verified-icon";

const AVAILABLE_PRODUCTS = [
  "Kitchens",
  "Wardrobes",
  "Bathroom Vanity",
  "TV Units",
];

export default function ModularPage() {
  const formRef = useRef<HTMLDivElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    "Kitchens",
  ]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one unit you are looking for");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/modular/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          products: selectedProducts,
          city: city.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success("Quotation request submitted successfully!");

        // Cache submission locally for instant multi-device / tab synchronization
        try {
          const stored = JSON.parse(
            localStorage.getItem("my_modular_submissions") || "[]"
          );
          const submission = data.lead || {
            id: `client_${Date.now()}`,
            name: name.trim(),
            phone: phone.trim(),
            products: selectedProducts,
            city: city.trim() || undefined,
            status: "New",
            source: "modular_page",
            createdAt: new Date().toISOString(),
          };
          const updated = [
            submission,
            ...stored.filter((s: any) => s.id !== submission.id),
          ].slice(0, 20);
          localStorage.setItem(
            "my_modular_submissions",
            JSON.stringify(updated)
          );
        } catch {}
      } else {
        toast.error(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-grid bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Home</span>
          </Link>

          <Link href="/" aria-label="Ar. Shagun Home">
            <ChanhDaiMark className="h-7" />
          </Link>

          <div className="flex items-center gap-2">
            <ToggleTheme />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 space-y-6 sm:space-y-8 flex-1">
        {/* Hero Section (Matching Image 2) */}
        <div className="space-y-3 sm:space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-[11px] sm:text-xs font-medium text-foreground">
            <Factory className="size-3.5 shrink-0 text-primary" />
            <span>Factory Direct Modular Joinery • Precision German Engineering</span>
          </div>

          <h1 className="font-heading text-2xl xs:text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.2]">
            Get Factory-Made Luxury Kitchens, Wardrobes, Vanities &amp; TV Units
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Engineered with German CNC laser-precision machinery and certified waterproof materials.
            Zero on-site carpentry mess, guaranteed 21-day delivery, and direct factory pricing.
          </p>
        </div>

        {/* Quotation Form Card (Matching Image 1) */}
        <div
          ref={formRef}
          className="mx-auto max-w-xl rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-5 sm:p-8 shadow-xl relative overflow-hidden"
        >
          {/* Top Badge */}
          <div className="absolute top-0 right-0 bg-black text-white dark:bg-white dark:text-black font-mono text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            FREE FACTORY ESTIMATE
          </div>

          {submitted ? (
            /* Success State */
            <div className="py-6 sm:py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="mx-auto flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-2 px-2">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Quotation Request Received, {name}!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Thank you! We have received your details for{" "}
                  <strong className="text-foreground">{selectedProducts.join(", ")}</strong>.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium max-w-md mx-auto space-y-1">
                <div>✓ Requirements logged in our production queue</div>
                <div className="text-muted-foreground text-xs font-normal">
                  Ar. Shagun&apos;s modular engineering team will review your specs and reach out with complete quotation details shortly on{" "}
                  <span className="font-mono font-semibold text-foreground">{phone}</span>.
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setPhone("");
                  }}
                  className="rounded-full text-xs h-9 px-6 font-semibold"
                >
                  Submit Another Request
                </Button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1 pr-16 sm:pr-0">
                <h2 className="font-heading text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                  Get Instant Factory Quotation Details
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select the units you need and enter your contact details below to get an itemized factory price estimate.
                </p>
              </div>

              {/* What are you looking for? Multi-select */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold text-foreground">
                  What are you looking for? <span className="font-normal text-muted-foreground">(Select one or more)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {AVAILABLE_PRODUCTS.map((prod) => {
                    const isSelected = selectedProducts.includes(prod);
                    return (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => toggleProduct(prod)}
                        className={`flex items-center gap-2 sm:gap-2.5 rounded-xl border p-2.5 sm:p-3 min-h-[44px] text-xs sm:text-sm font-medium transition-all text-left ${
                          isSelected
                            ? "border-foreground/30 bg-muted/80 text-foreground font-semibold shadow-xs"
                            : "border-border/70 bg-background text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <div
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected ? (
                            <div className="size-1.5 rounded-full bg-background" />
                          ) : null}
                        </div>
                        <span className="truncate">{prod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <Label htmlFor="lead-name" className="text-xs font-semibold text-foreground">
                  Your Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="lead-name"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-9 h-11 rounded-xl text-base sm:text-sm bg-background border-border"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone" className="text-xs font-semibold text-foreground">
                  WhatsApp / Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="lead-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="pl-9 h-11 rounded-xl text-base sm:text-sm font-mono bg-background border-border"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  We will share the modular pricing sheets and design catalog on WhatsApp.
                </p>
              </div>

              {/* City / Location Input */}
              <div className="space-y-1.5">
                <Label htmlFor="lead-city" className="text-xs font-semibold text-foreground">
                  City / Location <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="lead-city"
                  placeholder="e.g. Delhi NCR, Gurgaon, Noida, Bangalore..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 rounded-xl text-base sm:text-sm bg-background border-border"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-sm sm:text-base font-bold bg-[#1d5bf0] hover:bg-[#154ecc] text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin mr-2" />
                  ) : (
                    <>
                      <span>Get Instant Quotation Details</span>
                      <ArrowRight className="size-4.5 ml-2" />
                    </>
                  )}
                </Button>

                {/* Trust Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-1.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <Lock className="size-3 text-emerald-500" />
                    <span>100% Privacy. Zero Spam Guarantee.</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Flame className="size-3 text-amber-500 fill-amber-500" />
                    <span>Free 3D Layout Consultation Included</span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Architect Name and Picture Just Below the Form */}
        <div className="flex items-center justify-center gap-3.5 pt-2 pb-2">
          <div className="relative size-12 sm:size-14 shrink-0 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-xs">
            <Image
              src={USER.avatar}
              alt={USER.displayName}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="text-left space-y-0.5">
            <div className="flex items-center gap-1.5 font-heading text-sm sm:text-base font-bold text-foreground">
              <span>{USER.displayName}</span>
              <VerifiedIcon className="size-4 text-[#155dfc] dark:text-[#3b82f6] shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">
              Principal Architect &amp; Factory Modular Director
            </p>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
              <span>Direct Factory Consultation &amp; Quality Supervision</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div>
        <Footer />
      </div>
    </div>
  );
}
