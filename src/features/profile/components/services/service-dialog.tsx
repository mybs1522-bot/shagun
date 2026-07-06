"use client";

import dayjs from "dayjs";
import {
  CheckCircle,
  Loader2,
  ArrowLeft,
  CalendarDays,
  Clock,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
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
import { cn } from "@/lib/cn";
import { Service } from "@/features/profile/types/services";
import { supabase } from "@/lib/supabase";

function generateDates(startDate: dayjs.Dayjs, days: number) {
  return Array.from({ length: days }).map((_, i) => startDate.add(i, "day"));
}

const availableTimes = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

// Slots that are already booked (keyed by YYYY-MM-DD)
const bookedSlots: Record<string, string[]> = {
  [dayjs().format("YYYY-MM-DD")]: ["11:00 AM", "02:00 PM", "04:00 PM"],
  [dayjs().add(1, "day").format("YYYY-MM-DD")]: ["10:00 AM", "03:00 PM"],
};

function isSlotBooked(date: dayjs.Dayjs | null, time: string): boolean {
  if (!date) return false;
  const key = date.format("YYYY-MM-DD");
  return bookedSlots[key]?.includes(time) ?? false;
}

function isSlotPassed(date: dayjs.Dayjs | null, timeStr: string): boolean {
  if (!date) return false;
  
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  
  if (hours === 12) {
    hours = modifier === "PM" ? 12 : 0;
  } else if (modifier === "PM") {
    hours = hours + 12;
  }

  const slotDateTime = date.hour(hours).minute(minutes).second(0).millisecond(0);
  const now = dayjs();
  
  return slotDateTime.isBefore(now);
}

export function ServiceDialog({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}) {
  const titleLower = service?.title.toLowerCase() || "";
  const categoryLower = service?.category.toLowerCase() || "";
  const isConsultation =
    !titleLower.includes("3d design") &&
    (titleLower.includes("consultation") ||
      titleLower.includes("call") ||
      titleLower.includes("google meet") ||
      titleLower.includes("zoom") ||
      titleLower.includes("video") ||
      titleLower.includes("meet") ||
      categoryLower.includes("consultation"));

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate next 14 days for selection
  const [dates, setDates] = useState<dayjs.Dayjs[]>([]);
  useEffect(() => {
    if (open) {
      setDates(generateDates(dayjs(), 14));
      setStep(isConsultation ? 1 : 2);
      setSelectedDate(null);
      setSelectedTime(null);
      setName("");
      setPhone("");
    }
  }, [open, isConsultation]);

  const scrollDates = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.offsetWidth;
    container.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

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
    if (!service) return;

    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }

    const fullPhone = isConsultation ? `+91 ${phone.trim()}` : phone.trim();

    let finalName = name.trim();
    if (isConsultation && selectedDate && selectedTime) {
      finalName = `${name.trim()} (Appt: ${selectedDate.format("MMM D")} at ${selectedTime})`;
    }

    const isPaymentRequired = service.amount > 0 && !titleLower.includes("3d design");

    if (isPaymentRequired) {
      setSubmitting(true);
      const leadId = crypto.randomUUID();
      try {
        // Save the lead immediately before payment as 'pending'
        await supabase.from("service_leads").insert({
          id: leadId,
          name: finalName,
          phone: fullPhone,
          service_id: service.id,
          payment_status: 'pending'
        });

        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: service.amount }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: service.amount * 100,
          currency: "INR",
          name: "Ar Shagun",
          description: service.title,
          order_id: data.orderId,
          handler: async function (response: any) {
            const nameWithPayment = `${finalName} (TXN: ${response.razorpay_payment_id})`;
            
            // Update the existing record to 'completed'
            const { error } = await supabase
              .from("service_leads")
              .update({ 
                name: nameWithPayment,
                payment_status: 'completed'
              })
              .eq("id", leadId);

            if (error) {
              toast.error("Payment successful, but failed to save entry.");
              console.error(error);
            } else {
              toast.success("Payment successful! Request received.");
              onClose();
            }
          },
          prefill: {
            name: finalName,
            contact: fullPhone,
          },
          theme: {
            color: "#10b981", // emerald-500
          },
          modal: {
            ondismiss: function() {
              // The lead is already saved, so we just reset state
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
      setSubmitting(true);
      const { error } = await supabase.from("service_leads").insert({
        name: finalName,
        phone: fullPhone,
        service_id: service.id,
      });
      setSubmitting(false);

      if (error) {
        toast.error("An error occurred. Please try again.");
        console.error(error);
      } else {
        toast.success("Request received! Our support team will contact you shortly.");
        onClose();
      }
    }
  };

  const handleNextStep = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }
    setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="relative flex items-center justify-center py-1">
            {step === 2 && isConsultation && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 size-8 -ml-2"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <DialogTitle>
              {step === 1 && isConsultation
                ? "Select Date & Time"
                : titleLower.includes("3d design")
                  ? "Need 3D Design"
                  : "Book A Call"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-center">
            {step === 1 && isConsultation ? (
              "Choose an available slot for your consultation."
            ) : (
              <>
                Enter your details below to request{" "}
                <span className="font-semibold text-foreground">
                  {service?.title}
                </span>
                .
                {service?.description && !isConsultation && (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-normal">
                    {service.description}
                  </p>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && isConsultation ? (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pb-2">
            {/* Date Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span>Select Date</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 -mt-1">
                  <button
                    type="button"
                    onClick={() => scrollDates("left")}
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label="Scroll dates left"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollDates("right")}
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label="Scroll dates right"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scroll-smooth"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <style>{`[data-date-scroll]::-webkit-scrollbar { display: none; }`}</style>
                {dates.map((d) => {
                  const isSelected = selectedDate?.isSame(d, "day");
                  return (
                    <button
                      key={d.format("YYYY-MM-DD")}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border py-3 transition-all cursor-pointer",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                          : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      style={{
                        minWidth: "calc((100% - 16px) / 3)",
                        maxWidth: "calc((100% - 16px) / 3)",
                      }}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                        {d.format("ddd")}
                      </span>
                      <span className="text-xl font-bold mt-0.5">
                        {d.format("DD")}
                      </span>
                      <span className="text-[10px] font-medium opacity-70 mt-0.5">
                        {d.format("MMM")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <Clock className="size-4 text-muted-foreground" />
                <span>Select Time</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((timeSlot) => {
                  const booked = isSlotBooked(selectedDate, timeSlot);
                  const passed = isSlotPassed(selectedDate, timeSlot);
                  const disabled = booked || passed;
                  const isSelected = selectedTime === timeSlot;
                  return (
                    <button
                      key={timeSlot}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) setSelectedTime(timeSlot);
                      }}
                      className={cn(
                        "rounded-lg border py-2 text-xs font-semibold transition-all",
                        disabled
                          ? "border-red-500/40 bg-red-500/10 text-red-400 cursor-not-allowed line-through opacity-70"
                          : isSelected
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25 cursor-pointer"
                            : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      )}
                    >
                      {booked ? "Booked" : passed ? "Passed" : timeSlot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              className="w-full"
              onClick={handleNextStep}
              disabled={!selectedDate || !selectedTime}
            >
              Continue
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto min-h-0 space-y-5 pb-2"
          >
            <div className="space-y-2">
              <Label htmlFor="service-name">Full Name</Label>
              <Input
                id="service-name"
                type="text"
                placeholder="e.g. Rahul Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-phone">Phone Number</Label>
              {isConsultation ? (
                <div className="flex">
                  <div className="flex items-center justify-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </div>
                  <Input
                    id="service-phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setPhone(val);
                    }}
                    required
                    className="rounded-l-none"
                  />
                </div>
              ) : (
                <Input
                  id="service-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 size-4" />
              )}
              {service?.payment_link && !titleLower.includes("3d design") ? "Proceed to Payment" : "Submit"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
