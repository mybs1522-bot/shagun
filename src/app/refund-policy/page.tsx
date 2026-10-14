import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { ChanhDaiMark } from "@/components/chanhdai-mark";
import { Footer } from "@/components/footer";
import { ToggleTheme } from "@/components/toggle-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Ar. Shagun",
  description:
    "Official cancellation and refund policy for architectural consultations, 3D design services, and digital resources by Ar. Shagun.",
};

export default function RefundPolicyPage() {
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
        {/* Header Hero Section */}
        <div className="space-y-3 pb-8 border-b border-grid">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs py-1 px-2.5 font-medium"
            >
              <ShieldCheck className="size-3.5" />
              Official Studio Policy
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              Last Updated: July 2026
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Cancellation &amp; Refund Policy
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Please read this policy carefully before booking a consultation call or ordering custom architectural &amp; interior design services with Ar. Shagun.
          </p>
        </div>

        {/* Highlight Summary Card */}
        <div className="my-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-500 shrink-0 mt-0.5">
              <ShieldAlert className="size-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">
                Core Policy Summary
              </h2>
              <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Pre-Service Window:</strong> A 100% refund or free slot reschedule is available as long as your scheduled consultation call or design work has <strong className="text-foreground">not</strong> taken place.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Post-Service Window:</strong> Once the consultation call has been conducted, or once custom architectural drawings and 3D designs have been provided, <strong className="text-foreground">no refunds can be issued</strong> under any circumstances.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <HelpCircle className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Mandatory Pre-Payment Clarity:</strong> Before completing payment, please ensure you have full clarity on service deliverables, timeline, and scope. If you have questions, please reach out to our team first.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              1. Overview &amp; Commitment to Transparency
            </h2>
            <p>
              At Ar. Shagun Architectural &amp; Interior Design Studio, we pride ourselves on providing bespoke, high-touch consultation, spatial planning, floor plans, and 3D concept designs. Because professional architectural advisory and design drafting involve extensive allocation of expert time, creative resources, and individualized technical analysis, our refund parameters are strictly defined below.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              2. Consultation Calls (Google Meet / Phone)
            </h2>
            <div className="rounded-xl border border-grid bg-card p-4 sm:p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  A. Prior to the Call (Eligible for Full Refund or Reschedule)
                </h3>
                <p className="mt-1 text-xs sm:text-sm">
                  If you need to cancel your booking prior to the scheduled date and time of your consultation, you are fully entitled to either:
                </p>
                <ul className="list-disc list-inside mt-2 text-xs sm:text-sm space-y-1 pl-2">
                  <li>A full refund processed back to your original payment method.</li>
                  <li>A complimentary rescheduling of your slot to an available future date.</li>
                </ul>
              </div>

              <div className="border-t border-grid pt-3">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  B. Once the Call is Completed (Strictly Non-Refundable)
                </h3>
                <p className="mt-1 text-xs sm:text-sm">
                  Once the consultation call has taken place—in whole or in part—with Ar. Shagun or our architectural team, the service fee is completely non-refundable. Professional advisory, technical insights, and dedicated architect time are considered fully delivered at the conclusion of the call.
                </p>
              </div>

              <div className="border-t border-grid pt-3">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  C. Missed Sessions (No-Show)
                </h3>
                <p className="mt-1 text-xs sm:text-sm">
                  If you fail to attend a confirmed appointment without notifying our support team at least 2 hours in advance, the slot cannot be reallocated and will be considered delivered without eligibility for refund.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              3. Architectural Floor Plans &amp; 3D Design Services
            </h2>
            <div className="rounded-xl border border-grid bg-card p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
              <p>
                For custom deliverables such as 2BHK/3BHK Concept 3D Designs, Floor Plan Layouts, Interior Elevations, or Exterior Visualizations:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong>Cancellation before work commences:</strong> If you request cancellation before our architectural drafting team starts drafting your drawings or 3D models, a full refund will be granted.
                </li>
                <li>
                  <strong>Once design work or deliverables are provided:</strong> Because custom design drawings are tailored specifically to your dimensions and cannot be repurposed, no refunds are granted once initial design drafts or final files have been shared.
                </li>
                <li>
                  <strong>Revisions &amp; Adjustments:</strong> Rather than cancellations, we are committed to client satisfaction through the agreed revision cycles specified in your service package to refine the design to your expectations.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              4. Pre-Payment Clarity &amp; Client Responsibility
            </h2>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 p-4 sm:p-5 space-y-2 text-xs sm:text-sm">
              <p className="font-medium text-foreground">
                Before proceeding with any payment, we urge you to obtain complete clarity:
              </p>
              <p>
                Every service description on our website specifies what is included (e.g. call duration, whether 3D model files are included, floor plan revisions, etc.).
              </p>
              <p>
                If you have unique floor layout requirements, specific structural constraints, or are unsure which consultation tier best fits your property, <strong className="text-foreground">please contact our team before making payment</strong>. We will happily guide you to ensure the service meets your exact requirements.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              5. Digital Products &amp; E-Books
            </h2>
            <p className="text-xs sm:text-sm">
              All digital publications, architectural guidebooks, and downloadable e-books are delivered electronically via instantaneous download links. Due to the immediate access and digital nature of these products, all digital e-book sales are final and non-refundable once the file download link has been generated.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              6. Refund Request Process &amp; Timelines
            </h2>
            <div className="rounded-xl border border-grid bg-card p-4 sm:p-5 space-y-2 text-xs sm:text-sm">
              <p>
                If your cancellation meets the pre-service eligibility criteria, please follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-2">
                <li>
                  Contact us via email at <strong className="text-foreground">hello@archbysha.com</strong>.
                </li>
                <li>
                  Provide your <strong className="text-foreground">Full Name</strong>, <strong className="text-foreground">Phone Number</strong>, and <strong className="text-foreground">Transaction/Order ID</strong> (e.g. Razorpay payment ID starting with <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">pay_...</code>).
                </li>
                <li>
                  State your reason for cancellation or your preferred reschedule slot.
                </li>
              </ol>
              <p className="pt-2">
                Approved refunds are initiated immediately and will reflect in your bank account, credit card, or UPI wallet within <strong className="text-foreground">5 to 7 business days</strong>, subject to your issuing bank&apos;s processing schedules.
              </p>
            </div>
          </section>

          {/* Section 7: Contact Box */}
          <section className="space-y-3 pt-4 border-t border-grid">
            <h2 className="font-heading text-xl font-bold text-foreground">
              7. Need Help or Pre-Payment Clarity?
            </h2>
            <p className="text-xs sm:text-sm">
              Our support team is available Monday through Saturday (10:00 AM – 7:00 PM IST) to answer any queries before you make a payment.
            </p>

            <div className="pt-2 max-w-md">
              <a
                href="mailto:hello@archbysha.com"
                className="flex items-center gap-3 rounded-xl border border-grid bg-card p-4 hover:border-foreground/30 transition-all group"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="size-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email Support</div>
                  <div className="font-mono text-xs sm:text-sm font-semibold text-foreground group-hover:underline">
                    hello@archbysha.com
                  </div>
                </div>
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
