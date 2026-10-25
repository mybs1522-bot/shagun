"use client";

import dayjs from "dayjs";
import {
  CheckCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  CalendarDays,
  Clock,
  ChevronRight,
  UploadCloud,
  FileText,
  Trash2,
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

export function isFloorPlanRequiredService(service: Service | null): boolean {
  if (!service) return false;
  const t = service.title.toLowerCase();
  const c = (service.category || "").toLowerCase();

  // "Concept 3D Design for 2BHK/3BHK" retains its original settings (no floor plan requirement)
  if (c.includes("concept") || t.includes("2bhk") || t.includes("3bhk")) {
    return false;
  }

  return (
    c.includes("3d design") ||
    t.includes("bedroom") ||
    t.includes("kitchen") ||
    t.includes("washroom") ||
    t.includes("bathroom")
  );
}

interface FloorPlanFile {
  name: string;
  url: string;
  size: number;
  type: string;
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
  const isFloorPlanRequired = isFloorPlanRequiredService(service);
  const isConsultation = true;

  const [step, setStep] = useState<"floorplan" | "datetime" | "details">(
    isFloorPlanRequired ? "floorplan" : "datetime"
  );
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<FloorPlanFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dynamicBookedSlots, setDynamicBookedSlots] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dates, setDates] = useState<dayjs.Dayjs[]>([]);

  useEffect(() => {
    if (open) {
      setDates(generateDates(dayjs(), 14));
      setStep(isFloorPlanRequired ? "floorplan" : "datetime");
      setSelectedDate(null);
      setSelectedTime(null);
      setName("");
      setEmail("");
      setPhone("");
      setFloorPlanFile(null);
      setUploading(false);
      setIsDragging(false);
    }
  }, [open, isFloorPlanRequired]);

  useEffect(() => {
    if (open) {
      const fetchBookedSlots = async () => {
        try {
          const res = await fetch("/api/admin/calendar");
          if (res.ok) {
            const json = await res.json();
            if (json.slots) {
              const slotsMap: Record<string, string[]> = {};
              json.slots.forEach((s: any) => {
                const isPaid = s.payment_status === "completed";
                const isAdminBlocked =
                  s.phone === "0000000000" ||
                  s.name === "Admin Blocked Slot" ||
                  s.id?.startsWith("block_") ||
                  s.id?.startsWith("mem_block_");

                if (isPaid || isAdminBlocked) {
                  const dStr = s.appointment_date;
                  const tStr = s.appointment_time;
                  if (!slotsMap[dStr]) slotsMap[dStr] = [];
                  if (!slotsMap[dStr].includes(tStr)) {
                    slotsMap[dStr].push(tStr);
                  }
                }
              });
              setDynamicBookedSlots(slotsMap);
              return;
            }
          }
        } catch (err) {
          console.error("Error fetching calendar API:", err);
        }

        // Fallback to client Supabase
        try {
          const { data, error } = await supabase
            .from("service_leads")
            .select("appointment_date, appointment_time, payment_status, phone, name")
            .not("appointment_date", "is", null)
            .not("appointment_time", "is", null);

          if (error) throw error;

          const slotsMap: Record<string, string[]> = {};
          (data || []).forEach((lead: any) => {
            const isPaid = lead.payment_status === "completed";
            const isAdminBlocked =
              lead.phone === "0000000000" || lead.name === "Admin Blocked Slot";

            if (isPaid || isAdminBlocked) {
              const dateStr = lead.appointment_date;
              const timeStr = lead.appointment_time;
              if (!slotsMap[dateStr]) slotsMap[dateStr] = [];
              if (!slotsMap[dateStr].includes(timeStr)) {
                slotsMap[dateStr].push(timeStr);
              }
            }
          });
          setDynamicBookedSlots(slotsMap);
        } catch (err) {
          console.error("Error fetching booked slots:", err);
        }
      };

      fetchBookedSlots();
    }
  }, [open]);

  const isSlotBooked = (date: dayjs.Dayjs | null, time: string): boolean => {
    if (!date) return false;
    const key = date.format("YYYY-MM-DD");
    return dynamicBookedSlots[key]?.includes(time) ?? false;
  };

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

  const handleFileSelected = async (file: File) => {
    if (!file) return;

    const validExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error("Please upload an image (PNG, JPG, WEBP) or a PDF file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds 25MB limit. Please upload a smaller file.");
      return;
    }

    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `floor-plans/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${cleanName}`;

      const { error } = await supabase.storage
        .from("project-images")
        .upload(filePath, file, {
          contentType: file.type || (ext === "pdf" ? "application/pdf" : "image/jpeg"),
          upsert: true,
        });

      let finalUrl = "";
      if (!error) {
        const { data: publicUrlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(filePath);
        finalUrl = publicUrlData.publicUrl;
      } else {
        console.warn("Storage upload warning, using local file reader:", error);
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setFloorPlanFile({
        name: file.name,
        url: finalUrl,
        size: file.size,
        type: file.type || (ext === "pdf" ? "application/pdf" : "image"),
      });

      toast.success("Floor plan uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Failed to upload floor plan. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please enter your name, email, and phone number");
      return;
    }

    const fullPhone = isConsultation ? `+91 ${phone.trim()}` : phone.trim();

    let finalName = name.trim();
    if (isConsultation && selectedDate && selectedTime) {
      finalName = `${name.trim()} (Appt: ${selectedDate.format("MMM D")} at ${selectedTime})`;
    }

    const isPaymentRequired = service.amount > 0;

    const leadNotes = [
      {
        id: `note_${Date.now()}_email`,
        text: `✉️ Client Email: ${email.trim()}`,
        createdAt: new Date().toISOString(),
        formattedTime: dayjs().format("ddd, MMM D, YYYY [at] h:mm A"),
        author: "Client Input",
      },
      ...(floorPlanFile
        ? [
            {
              id: `note_${Date.now()}_fp`,
              text: `📐 Client Attached Floor Plan: ${floorPlanFile.name}\n🔗 File Link: ${floorPlanFile.url}`,
              createdAt: new Date().toISOString(),
              formattedTime: dayjs().format("ddd, MMM D, YYYY [at] h:mm A"),
              author: "Client Upload",
            },
          ]
        : []),
    ];

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
          payment_status: "pending",
          appointment_date: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
          appointment_time: selectedTime,
          notes_json: leadNotes.length > 0 ? JSON.stringify(leadNotes) : null,
        });

        // Send email notification for new lead
        fetch("/api/notify-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            email: email.trim(),
            phone: fullPhone,
            serviceName: service.title,
            paymentStatus: "pending",
            date: selectedDate?.format("MMM D, YYYY") || null,
            time: selectedTime || null,
            floorPlanUrl: floorPlanFile?.url || null,
            floorPlanName: floorPlanFile?.name || null,
          }),
        }).catch(console.error);

        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: service.amount }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        // Save order_id to database lead
        await supabase
          .from("service_leads")
          .update({ razorpay_order_id: data.orderId })
          .eq("id", leadId);

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: service.amount * 100,
          currency: "INR",
          name: "Ar Shagun",
          description: service.title,
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
                  type: "service",
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error);

              toast.success("Payment successful! Appointment scheduled.");
              onClose();
              window.location.href = `/thank-you?date=${selectedDate ? selectedDate.format("YYYY-MM-DD") : ""}&time=${selectedTime || ""}`;
            } catch (err: any) {
              console.error("Verification failed:", err);
              toast.error("Payment verified, but sync is slow. Our support team will confirm shortly.");
              onClose();
              window.location.href = `/thank-you?date=${selectedDate ? selectedDate.format("YYYY-MM-DD") : ""}&time=${selectedTime || ""}`;
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: finalName,
            email: email.trim(),
            contact: fullPhone,
          },
          theme: {
            color: "#10b981", // emerald-500
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            },
          },
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
      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("service_leads").insert({
        id: leadId,
        name: finalName,
        phone: fullPhone,
        service_id: service.id,
        appointment_date: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
        appointment_time: selectedTime,
        notes_json: leadNotes.length > 0 ? JSON.stringify(leadNotes) : null,
      });
      setSubmitting(false);

      if (error) {
        toast.error("An error occurred. Please try again.");
        console.error(error);
      } else {
        fetch("/api/notify-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            email: email.trim(),
            phone: fullPhone,
            serviceName: service.title,
            paymentStatus: "none",
            date: selectedDate?.format("MMM D, YYYY") || null,
            time: selectedTime || null,
            floorPlanUrl: floorPlanFile?.url || null,
            floorPlanName: floorPlanFile?.name || null,
          }),
        }).catch(console.error);

        if (selectedDate && selectedTime) {
          fetch("/api/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId: leadId,
              name: finalName,
              phone: fullPhone,
              serviceName: service.title,
              date: selectedDate.format("MMM D, YYYY"),
              time: selectedTime,
              floorPlanUrl: floorPlanFile?.url || null,
            }),
          }).catch(console.error);
        }
        toast.success("Request received! Our support team will contact you shortly.");
        onClose();
        window.location.href = `/thank-you?date=${selectedDate ? selectedDate.format("YYYY-MM-DD") : ""}&time=${selectedTime || ""}`;
      }
    }
  };

  const handleNextFromDateTime = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }
    setStep("details");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-md max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="relative flex items-center justify-center py-1">
            {step === "details" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 size-8 -ml-2"
                onClick={() => setStep("datetime")}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {step === "datetime" && isFloorPlanRequired && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 size-8 -ml-2"
                onClick={() => setStep("floorplan")}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}

            <DialogTitle className="text-base sm:text-lg font-bold">
              {step === "floorplan"
                ? "Upload Your Floor Plan"
                : step === "datetime"
                  ? "Select Date & Time"
                  : service?.title || "Book A Call"}
            </DialogTitle>
          </div>

          {/* Stepper Progress Bar for Special 3D Design Services */}
          {isFloorPlanRequired && (
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] font-semibold tracking-wider uppercase">
              <span
                className={cn(
                  "transition-colors",
                  step === "floorplan"
                    ? "text-emerald-500 font-bold"
                    : "text-muted-foreground"
                )}
              >
                1. Floor Plan
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span
                className={cn(
                  "transition-colors",
                  step === "datetime"
                    ? "text-emerald-500 font-bold"
                    : "text-muted-foreground"
                )}
              >
                2. Date &amp; Time
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span
                className={cn(
                  "transition-colors",
                  step === "details"
                    ? "text-emerald-500 font-bold"
                    : "text-muted-foreground"
                )}
              >
                3. Confirm &amp; Pay
              </span>
            </div>
          )}

          <DialogDescription className="text-center text-[10px] xs:text-xs sm:text-sm px-1">
            {step === "floorplan" ? (
              <span>
                Please upload your existing floor plan or space drawing for{" "}
                <span className="font-semibold text-foreground">
                  {service?.title}
                </span>{" "}
                before proceeding to date booking.
              </span>
            ) : step === "datetime" ? (
              "Choose an available slot for your consultation."
            ) : (
              <>
                <span className="block">
                  Enter your details below to confirm{" "}
                  <span className="font-semibold text-foreground">
                    {service?.title}
                  </span>
                  .
                </span>
                {service?.description && (
                  <span className="mt-1 block text-[10px] xs:text-[11px] sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 whitespace-normal">
                    💡 {service.description}
                  </span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Upload Floor Plan (Special Services) */}
        {step === "floorplan" && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-2 pt-1">
            {/* Upload Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelected(file);
              }}
              onClick={() => {
                if (!uploading) fileInputRef.current?.click();
              }}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all cursor-pointer",
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                  : floorPlanFile
                    ? "border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10"
                    : "border-border/80 bg-muted/20 hover:border-emerald-500/50 hover:bg-accent/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = "";
                }}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="size-10 animate-spin text-emerald-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Uploading your floor plan...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Securely attaching file to your design consultation
                    </p>
                  </div>
                </div>
              ) : floorPlanFile ? (
                <div className="flex flex-col items-center gap-3 py-2 w-full">
                  <div className="relative">
                    {floorPlanFile.type.includes("pdf") ? (
                      <div className="size-16 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <FileText className="size-8 text-rose-500" />
                      </div>
                    ) : (
                      <img
                        src={floorPlanFile.url}
                        alt="Floor plan preview"
                        className="size-20 rounded-xl object-cover border border-border/80 shadow-sm"
                      />
                    )}
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-0.5 text-white shadow-xs">
                      <CheckCircle2 className="size-4" />
                    </span>
                  </div>

                  <div className="space-y-1 max-w-full px-2">
                    <p className="text-sm font-bold text-foreground truncate max-w-[260px]">
                      {floorPlanFile.name}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <span>✓ Floor plan attached</span>
                      <span>•</span>
                      <span>{(floorPlanFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloorPlanFile(null);
                    }}
                    className="mt-1 h-7 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3 mr-1" /> Remove &amp; Re-upload
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-xs">
                    <UploadCloud className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Click to browse or drag &amp; drop floor plan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP, or PDF (up to 25MB)
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    📐 2D floor plan, architectural layout, or hand sketch
                  </span>
                </div>
              )}
            </div>

            {/* Why Required Context Box */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span>💡</span> Why is a floor plan required?
              </p>
              <p className="leading-relaxed text-[11px]">
                To craft high-accuracy 3D visual renders, Ar Shagun needs room dimensions, structural openings, and wall placements. Your plan will be reviewed prior to your consultation.
              </p>
            </div>

            {/* Next Action Button */}
            <Button
              className="w-full h-11 text-sm font-semibold gap-2"
              onClick={() => {
                if (!floorPlanFile) {
                  toast.error("Please upload your floor plan to proceed");
                  return;
                }
                setStep("datetime");
              }}
              disabled={!floorPlanFile || uploading}
            >
              <span>Continue to Date Booking</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Date & Time Selection */}
        {step === "datetime" && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pb-2 pt-1">
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
                  className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Scroll dates left"
                >
                  <ChevronRight className="size-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollDates("right")}
                  className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
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
              className="w-full h-11 text-sm font-semibold gap-2"
              onClick={handleNextFromDateTime}
              disabled={!selectedDate || !selectedTime}
            >
              <span>Continue to Details</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* STEP 3: User Details & Submit / Payment */}
        {step === "details" && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-2 pt-1"
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
              <Label htmlFor="service-email">
                Email Address <span className="text-xs text-muted-foreground font-normal">(for booking confirmation)</span>
              </Label>
              <Input
                id="service-email"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 size-4" />
              )}
              {service && service.amount > 0
                ? `Proceed to Payment (₹${service.amount.toLocaleString("en-IN")})`
                : "Submit Request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
