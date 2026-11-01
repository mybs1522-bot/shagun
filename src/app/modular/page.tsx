"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bath,
  CheckCircle2,
  ChefHat,
  Clock,
  DoorClosed,
  Factory,
  Flame,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  Tv,
  User,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { ChanhDaiMark } from "@/components/chanhdai-mark";
import { Footer } from "@/components/footer";
import { ToggleTheme } from "@/components/toggle-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER } from "@/data/user";
import { VerifiedIcon } from "@/features/profile/components/verified-icon";

const MODULAR_COLLECTIONS = [
  {
    id: "kitchens",
    title: "Luxury Modular Kitchens",
    tagline: "German Hardware • 100% Boiling Water Proof (BWP)",
    image: "/images/services/kitchen/kitchen-1.webp",
    icon: ChefHat,
    description:
      "Engineered with anti-scratch quartz countertops, soft-close tandem boxes, and seamless acrylic/PU finishes. Zero warping, termite-proof, and designed for heavy Indian cooking.",
    highlights: [
      "German soft-close drawer channels",
      "Seamless laser edge-banding (No peeling)",
      "High-grade BWP Marine Ply (IS 710)",
      "Ergonomic counter & pull-out pantry zoning",
    ],
  },
  {
    id: "wardrobes",
    title: "Precision Modular Wardrobes",
    tagline: "Floor-to-Ceiling • Walk-In & Sliding Systems",
    image: "/images/services/bedroom/bedroom-1.webp",
    icon: DoorClosed,
    description:
      "Bespoke wardrobes featuring floor-to-ceiling sliding panels, tinted fluted glass, integrated sensor LED illumination, and custom velvet jewelry organizers.",
    highlights: [
      "Silent whisper-glide sliding mechanisms",
      "Lacquered glass & fluted wood finishes",
      "Internal sensor LED lighting profiles",
      "Customized his-and-hers storage division",
    ],
  },
  {
    id: "vanity",
    title: "Luxury Bathroom Vanities",
    tagline: "100% Waterproof Marine Core • Floating Consoles",
    image: "/images/services/washroom/washroom-1.webp",
    icon: Bath,
    description:
      "Moisture-impermeable floating vanity units paired with seamless quartz/ceramic under-mount basins, anti-fog touch LED mirrors, and hidden plumbing channels.",
    highlights: [
      "100% Waterproof HDHMR & Marine Grade core",
      "Anti-fog smart touch LED mirror pairing",
      "Wall-hung floating moisture-safe architecture",
      "Concealed drain trap & sanitary routing",
    ],
  },
  {
    id: "tv-units",
    title: "Designer TV & Media Consoles",
    tagline: "Acoustic Slat Paneling • Concealed Cabling",
    image: "/images/services/living/living-1.webp",
    icon: Tv,
    description:
      "Statement living room entertainment backdrops featuring fluted acoustic wooden slats, ambient halo backlighting, and floating consoles with 100% wire concealment.",
    highlights: [
      "Fluted acoustic charcoal & wooden louvers",
      "Integrated warm indirect LED backlighting",
      "Zero visible cables or power cords",
      "Floating consoles with soft-touch doors",
    ],
  },
];

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
    "Wardrobes",
    "Bathroom Vanity",
    "TV Units",
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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product category");
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-grid bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3.5 sm:px-6">
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
            <Button
              size="default"
              onClick={scrollToForm}
              className="text-xs h-8 rounded-full font-semibold max-sm:hidden"
            >
              Get Free Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-3.5 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <div className="space-y-4 sm:space-y-6 text-center max-w-3xl mx-auto px-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-primary">
            <Factory className="size-3.5 shrink-0" />
            <span>Factory Direct Modular Joinery • Precision German Engineering</span>
          </div>

          <h1 className="font-heading text-2xl xs:text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight sm:leading-[1.15]">
            Get Factory-Made Luxury{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              Kitchens, Wardrobes, Vanities &amp; TV Units
            </span>
          </h1>

          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Engineered with German CNC laser-precision machinery and certified waterproof materials.
            Zero on-site carpentry delays, guaranteed 21-day delivery, and transparent factory rates.
          </p>
        </div>

        {/* Hero Form + Architect Endorsement Grid */}
        <div
          ref={formRef}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start scroll-mt-18"
        >
          {/* Right Column (Rendered First on Mobile for Instant Conversion) */}
          <div className="order-1 lg:order-2 lg:col-span-7 rounded-2xl sm:rounded-3xl border-2 border-primary/30 bg-card p-4 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Free Factory Estimate
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
                {/* Mobile Architect Endorsement Micro-Pill */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-grid lg:hidden">
                  <div className="relative size-10 shrink-0 rounded-full overflow-hidden ring-1 ring-primary/30">
                    <Image
                      src={USER.avatar}
                      alt={USER.displayName}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                      <span>{USER.displayName}</span>
                      <VerifiedIcon className="size-3 text-[#155dfc] dark:text-[#3b82f6]" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Curated &amp; Supervised Factory Precision
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Get Instant Factory Quotation Details
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Select your required units and enter your contact details below to receive an itemized factory price estimate.
                  </p>
                </div>

                {/* Product Multi-select Chips */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Select units required:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PRODUCTS.map((prod) => {
                      const isSelected = selectedProducts.includes(prod);
                      return (
                        <button
                          key={prod}
                          type="button"
                          onClick={() => toggleProduct(prod)}
                          className={`flex items-center gap-2 rounded-xl border p-2.5 min-h-[44px] text-xs font-medium transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                              : "border-border/70 bg-background text-muted-foreground hover:border-foreground/30"
                          }`}
                        >
                          <div
                            className={`flex size-4 shrink-0 items-center justify-center rounded-md border ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected ? <CheckCircle2 className="size-3" /> : null}
                          </div>
                          <span className="truncate">{prod}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Phone Inputs */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="lead-name" className="text-xs font-semibold">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="lead-phone" className="text-xs font-semibold">
                      Phone Number <span className="text-destructive">*</span>
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
                      You will receive your quotation details shortly.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lead-city" className="text-xs font-semibold">
                      City / Location <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="lead-city"
                      placeholder="e.g. Delhi NCR, Gurgaon, Noida, Bangalore..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10 rounded-xl text-base sm:text-sm bg-background border-border"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 space-y-2.5">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg transition-all active:scale-[0.99]"
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

                  <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <Lock className="size-3 text-emerald-500" />
                      <span>100% Privacy. Zero Spam Guarantee.</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Flame className="size-3 text-amber-500" />
                      <span>Free 3D Layout Consultation Included</span>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Left Column (Desktop 5 Cols / Mobile placed right after form) */}
          <div className="order-2 lg:order-1 lg:col-span-5 rounded-2xl sm:rounded-3xl border border-grid bg-card p-5 sm:p-7 space-y-5 sm:space-y-6 shadow-sm">
            {/* Architect Header */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="relative size-14 sm:size-20 shrink-0 rounded-2xl overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <Image
                  src={USER.avatar}
                  alt={USER.displayName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 font-heading text-base sm:text-lg font-bold text-foreground">
                  <span>{USER.displayName}</span>
                  <VerifiedIcon className="size-4 text-[#155dfc] dark:text-[#3b82f6] shrink-0" />
                </div>
                <p className="text-[11px] sm:text-xs font-mono text-muted-foreground">
                  Founder &amp; Lead Architect, ArchBySha
                </p>
                <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-500">
                  <ShieldCheck className="size-3.5" />
                  <span>Quality Supervised</span>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="relative rounded-xl sm:rounded-2xl bg-muted/50 p-3.5 sm:p-4 text-xs sm:text-sm text-foreground/90 italic leading-relaxed border border-border/60">
              &ldquo;Traditional on-site carpentry results in uneven finishes, 3+ months of noisy sawdust, and hidden contractor markups. Our automated factory guarantees 0.1mm CNC precision, German soft-close fittings, and complete peace of mind.&rdquo;
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              <div className="rounded-xl border border-grid bg-background p-2.5 sm:p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Zap className="size-3.5 text-amber-500" />
                  <span>Save 25-35%</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                  Direct factory rate vs retail showrooms
                </p>
              </div>

              <div className="rounded-xl border border-grid bg-background p-2.5 sm:p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-blue-500" />
                  <span>21-Day Delivery</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                  Quick on-site modular installation
                </p>
              </div>

              <div className="rounded-xl border border-grid bg-background p-2.5 sm:p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>10-Yr Warranty</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                  On BWP Marine Core &amp; hardware
                </p>
              </div>

              <div className="rounded-xl border border-grid bg-background p-2.5 sm:p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-purple-500" />
                  <span>Free 3D Layout</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                  Curated by Ar. Shagun&apos;s studio
                </p>
              </div>
            </div>

            {/* Client Social Proof */}
            <div className="flex items-center gap-2.5 sm:gap-3 pt-2 border-t border-grid text-xs text-muted-foreground">
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                <div className="inline-block size-7 rounded-full ring-2 ring-background bg-zinc-200 overflow-hidden">
                  <Image src="/images/reviews/shadcn.webp" alt="Client" width={28} height={28} />
                </div>
                <div className="inline-block size-7 rounded-full ring-2 ring-background bg-zinc-200 overflow-hidden">
                  <Image src="/images/reviews/guillermo-rauch.webp" alt="Client" width={28} height={28} />
                </div>
                <div className="inline-block size-7 rounded-full ring-2 ring-background bg-zinc-200 overflow-hidden">
                  <Image src="/images/reviews/lee-robinson.webp" alt="Client" width={28} height={28} />
                </div>
              </div>
              <div className="text-[11px] sm:text-xs leading-tight">
                <span className="font-semibold text-foreground">500+ Homes</span> Furnished with 4.9★ rating
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Modular Offerings Showcase */}
        <section className="space-y-6 sm:space-y-8 pt-4 sm:pt-6">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto px-2">
            <h2 className="font-heading text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Crafted in Our High-Tech Automated Facility
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Every cabinet, hinge, and panel is cut using German CNC beam saws and edge-banders with 0.1mm tolerance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {MODULAR_COLLECTIONS.map((col) => {
              const IconComp = col.icon;
              return (
                <div
                  key={col.id}
                  className="group rounded-2xl sm:rounded-3xl border border-grid bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col"
                >
                  {/* Image Banner */}
                  <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-muted">
                    <Image
                      src={col.image}
                      alt={col.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-md">
                          <IconComp className="size-4 sm:size-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-heading text-base sm:text-lg font-bold leading-tight">
                            {col.title}
                          </h3>
                          <span className="text-[10px] sm:text-[11px] text-white/80 font-mono">
                            {col.tagline}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {col.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-grid">
                      <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Key Specifications:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                        {col.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-foreground/90">
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug text-[11px] sm:text-xs">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={scrollToForm}
                        className="w-full rounded-xl text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all h-9 sm:h-10"
                      >
                        <span>Get Quote for {col.title}</span>
                        <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Factory-Made vs Local Carpenter Comparison */}
        <section className="rounded-2xl sm:rounded-3xl border border-grid bg-card p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto px-1">
            <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10 text-[11px]">
              The Smarter Choice
            </Badge>
            <h2 className="font-heading text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Factory Precision vs Traditional Carpenter
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              See why modern homeowners insist on factory modular fabrication over hand-made site carpentry.
            </p>
          </div>

          {/* Swipe indicator on phone */}
          <div className="block sm:hidden text-center text-[11px] font-mono text-muted-foreground">
            ← Scroll horizontally to compare →
          </div>

          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
              <thead className="border-b border-grid text-muted-foreground font-mono text-[10px] sm:text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Parameters</th>
                  <th className="py-2.5 px-3 text-emerald-500 font-bold bg-emerald-500/5 rounded-t-xl">
                    🏭 Our Factory-Made Modular
                  </th>
                  <th className="py-2.5 px-3 text-muted-foreground">
                    🔨 Local Carpenter
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grid">
                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">
                    Edge Banding &amp; Waterproofing
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/5 text-xs sm:text-sm">
                    Seamless 200°C PUR hot-melt laser edge banding (Zero water ingress)
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs sm:text-sm">
                    Hand-glued tape with Fevicol; peels off within 1-2 years
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">
                    Cutting Precision
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/5 text-xs sm:text-sm">
                    CNC Beam Saw with 0.1 mm precision alignment
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs sm:text-sm">
                    Manual hand saw; uneven edges and mismatched gaps
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">
                    Site Disruption &amp; Dust
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/5 text-xs sm:text-sm">
                    Zero dust! Pre-assembled panels simply bolted in 2-3 days
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs sm:text-sm">
                    2 to 3 months of toxic chemical smells, sawdust, and daily noise
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">
                    Warranty &amp; Service
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/5 text-xs sm:text-sm">
                    10-Year Written Warranty on Marine Ply &amp; German Hinges
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs sm:text-sm">
                    Zero warranty; carpenter stops answering calls after payment
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">
                    Cost &amp; Transparency
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/5 text-xs sm:text-sm">
                    Direct factory rates with itemized Bill of Quantities (BOQ)
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs sm:text-sm">
                    Hidden hardware markups and recurring &quot;extra material&quot; demands
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 Step Process */}
        <section className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-1.5 px-1">
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              From concept to installation in 3 effortless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="rounded-2xl border border-grid bg-card p-4 sm:p-5 space-y-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                1. Share Name &amp; Contact
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fill the simple form above with your required units (Kitchen, Wardrobes, Vanity, TV unit).
              </p>
            </div>

            <div className="rounded-2xl border border-grid bg-card p-4 sm:p-5 space-y-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                2. Custom Quotation &amp; Lookbook
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ar. Shagun&apos;s team prepares customized modular lookbooks, material options, and transparent factory prices delivered directly to you.
              </p>
            </div>

            <div className="rounded-2xl border border-grid bg-card p-4 sm:p-5 space-y-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                3. Factory Build &amp; 21-Day Setup
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Precision CNC manufacturing and clean modular assembly at your site with a 10-year warranty.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Banner CTA */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 p-5 sm:p-10 text-center space-y-3.5 sm:space-y-4">
          <h2 className="font-heading text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Ready to Upgrade to Factory-Made Interiors?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Avoid on-site carpentry delays and hidden vendor markups. Get your custom factory quotation &amp; 3D layout consultation today.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="w-full sm:w-auto rounded-full font-bold px-7 h-11 text-xs sm:text-sm bg-primary text-primary-foreground shadow-md"
            >
              <span>Get Free Quotation Details</span>
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full text-xs font-mono h-11"
            >
              <a href="mailto:hello@archbysha.com">
                <span>hello@archbysha.com</span>
              </a>
            </Button>
          </div>
        </div>
      </main>

      {/* Floating Bottom Quick-Action Bar on Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-background/95 backdrop-blur-md border-t border-grid sm:hidden">
        <Button
          onClick={scrollToForm}
          className="w-full rounded-full font-bold h-12 text-sm bg-primary text-primary-foreground shadow-lg active:scale-98 transition-all"
        >
          <span>Get Free Factory Quotation</span>
          <ArrowRight className="size-4 ml-1.5" />
        </Button>
      </div>

      {/* Footer */}
      <div className="pb-18 sm:pb-0">
        <Footer />
      </div>
    </div>
  );
}
