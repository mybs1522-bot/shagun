import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Mail,
  Palette,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { ChanhDaiMark } from "@/components/chanhdai-mark";
import { Footer } from "@/components/footer";
import { ToggleTheme } from "@/components/toggle-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USER } from "@/data/user";
import { VerifiedIcon } from "@/features/profile/components/verified-icon";

export const metadata: Metadata = {
  title: "About Ar. Shagun Yadav | Architect & Interior Designer",
  description:
    "Learn more about Ar. Shagun Yadav, founder of ArchBySha. Architectural planning, 3D interior design, budgeting estimations, and working hours.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-grid bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>

          <Link href="/" aria-label="Ar. Shagun Home">
            <ChanhDaiMark className="h-7" />
          </Link>

          <div className="flex items-center gap-2">
            <ToggleTheme />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
        {/* Profile Hero Header */}
        <div className="space-y-6 pb-8 border-b border-grid">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="size-24 sm:size-28 rounded-full overflow-hidden ring-2 ring-border ring-offset-2 ring-offset-background">
                <Image
                  src={USER.avatar}
                  alt={USER.displayName}
                  width={112}
                  height={112}
                  className="size-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/30 bg-primary/10 text-primary text-xs py-0.5 px-2.5 font-medium"
                >
                  <Sparkles className="size-3" />
                  Founder, ArchBySha
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs py-0.5 px-2.5 font-mono text-muted-foreground"
                >
                  India
                </Badge>
              </div>

              <h1 className="flex items-center gap-2 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                <span>{USER.displayName}</span>
                <VerifiedIcon className="size-6 text-[#155dfc] dark:text-[#3b82f6] shrink-0" />
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground font-mono">
                Architect • Interior Designer • ArchBIZ Consultant
              </p>
            </div>
          </div>
        </div>

        {/* Working Hours Highlight Banner */}
        <div className="my-8 rounded-2xl border border-border/80 bg-muted/40 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Studio Working Hours
                  </h2>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Available for booked 1-on-1 virtual design consultations and architectural reviews
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-xs">
              <Calendar className="size-4 text-primary" />
              <span className="font-mono">{USER.workingHours}</span>
              <span className="text-xs text-muted-foreground">(IST)</span>
            </div>
          </div>
        </div>

        {/* Detailed Story & Philosophy */}
        <div className="space-y-12 text-muted-foreground">
          {/* Detailed Introduction */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Introduction &amp; Architectural Journey
            </h2>
            <div className="space-y-3.5 text-sm sm:text-base leading-relaxed">
              <p>
                I am <strong className="text-foreground">Ar. Shagun Yadav</strong>, a professional Architect, Interior Designer, and the founder of <strong className="text-foreground">ArchBySha</strong>. With a focused background in contemporary spatial planning, interior architecture, and construction cost engineering, I dedicate my practice to bridging the gap between imaginative design concepts and practical, on-site reality.
              </p>
              <p>
                Over the course of my career, I have worked closely with homeowners, builders, and commercial clients to transform raw spaces and blueprints into breathtaking, functional environments. Whether designing a new residence from the ground up or renovating existing apartments, my approach is centered on making architectural excellence accessible, transparent, and financially stress-free.
              </p>
            </div>
          </section>

          {/* Design Philosophy */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Core Design Philosophy: Beauty Meets Financial Practicality
            </h2>
            <div className="space-y-3.5 text-sm sm:text-base leading-relaxed">
              <p>
                True architectural design is never just about generating photorealistic 3D renders that look impressive on a screen. It is about how a space feels when you wake up in the morning, how smoothly traffic flows between rooms, and how every single rupee in your budget is utilized.
              </p>
              <p>
                Far too many homeowners face ballooning budgets, hidden contractor markups, and uncoordinated designs that result in costly site modifications. At <strong className="text-foreground">ArchBySha</strong>, we believe in radical transparency:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="rounded-xl border border-grid bg-card p-4 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Spatial Efficiency First</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Eliminating dead zones, optimizing natural ventilation, and aligning layout flow with modern daily living habits.
                  </p>
                </div>

                <div className="rounded-xl border border-grid bg-card p-4 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Realistic Cost Engineering</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Detailed BOQ estimation and honest material breakdown to safeguard you against vendor overbilling.
                  </p>
                </div>

                <div className="rounded-xl border border-grid bg-card p-4 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Vastu &amp; Ergonomic Harmony</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Blending modern aesthetics with positive energy orientation, natural lighting, and sound acoustic balances.
                  </p>
                </div>

                <div className="rounded-xl border border-grid bg-card p-4 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Unbiased Contractor Vetting</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Equipping clients with the exact technical questions, specifications, and checklists needed when hiring contractors.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Core Specializations */}
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              What I Specialize In
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="rounded-2xl border border-grid bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Compass className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Architectural &amp; Floor Plan Design
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Crafting intuitive, circulation-friendly, and Vastu-compliant layout planning tailored to your lifestyle, natural light, and structural efficiency.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-grid bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                    <Palette className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    3D Concept Visualizations
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  High-definition 3D designs for 2BHK/3BHK residences, master bedrooms, modern modular kitchens, and luxury bathrooms—curating custom material palettes and lighting schemes.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-grid bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Wallet className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Smart Budgeting &amp; BOQ Estimations
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Detailed Bill of Quantities (BOQ) estimations and contractor quote evaluations to save you cash and ensure you never overpay for materials or labor.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl border border-grid bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <PhoneCall className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    1-on-1 Virtual Consultations
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Dedicated interactive sessions over Google Meet or direct call to review blueprints, troubleshoot structural bottlenecks, and clarify all interior dilemmas.
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action Box */}
          <section className="pt-6 border-t border-grid">
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-6 sm:p-8 text-center space-y-4">
              <h3 className="font-heading text-2xl font-bold text-foreground">
                Ready to Design Your Dream Space?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Schedule a 1-on-1 consultation session or choose a dedicated 3D design package to bring clarity, precision, and elegance to your property.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/#services">
                    <span>Book a Consultation Call</span>
                    <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link href="/#books">
                    <span>Explore E-Books</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="rounded-full font-mono text-xs">
                  <a href="mailto:hello@archbysha.com">
                    <Mail className="size-4 mr-1.5" />
                    <span>hello@archbysha.com</span>
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
