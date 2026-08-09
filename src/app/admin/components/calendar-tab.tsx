"use client";

import dayjs from "dayjs";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Unlock,
  UserCheck,
  RefreshCw,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export const AVAILABLE_TIMES = [
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

export type SlotLeadInfo = {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  payment_status?: string | null;
  lead_status?: string | null;
  services?: { title?: string } | null;
  isAdminBlocked?: boolean;
};

export function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [bookedSlots, setBookedSlots] = useState<SlotLeadInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Month navigation for visual month view
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/calendar");
      if (res.ok) {
        const json = await res.json();
        if (json.slots) {
          const processed: SlotLeadInfo[] = json.slots.map((s: any) => ({
            ...s,
            isAdminBlocked:
              s.phone === "0000000000" ||
              s.name === "Admin Blocked Slot" ||
              s.id?.startsWith("block_") ||
              s.id?.startsWith("mem_block_"),
          }));
          setBookedSlots(processed);
        }
      }
    } catch (err) {
      console.error("Failed to load calendar slots:", err);
      toast.error("Failed to fetch calendar slots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const dateStr = selectedDate.format("YYYY-MM-DD");

  // Get slots for the selected date
  const selectedDateSlotsMap = new Map<string, SlotLeadInfo>();
  bookedSlots
    .filter((s) => s.appointment_date === dateStr)
    .forEach((s) => {
      selectedDateSlotsMap.set(s.appointment_time, s);
    });

  // Block a specific time slot
  const handleBlockSlot = async (time: string) => {
    setActionLoading(`block_${time}`);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block_slot",
          date: dateStr,
          time,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to block slot");

      toast.success(`Slot ${time} marked as Booked/Blocked for ${selectedDate.format("MMM D")}`);
      fetchSlots();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error blocking slot");
    } finally {
      setActionLoading(null);
    }
  };

  // Unblock a specific time slot
  const handleUnblockSlot = async (time: string) => {
    setActionLoading(`unblock_${time}`);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unblock_slot",
          date: dateStr,
          time,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to unblock slot");

      toast.success(`Slot ${time} opened for booking on ${selectedDate.format("MMM D")}`);
      fetchSlots();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error unblocking slot");
    } finally {
      setActionLoading(null);
    }
  };

  // Block entire day
  const handleBlockDay = async () => {
    setActionLoading("block_day");
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block_day",
          date: dateStr,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to block day");

      toast.success(`Entire day ${selectedDate.format("MMM D, YYYY")} marked as Booked/Blocked`);
      fetchSlots();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error blocking day");
    } finally {
      setActionLoading(null);
    }
  };

  // Unblock entire day
  const handleUnblockDay = async () => {
    setActionLoading("unblock_day");
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unblock_day",
          date: dateStr,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to unblock day");

      toast.success(`Admin-blocked slots cleared for ${selectedDate.format("MMM D, YYYY")}`);
      fetchSlots();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error unblocking day");
    } finally {
      setActionLoading(null);
    }
  };

  // Generate 14 days quick selector
  const next14Days = Array.from({ length: 14 }).map((_, i) => dayjs().add(i, "day"));

  // Statistics for selected date
  let clientBookedCount = 0;
  let adminBlockedCount = 0;
  AVAILABLE_TIMES.forEach((t) => {
    const slot = selectedDateSlotsMap.get(t);
    if (slot) {
      if (slot.isAdminBlocked) adminBlockedCount++;
      else clientBookedCount++;
    }
  });
  const availableCount = AVAILABLE_TIMES.length - clientBookedCount - adminBlockedCount;

  // Month grid days
  const renderMonthGrid = () => {
    const startOfMonth = currentMonth.startOf("month");
    const daysInMonth = currentMonth.daysInMonth();
    const startDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    const todayStr = dayjs().format("YYYY-MM-DD");

    const days = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty_${i}`} className="h-9" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = currentMonth.date(day);
      const dStr = dateObj.format("YYYY-MM-DD");
      const isSelected = dStr === dateStr;
      const isToday = dStr === todayStr;

      // Count bookings for this date
      const dateBookings = bookedSlots.filter((s) => s.appointment_date === dStr);
      const clientCount = dateBookings.filter((s) => !s.isAdminBlocked).length;
      const adminCount = dateBookings.filter((s) => s.isAdminBlocked).length;
      const totalBooked = dateBookings.length;

      days.push(
        <button
          key={dStr}
          onClick={() => setSelectedDate(dateObj)}
          className={`relative h-10 w-full rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
            isSelected
              ? "bg-primary text-primary-foreground font-bold shadow-md scale-105"
              : isToday
              ? "border border-primary text-primary bg-primary/10"
              : "hover:bg-muted text-foreground"
          }`}
        >
          <span>{day}</span>
          {totalBooked > 0 && (
            <div className="flex items-center gap-0.5 mt-0.5">
              {clientCount > 0 && (
                <span className="size-1.5 rounded-full bg-emerald-400" title={`${clientCount} client booking(s)`} />
              )}
              {adminCount > 0 && (
                <span className="size-1.5 rounded-full bg-destructive" title={`${adminCount} blocked slot(s)`} />
              )}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6 w-full">
      {/* HEADER BANNER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarIcon className="size-5 text-primary" />
            Calendar Booking &amp; Slot Manager
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View client appointments and mark time slots as booked or blocked to prevent new bookings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={fetchSlots}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Slots
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: MONTH & QUICK DATE PICKER */}
        <div className="space-y-4">
          {/* QUICK 14-DAY RIBBON */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Upcoming 14 Days</span>
              <span className="text-[10px] text-muted-foreground">Select date below</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {next14Days.map((d) => {
                const dStr = d.format("YYYY-MM-DD");
                const isSelected = dStr === dateStr;
                const dateBookings = bookedSlots.filter((s) => s.appointment_date === dStr);

                return (
                  <button
                    key={dStr}
                    onClick={() => {
                      setSelectedDate(d);
                      setCurrentMonth(d);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-1.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-md scale-105"
                        : "border-border bg-background hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold opacity-80">
                      {d.format("ddd")}
                    </span>
                    <span className="text-sm font-extrabold mt-0.5">{d.format("D")}</span>
                    <span className="text-[9px] mt-0.5 opacity-75">{d.format("MMM")}</span>

                    {dateBookings.length > 0 && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/20 px-1 text-[9px] font-bold text-emerald-400">
                        {dateBookings.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISUAL MONTH CALENDAR GRID */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth((prev) => prev.subtract(1, "month"))}
                className="h-7 w-7"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-bold text-foreground">
                {currentMonth.format("MMMM YYYY")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth((prev) => prev.add(1, "month"))}
                className="h-7 w-7"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            <div className="grid grid-cols-7 gap-1 place-items-center">
              {renderMonthGrid()}
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>Client Booking</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-destructive" />
                <span>Admin Blocked</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TIME SLOTS MANAGEMENT FOR SELECTED DATE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            {/* SELECTED DATE HEADER & SUMMARY */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <span>📅 {selectedDate.format("dddd, MMMM D, YYYY")}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  10 Available slots per day (10:00 AM to 07:00 PM)
                </p>
              </div>

              {/* DAY STATUS BADGES */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  {availableCount} Available
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-400 border border-blue-500/30">
                  <UserCheck className="size-3" />
                  {clientBookedCount} Client
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 font-semibold text-destructive border border-destructive/30">
                  <Lock className="size-3" />
                  {adminBlockedCount} Blocked
                </span>
              </div>
            </div>

            {/* BULK ACTIONS FOR DAY */}
            <div className="flex items-center justify-between gap-2 bg-muted/30 p-3 rounded-lg border border-border text-xs">
              <span className="font-semibold text-foreground">Bulk Day Controls:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleBlockDay}
                  disabled={actionLoading === "block_day"}
                  className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Lock className="size-3" />
                  {actionLoading === "block_day" ? "Blocking..." : "Block Entire Day"}
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={handleUnblockDay}
                  disabled={actionLoading === "unblock_day"}
                  className="h-7 text-xs gap-1 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/30"
                >
                  <Unlock className="size-3" />
                  {actionLoading === "unblock_day" ? "Unblocking..." : "Open Entire Day"}
                </Button>
              </div>
            </div>

            {/* TIME SLOTS LIST (10:00 AM - 07:00 PM) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {AVAILABLE_TIMES.map((time) => {
                const leadInfo = selectedDateSlotsMap.get(time);
                const isClientBooked = !!leadInfo && !leadInfo.isAdminBlocked;
                const isAdminBlocked = !!leadInfo && leadInfo.isAdminBlocked;
                const isAvailable = !leadInfo;

                return (
                  <div
                    key={time}
                    className={`rounded-xl border p-3.5 flex items-center justify-between transition-all ${
                      isClientBooked
                        ? "border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/30"
                        : isAdminBlocked
                        ? "border-destructive/40 bg-destructive/10 dark:bg-destructive/20"
                        : "border-border bg-background hover:border-emerald-500/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm flex items-center gap-1">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {time}
                        </span>

                        {isClientBooked && (
                          <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                            Client Booking
                          </span>
                        )}

                        {isAdminBlocked && (
                          <span className="rounded-md bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/30">
                            Blocked by Admin
                          </span>
                        )}

                        {isAvailable && (
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            Available
                          </span>
                        )}
                      </div>

                      {/* Lead / Client Details if booked */}
                      {isClientBooked && leadInfo && (
                        <div className="text-xs space-y-0.5 pt-0.5">
                          <p className="font-semibold text-foreground">{leadInfo.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {leadInfo.phone}
                            </span>
                            <span>•</span>
                            <span className="text-primary font-medium">
                              {leadInfo.services?.title || "Consultation"}
                            </span>
                          </div>
                        </div>
                      )}

                      {isAdminBlocked && (
                        <p className="text-[11px] text-muted-foreground italic">
                          This slot is closed for client booking
                        </p>
                      )}

                      {isAvailable && (
                        <p className="text-[11px] text-muted-foreground">
                          Open for client booking on website
                        </p>
                      )}
                    </div>

                    {/* ACTION BUTTON */}
                    <div>
                      {isAdminBlocked ? (
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => handleUnblockSlot(time)}
                          disabled={actionLoading === `unblock_${time}`}
                          className="h-8 text-xs gap-1.5 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/40"
                        >
                          <Unlock className="size-3.5" />
                          {actionLoading === `unblock_${time}` ? "Opening..." : "Unblock Slot"}
                        </Button>
                      ) : isAvailable ? (
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => handleBlockSlot(time)}
                          disabled={actionLoading === `block_${time}`}
                          className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/40"
                        >
                          <Lock className="size-3.5" />
                          {actionLoading === `block_${time}` ? "Marking..." : "Mark as Booked"}
                        </Button>
                      ) : (
                        <span className="text-[11px] font-semibold text-blue-400 px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          Booked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
