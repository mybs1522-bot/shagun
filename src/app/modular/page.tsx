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
  Sparkles,
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

const MODULAR_DESIGNS = [
  // Set 1: Kitchens, Wardrobes, Vanities, TV Units
  {
    id: "k-1",
    category: "Kitchens",
    title: "Luxury Island Kitchen",
    image: "/images/services/kitchen/kitchen-1.webp",
  },
  {
    id: "w-1",
    category: "Wardrobes",
    title: "Fluted Glass Sliding Wardrobe",
    image: "/images/services/bedroom/bedroom-1.webp",
  },
  {
    id: "v-1",
    category: "Bathroom Vanity",
    title: "Floating Fluted Vanity",
    image: "/images/services/washroom/washroom-1.webp",
  },
  {
    id: "t-1",
    category: "TV Units",
    title: "Acoustic Slat TV Console",
    image: "/images/services/living/living-1.webp",
  },

  // Set 2
  {
    id: "k-2",
    category: "Kitchens",
    title: "Modern Acrylic Kitchen",
    image: "/images/services/kitchen/kitchen-2.webp",
  },
  {
    id: "w-2",
    category: "Wardrobes",
    title: "Floor-to-Ceiling Wardrobe",
    image: "/images/services/bedroom/bedroom-2.webp",
  },
  {
    id: "v-2",
    category: "Bathroom Vanity",
    title: "Double Basin Vanity",
    image: "/images/services/washroom/washroom-2.webp",
  },
  {
    id: "t-2",
    category: "TV Units",
    title: "Ambient Backlit TV Wall",
    image: "/images/services/living/living-2.webp",
  },

  // Set 3
  {
    id: "k-3",
    category: "Kitchens",
    title: "Minimalist Matte Kitchen",
    image: "/images/services/kitchen/kitchen-3.webp",
  },
  {
    id: "w-3",
    category: "Wardrobes",
    title: "Walk-In Wardrobe Suite",
    image: "/images/services/bedroom/bedroom-3.webp",
  },
  {
    id: "v-3",
    category: "Bathroom Vanity",
    title: "Seamless Quartz Vanity",
    image: "/images/services/washroom/washroom-3.webp",
  },
  {
    id: "t-3",
    category: "TV Units",
    title: "Floating Media Console",
    image: "/images/services/living/living-3.webp",
  },

  // Set 4
  {
    id: "k-4",
    category: "Kitchens",
    title: "Contemporary Parallel Kitchen",
    image: "/images/services/kitchen/kitchen-4.webp",
  },
  {
    id: "w-4",
    category: "Wardrobes",
    title: "Lacquered Glass Wardrobe",
    image: "/images/services/bedroom/bedroom-4.webp",
  },
  {
    id: "v-4",
    category: "Bathroom Vanity",
    title: "Compact Powder Vanity",
    image: "/images/services/washroom/washroom-4.webp",
  },
  {
    id: "t-4",
    category: "TV Units",
    title: "Marble & Charcoal TV Wall",
    image: "/images/services/living/living-4.webp",
  },

  // Set 5
  {
    id: "k-5",
    category: "Kitchens",
    title: "Handleless Modular Kitchen",
    image: "/images/services/kitchen/kitchen-5.webp",
  },
  {
    id: "w-5",
    category: "Wardrobes",
    title: "Sensor LED Wardrobe",
    image: "/images/services/bedroom/bedroom-5.webp",
  },
  {
    id: "v-5",
    category: "Bathroom Vanity",
    title: "Smart Touch LED Vanity",
    image: "/images/services/washroom/washroom-5.webp",
  },
  {
    id: "t-5",
    category: "TV Units",
    title: "Concealed Cable Console",
    image: "/images/services/living/living-5.webp",
  },

  // Set 6
  {
    id: "k-6",
    category: "Kitchens",
    title: "Quartz Finish Kitchen",
    image: "/images/services/kitchen/kitchen-6.webp",
  },
  {
    id: "w-6",
    category: "Wardrobes",
    title: "Oak Wood Finish Wardrobe",
    image: "/images/services/bedroom/bedroom-6.webp",
  },
  {
    id: "v-6",
    category: "Bathroom Vanity",
    title: "Master Bath Luxury Vanity",
    image: "/images/services/washroom/washroom-6.webp",
  },
  {
    id: "t-6",
    category: "TV Units",
    title: "Grand Living Media Unit",
    image: "/images/services/living/living-6.webp",
  },
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
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const handleSelectDesign = (category: string) => {
    if (!selectedProducts.includes(category)) {
      setSelectedProducts((prev) => [...prev, category]);
    }
    toast.success(`Selected ${category} in quotation form`);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
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
      {/* Inline styles for smooth infinite marquee track */}
      <style>{`
        @keyframes modularMarqueeAnimation {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .modular-marquee-track {
          display: flex;
          width: max-content;
          animation: modularMarqueeAnimation 46s linear infinite;
        }
        .modular-marquee-track.paused {
          animation-play-state: paused !important;
        }
      `}</style>

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
      <main className="mx-auto w-full max-w-4xl px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 flex-1">
        {/* Hero Section */}
        <div className="space-y-3 sm:space-y-4 text-center max-w-2xl mx-auto px-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-[11px] sm:text-xs font-medium text-foreground">
            <Factory className="size-3.5 shrink-0 text-primary" />
            <span>Factory Direct Modular Joinery • Precision German Engineering</span>
          </div>

          <h1 className="font-heading text-2xl xs:text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.2]">
            Get Factory-Made Luxury Kitchens, Wardrobes, Vanities &amp; TV Units
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Skip 30–40% showroom markups and months of noisy carpentry delays.
            Get German CNC precision, 100% waterproof modular interiors delivered in 21 days with a 10-year warranty. Lock in your factory-direct quotation &amp; free 3D layout consultation today.
          </p>
        </div>

        {/* 24 Scrolling Modular Designs (Rounded Corner Squares) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground max-w-xl mx-auto">
            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
              <Sparkles className="size-3.5 text-primary" />
              <span>Factory Designs Showcase (24 Units)</span>
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground">
              Tap any to select
            </span>
          </div>

          {/* Marquee Track Container with Gradient Edge Fades */}
          <div
            className="relative overflow-hidden group select-none -mx-3.5 sm:-mx-6 px-1"
            onTouchStart={() => setIsMarqueePaused(true)}
            onTouchEnd={() => setIsMarqueePaused(false)}
            onMouseEnter={() => setIsMarqueePaused(true)}
            onMouseLeave={() => setIsMarqueePaused(false)}
          >
            {/* Left and Right Fade Overlays */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16 bg-gradient-to-l from-background to-transparent" />

            {/* Scrolling Track */}
            <div
              className={`modular-marquee-track flex gap-2 sm:gap-3 md:gap-4 py-1 ${
                isMarqueePaused ? "paused" : ""
              }`}
            >
              {/* Loop duplicated twice for seamless infinite scroll */}
              {[...MODULAR_DESIGNS, ...MODULAR_DESIGNS].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => handleSelectDesign(item.category)}
                  className="group relative size-20 sm:size-32 md:size-36 shrink-0 aspect-square rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-border/80 bg-card shadow-xs cursor-pointer transition-all hover:scale-[1.04] hover:shadow-md hover:border-primary/60"
                  title={`Tap to select ${item.category} in quote form`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 80px, 144px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-1.5 sm:p-2.5">
                    <span className="text-[9px] sm:text-[11px] font-bold text-white leading-tight truncate">
                      {item.title}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-mono text-white/80">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funnel Callout Guiding Attention Directly to Form */}
        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/15 px-3.5 py-1 text-xs font-semibold text-primary transition-all shadow-xs cursor-pointer"
          >
            <span>Enter Your Requirements Below</span>
            <ArrowRight className="size-3.5 rotate-90 text-primary animate-pulse" />
          </button>
        </div>

        {/* Quotation Form Card (Highlighted) */}
        <div
          ref={formRef}
          className="mx-auto max-w-xl rounded-2xl sm:rounded-3xl border-2 border-primary/40 dark:border-primary/50 bg-card p-5 sm:p-8 shadow-2xl shadow-blue-500/15 ring-4 ring-primary/10 dark:ring-primary/20 relative overflow-hidden transition-all"
        >
          {/* Top Accent Gradient Bar */}
          <div className="absolute top-0 inset-x-0 h-1 sm:h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

          {/* Top Badge with Pulsing Live Beacon */}
          <div className="absolute top-0 right-0 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span>FREE FACTORY ESTIMATE</span>
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
              <div className="space-y-1.5 pr-28 sm:pr-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <span className="size-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  <span>Factory Quotation Portal</span>
                </div>
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
              Principal Architect &amp; Modular Designer
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
