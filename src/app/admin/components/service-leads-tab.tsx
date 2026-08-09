"use client";

import dayjs from "dayjs";
import {
  Loader2,
  CalendarDays,
  Clock,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  Send,
  PlusCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  IndianRupee,
  Save,
  Check,
  MessageCircle,
  Receipt,
  AlertCircle,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Service } from "@/features/profile/types/services";
import { supabase } from "@/lib/supabase";

export type LeadStatus =
  | "Advance Payment"
  | "Floor Plan"
  | "3D Design"
  | "Follow Up Again"
  | "Closed";

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  "Advance Payment",
  "Floor Plan",
  "3D Design",
  "Follow Up Again",
  "Closed",
];

export type LeadNote = {
  id: string;
  text: string;
  createdAt: string;
  formattedTime: string;
  author?: string;
};

export type ServiceLead = {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string;
  lead_status?: LeadStatus | null;
  appointment_date?: string | null;
  appointment_time?: string | null;
  notes_json?: string | LeadNote[] | null;
  money_received?: number | null;
  total_invoice?: number | null;
  deadline_date?: string | null;
  services: Pick<Service, "title"> | null;
};

function formatLogTimestamp(isoStr: string): string {
  const d = dayjs(isoStr);
  return d.format("ddd, MMM D, YYYY [at] h:mm A");
}

function getWhatsAppUrl(phone: string) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  const msg = `Hi, Ar Shagun this side, you tried to make a consultation booking for your space, did you faced any issue or you want to understand something before going forward with consultation and designing services?`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

export function ServiceLeadsTab() {
  const [leads, setLeads] = useState<ServiceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "completed" | "pending">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Notes state
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Money, Invoice & Deadline editing state per lead
  const [moneyInputs, setMoneyInputs] = useState<Record<string, string>>({});
  const [invoiceInputs, setInvoiceInputs] = useState<Record<string, string>>({});
  const [deadlineInputs, setDeadlineInputs] = useState<Record<string, string>>({});

  // Saved feedback highlights
  const [savedSuccess, setSavedSuccess] = useState<Record<string, boolean>>({});

  // Active lead for Deadline Calendar Modal
  const [calendarTargetLead, setCalendarTargetLead] = useState<ServiceLead | null>(null);
  const [calendarViewMonth, setCalendarViewMonth] = useState<dayjs.Dayjs>(dayjs());

  // New lead form modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    serviceTitle: "3D Design for Interiors and Exteriors",
    status: "Follow Up Again" as LeadStatus,
    moneyReceived: "0",
    totalInvoice: "0",
    deadlineDate: "",
    initialNote: "",
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        const json = await res.json();
        if (json.leads) {
          const loadedLeads = (json.leads || []) as ServiceLead[];
          setLeads(loadedLeads);

          // Populate inputs
          const mInputs: Record<string, string> = {};
          const iInputs: Record<string, string> = {};
          const dInputs: Record<string, string> = {};
          loadedLeads.forEach((l) => {
            mInputs[l.id] = String(l.money_received ?? 0);
            iInputs[l.id] = String(l.total_invoice ?? l.money_received ?? 0);
            dInputs[l.id] = l.deadline_date || "";
          });
          setMoneyInputs(mInputs);
          setInvoiceInputs(iInputs);
          setDeadlineInputs(dInputs);

          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fallback to client Supabase
    const { data, error } = await supabase
      .from("service_leads")
      .select(`
        *,
        services (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load service leads");
      console.error(error);
    } else {
      const rawLeads = (data as unknown as ServiceLead[]) || [];
      const loadedLeads = rawLeads.filter(
        (l) =>
          !(
            l.phone === "0000000000" ||
            l.name === "Admin Blocked Slot" ||
            l.id?.startsWith("block_") ||
            l.id?.startsWith("mem_block_")
          )
      );
      setLeads(loadedLeads);

      const mInputs: Record<string, string> = {};
      const iInputs: Record<string, string> = {};
      const dInputs: Record<string, string> = {};
      loadedLeads.forEach((l) => {
        const mVal = String(l.money_received ?? (l.payment_status === "completed" ? 999 : 0));
        mInputs[l.id] = mVal;
        iInputs[l.id] = String(l.total_invoice ?? mVal);
        dInputs[l.id] = l.deadline_date || "";
      });
      setMoneyInputs(mInputs);
      setInvoiceInputs(iInputs);
      setDeadlineInputs(dInputs);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Helper to parse notes array safely
  const getNotes = (lead: ServiceLead): LeadNote[] => {
    if (!lead.notes_json) return [];
    if (Array.isArray(lead.notes_json)) return lead.notes_json;
    try {
      return JSON.parse(lead.notes_json);
    } catch {
      return [];
    }
  };

  // Helper to get status
  const getLeadStatus = (lead: ServiceLead): LeadStatus => {
    if (lead.lead_status && LEAD_STATUS_OPTIONS.includes(lead.lead_status)) {
      return lead.lead_status;
    }
    return "Follow Up Again";
  };

  // Filter leads by search, lead_status, and payment_status
  const filteredLeads = leads.filter((lead) => {
    const serviceName = lead.services?.title || "";
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.toLowerCase().includes(search.toLowerCase()) ||
      serviceName.toLowerCase().includes(search.toLowerCase());

    const status = getLeadStatus(lead);
    const matchesStatus =
      selectedStatusFilter === "all" || status === selectedStatusFilter;

    const isPaid = lead.payment_status === "completed";
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "completed" && isPaid) ||
      (paymentFilter === "pending" && !isPaid);

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate pagination (10 items per page)
  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLeads);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatusFilter, paymentFilter]);

  // Update lead status via Server API
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setActionLoading(`status_${leadId}`);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          leadId,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status");

      toast.success(`Status updated to "${newStatus}"`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus } : l))
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  // Save money received
  const handleSaveMoney = async (leadId: string) => {
    const rawVal = moneyInputs[leadId] ?? "0";
    const numVal = parseFloat(rawVal) || 0;

    setActionLoading(`money_${leadId}`);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_money",
          leadId,
          moneyReceived: numVal,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save money received");

      toast.success(`Money received saved: ₹${numVal.toLocaleString("en-IN")}`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, money_received: numVal } : l))
      );

      setSavedSuccess((prev) => ({ ...prev, [`m_${leadId}`]: true }));
      setTimeout(() => {
        setSavedSuccess((prev) => ({ ...prev, [`m_${leadId}`]: false }));
      }, 2000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving money");
    } finally {
      setActionLoading(null);
    }
  };

  // Save total invoice amount
  const handleSaveInvoice = async (leadId: string) => {
    const rawVal = invoiceInputs[leadId] ?? "0";
    const numVal = parseFloat(rawVal) || 0;

    setActionLoading(`invoice_${leadId}`);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_invoice",
          leadId,
          totalInvoice: numVal,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save total invoice");

      toast.success(`Total invoice saved: ₹${numVal.toLocaleString("en-IN")}`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, total_invoice: numVal } : l))
      );

      setSavedSuccess((prev) => ({ ...prev, [`i_${leadId}`]: true }));
      setTimeout(() => {
        setSavedSuccess((prev) => ({ ...prev, [`i_${leadId}`]: false }));
      }, 2000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving invoice");
    } finally {
      setActionLoading(null);
    }
  };

  // Save deadline date via calendar selection
  const handleSaveDeadline = async (leadId: string, deadlineDate: string) => {
    setActionLoading(`deadline_${leadId}`);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_deadline",
          leadId,
          deadlineDate,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save deadline");

      toast.success(
        deadlineDate
          ? `Deadline set to ${dayjs(deadlineDate).format("MMM D, YYYY")}`
          : "Deadline cleared"
      );

      setDeadlineInputs((prev) => ({ ...prev, [leadId]: deadlineDate }));
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, deadline_date: deadlineDate } : l))
      );

      setSavedSuccess((prev) => ({ ...prev, [`d_${leadId}`]: true }));
      setTimeout(() => {
        setSavedSuccess((prev) => ({ ...prev, [`d_${leadId}`]: false }));
      }, 2000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving deadline");
    } finally {
      setActionLoading(null);
      setCalendarTargetLead(null);
    }
  };

  // Add note with timestamp via Server API
  const handleAddNote = async (leadId: string) => {
    const text = (noteInputs[leadId] || "").trim();
    if (!text) return;

    setActionLoading(`note_${leadId}`);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_note",
          leadId,
          noteText: text,
          author: "Admin",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save note");

      toast.success("Note logged with day & time");
      const updatedNotes = json.notes || [];
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, notes_json: updatedNotes } : l
        )
      );
      setNoteInputs((prev) => ({ ...prev, [leadId]: "" }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error adding note");
    } finally {
      setActionLoading(null);
    }
  };

  // Add new lead manually
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) {
      toast.error("Name and phone number are required");
      return;
    }

    setActionLoading("create_lead");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_lead",
          leadData: {
            name: newLeadForm.name,
            phone: newLeadForm.phone,
            status: newLeadForm.status,
            moneyReceived: newLeadForm.moneyReceived,
            totalInvoice: newLeadForm.totalInvoice,
            deadlineDate: newLeadForm.deadlineDate,
            initialNote: newLeadForm.initialNote,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create lead");

      toast.success("New service lead created");
      if (json.lead) {
        setLeads((prev) => [json.lead, ...prev]);
      }
      setShowAddLeadModal(false);
      setNewLeadForm({
        name: "",
        phone: "",
        serviceTitle: "3D Design for Interiors and Exteriors",
        status: "Follow Up Again",
        moneyReceived: "0",
        totalInvoice: "0",
        deadlineDate: "",
        initialNote: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error creating lead");
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate Total Money Received across all leads (only completed payments)
  const totalMoneyReceived = leads.reduce((sum, l) => {
    if (l.payment_status !== "completed") return sum;
    const val =
      l.money_received !== undefined && l.money_received !== null
        ? l.money_received
        : 999;
    return sum + (typeof val === "number" ? val : parseFloat(val || "0"));
  }, 0);

  // Calculate Total Invoiced Amount across all completed leads
  const totalInvoicedAmount = leads.reduce((sum, l) => {
    if (l.payment_status !== "completed") return sum;
    const mVal =
      l.money_received !== undefined && l.money_received !== null
        ? l.money_received
        : 999;
    const iVal = l.total_invoice !== undefined && l.total_invoice !== null ? l.total_invoice : mVal;
    return sum + (typeof iVal === "number" ? iVal : parseFloat(iVal || "0"));
  }, 0);

  // Counts for payment status filter tabs
  const completedPaymentCount = leads.filter((l) => l.payment_status === "completed").length;
  const pendingPaymentCount = leads.filter((l) => l.payment_status !== "completed").length;

  // Status counts
  const statusCounts = {
    advance: leads.filter((l) => getLeadStatus(l) === "Advance Payment").length,
    floorPlan: leads.filter((l) => getLeadStatus(l) === "Floor Plan").length,
    design3d: leads.filter((l) => getLeadStatus(l) === "3D Design").length,
    followUp: leads.filter((l) => getLeadStatus(l) === "Follow Up Again").length,
    closed: leads.filter((l) => getLeadStatus(l) === "Closed").length,
  };

  const getStatusBadgeStyle = (status: LeadStatus) => {
    switch (status) {
      case "Advance Payment":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700";
      case "Floor Plan":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700";
      case "3D Design":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700";
      case "Follow Up Again":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700";
      case "Closed":
        return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // Helper for generating monthly calendar grid
  const renderCalendarDays = (targetLead: ServiceLead) => {
    const startOfMonth = calendarViewMonth.startOf("month");
    const endOfMonth = calendarViewMonth.endOf("month");
    const startDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = calendarViewMonth.daysInMonth();

    const selectedStr = deadlineInputs[targetLead.id] || targetLead.deadline_date || "";
    const todayStr = dayjs().format("YYYY-MM-DD");

    const days = [];

    // Empty cells for leading days
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty_${i}`} className="h-8" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = calendarViewMonth.date(day);
      const dateStr = dateObj.format("YYYY-MM-DD");
      const isSelected = selectedStr === dateStr;
      const isToday = todayStr === dateStr;

      days.push(
        <button
          key={dateStr}
          onClick={() => handleSaveDeadline(targetLead.id, dateStr)}
          className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
            isSelected
              ? "bg-amber-500 text-white font-bold shadow-md scale-105"
              : isToday
              ? "border border-amber-500 text-amber-400 font-bold bg-amber-500/10"
              : "hover:bg-muted text-foreground"
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6 w-full">
      {/* FINANCIAL METRICS & STATUS COUNTERS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {/* TOTAL MONEY RECEIVED COUNTER */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-400">
              Money Received
            </span>
            <span className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400">
              <IndianRupee className="size-4" />
            </span>
          </div>
          <p className="mt-1.5 text-xl font-black text-emerald-400">
            ₹{totalMoneyReceived.toLocaleString("en-IN")}
          </p>
        </div>

        {/* TOTAL INVOICED AMOUNT */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-400">
              Total Invoices
            </span>
            <span className="rounded-lg bg-blue-500/20 p-1.5 text-blue-400">
              <Receipt className="size-4" />
            </span>
          </div>
          <p className="mt-1.5 text-xl font-black text-blue-400">
            ₹{totalInvoicedAmount.toLocaleString("en-IN")}
          </p>
        </div>

        {/* STATUS COUNTERS */}
        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Advance Payment" ? "all" : "Advance Payment"
            )
          }
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shadow-sm ${
            selectedStatusFilter === "Advance Payment"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-border bg-card hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Advance</span>
            <span className="rounded-lg bg-emerald-500/10 p-1 text-emerald-400">
              <DollarSign className="size-3" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold">{statusCounts.advance}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Floor Plan" ? "all" : "Floor Plan"
            )
          }
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shadow-sm ${
            selectedStatusFilter === "Floor Plan"
              ? "border-blue-500 bg-blue-500/10"
              : "border-border bg-card hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Floor Plan</span>
            <span className="rounded-lg bg-blue-500/10 p-1 text-blue-400">
              <Layers className="size-3" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold">{statusCounts.floorPlan}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "3D Design" ? "all" : "3D Design"
            )
          }
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shadow-sm ${
            selectedStatusFilter === "3D Design"
              ? "border-purple-500 bg-purple-500/10"
              : "border-border bg-card hover:border-purple-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">3D Design</span>
            <span className="rounded-lg bg-purple-500/10 p-1 text-purple-400">
              <Sparkles className="size-3" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold">{statusCounts.design3d}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Follow Up Again" ? "all" : "Follow Up Again"
            )
          }
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shadow-sm ${
            selectedStatusFilter === "Follow Up Again"
              ? "border-amber-500 bg-amber-500/10"
              : "border-border bg-card hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Follow Up</span>
            <span className="rounded-lg bg-amber-500/10 p-1 text-amber-400">
              <Clock className="size-3" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold">{statusCounts.followUp}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Closed" ? "all" : "Closed"
            )
          }
          className={`cursor-pointer rounded-xl border p-3.5 transition-all shadow-sm ${
            selectedStatusFilter === "Closed"
              ? "border-zinc-400 bg-zinc-500/20"
              : "border-border bg-card hover:border-zinc-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Closed</span>
            <span className="rounded-lg bg-zinc-500/20 p-1 text-zinc-300">
              <CheckCircle2 className="size-3" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold">{statusCounts.closed}</p>
        </div>
      </div>

      {/* FILTER CONTROLS: PAYMENT STATUS TABS & LEAD STATUS BUTTONS */}
      <div className="flex flex-col gap-4">
        {/* PAYMENT FILTER TABS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment Status:
            </span>
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                onClick={() => setPaymentFilter("all")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  paymentFilter === "all"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Payments ({leads.length})
              </button>
              <button
                onClick={() => setPaymentFilter("completed")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                  paymentFilter === "completed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="size-3 text-emerald-400" />
                Completed Payments ({completedPaymentCount})
              </button>
              <button
                onClick={() => setPaymentFilter("pending")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                  paymentFilter === "pending"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="size-3 text-amber-400" />
                Pending Payments ({pendingPaymentCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchLeads()}
              className="h-8 w-8"
              title="Refresh Leads"
            >
              <RefreshCw className="size-3.5" />
            </Button>

            <Button
              size="default"
              onClick={() => setShowAddLeadModal(true)}
              className="h-8 text-xs gap-1.5"
            >
              <PlusCircle className="size-3.5" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* WORKFLOW STATUS BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Status:
          </span>
          <Button
            variant={selectedStatusFilter === "all" ? "default" : "outline"}
            size="default"
            onClick={() => setSelectedStatusFilter("all")}
            className="text-xs h-7 px-2.5"
          >
            All Statuses
          </Button>
          {LEAD_STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt}
              variant={selectedStatusFilter === opt ? "default" : "outline"}
              size="default"
              onClick={() => setSelectedStatusFilter(opt)}
              className="text-xs h-7 px-2.5"
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      {/* FULL-WIDTH TABLE ON PC (ZERO HORIZONTAL SCROLLBAR) */}
      <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-x-auto sm:overflow-x-visible">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No service leads match the selected filters.
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[190px]">Client &amp; Service</TableHead>
                <TableHead className="min-w-[120px]">Appointment</TableHead>
                <TableHead className="min-w-[130px]">Payment</TableHead>
                <TableHead className="min-w-[180px]">Money Received &amp; Invoice (₹)</TableHead>
                <TableHead className="min-w-[150px]">Deadline Calendar</TableHead>
                <TableHead className="min-w-[150px]">Status (Select)</TableHead>
                <TableHead className="text-right min-w-[90px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const status = getLeadStatus(lead);
                const notesList = getNotes(lead);
                const isExpanded = !!expandedNotes[lead.id];
                const isPaid = lead.payment_status === "completed";
                const moneyVal = moneyInputs[lead.id] ?? String(lead.money_received ?? 0);
                const invoiceVal = invoiceInputs[lead.id] ?? String(lead.total_invoice ?? moneyVal);
                const deadlineVal = deadlineInputs[lead.id] ?? lead.deadline_date ?? "";

                const numMoney = parseFloat(moneyVal) || 0;
                const numInvoice = parseFloat(invoiceVal) || 0;
                const pendingBalance = Math.max(0, numInvoice - numMoney);

                const isMoneySaved = !!savedSuccess[`m_${lead.id}`];
                const isInvoiceSaved = !!savedSuccess[`i_${lead.id}`];
                const waUrl = getWhatsAppUrl(lead.phone);

                return (
                  <React.Fragment key={lead.id}>
                    <TableRow className="align-top hover:bg-muted/20">
                      {/* Service & Client Info */}
                      <TableCell className="py-3">
                        <div className="font-semibold text-sm text-foreground">
                          {lead.services?.title || "Consultation Service"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">{lead.name}</span>
                          <span>•</span>
                          <Phone className="size-3 text-muted-foreground shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {dayjs(lead.created_at).format("MMM D, YYYY [at] h:mm A")}
                        </div>
                      </TableCell>

                      {/* Appointment Slot */}
                      <TableCell className="py-3 text-xs">
                        {lead.appointment_date ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CalendarDays className="size-3 shrink-0" />
                              {dayjs(lead.appointment_date).format("MMM D, YYYY")}
                            </div>
                            {lead.appointment_time && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3 shrink-0" />
                                {lead.appointment_time}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Payment Status Badge & Small WhatsApp Icon */}
                      <TableCell className="py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                            Completed
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                              Pending
                            </span>

                            {/* SMALL WHATSAPP ICON FOR PENDING ORDERS */}
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-transform hover:scale-110 shadow-sm"
                              title="Send WhatsApp Follow Up message"
                            >
                              <MessageCircle className="size-3.5 fill-white text-emerald-600" />
                            </a>
                          </div>
                        )}
                      </TableCell>

                      {/* Money Received & Total Invoice Entry Boxes (ONLY SHOWN WHEN PAYMENT IS COMPLETED) */}
                      <TableCell className="py-3">
                        {isPaid ? (
                          <div className="space-y-2">
                            {/* Money Received Box */}
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-muted-foreground w-12 shrink-0 font-medium">Recd:</span>
                              <div className="relative flex items-center flex-1">
                                <span className="absolute left-2 text-xs font-bold text-emerald-500">₹</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={moneyVal}
                                  onChange={(e) =>
                                    setMoneyInputs({
                                      ...moneyInputs,
                                      [lead.id]: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-md border border-input bg-background pl-6 pr-2 py-0.5 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleSaveMoney(lead.id)}
                                disabled={actionLoading === `money_${lead.id}`}
                                className="size-6 shrink-0 text-emerald-500 hover:text-emerald-400"
                                title="Save Money Received"
                              >
                                {actionLoading === `money_${lead.id}` ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : isMoneySaved ? (
                                  <Check className="size-3 text-emerald-400" />
                                ) : (
                                  <Save className="size-3" />
                                )}
                              </Button>
                            </div>

                            {/* Total Invoice Box */}
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-muted-foreground w-12 shrink-0 font-medium">Invoice:</span>
                              <div className="relative flex items-center flex-1">
                                <span className="absolute left-2 text-xs font-bold text-blue-500">₹</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={invoiceVal}
                                  onChange={(e) =>
                                    setInvoiceInputs({
                                      ...invoiceInputs,
                                      [lead.id]: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-md border border-input bg-background pl-6 pr-2 py-0.5 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleSaveInvoice(lead.id)}
                                disabled={actionLoading === `invoice_${lead.id}`}
                                className="size-6 shrink-0 text-blue-500 hover:text-blue-400"
                                title="Save Total Invoice Amount"
                              >
                                {actionLoading === `invoice_${lead.id}` ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : isInvoiceSaved ? (
                                  <Check className="size-3 text-blue-400" />
                                ) : (
                                  <Save className="size-3" />
                                )}
                              </Button>
                            </div>

                            {/* Pending Expected Balance indicator */}
                            {pendingBalance > 0 && (
                              <div className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                                <AlertCircle className="size-3 shrink-0" />
                                Due: ₹{pendingBalance.toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs font-medium italic">—</span>
                        )}
                      </TableCell>

                      {/* DEADLINE DATE ENTRY VIA INTERACTIVE CALENDAR MODAL */}
                      <TableCell className="py-3">
                        {isPaid ? (
                          <div>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => {
                                setCalendarTargetLead(lead);
                                const curD = deadlineVal ? dayjs(deadlineVal) : dayjs();
                                setCalendarViewMonth(curD);
                              }}
                              className={`h-8 text-xs font-semibold gap-1.5 transition-all ${
                                deadlineVal
                                  ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <CalendarIcon className="size-3.5 text-amber-500" />
                              {deadlineVal ? dayjs(deadlineVal).format("MMM D, YYYY") : "Set Deadline"}
                            </Button>

                            {deadlineVal && (
                              <div className="text-[10px] text-amber-500 font-medium mt-1">
                                Target Deadline
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs font-medium italic">—</span>
                        )}
                      </TableCell>

                      {/* Status Dropdown Selector */}
                      <TableCell className="py-3">
                        <select
                          value={status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          disabled={actionLoading === `status_${lead.id}`}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer outline-none transition ${getStatusBadgeStyle(
                            status
                          )}`}
                        >
                          {LEAD_STATUS_OPTIONS.map((opt) => (
                            <option
                              key={opt}
                              value={opt}
                              className="bg-background text-foreground font-medium"
                            >
                              {opt}
                            </option>
                          ))}
                        </select>
                        {actionLoading === `status_${lead.id}` && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Updating...
                          </div>
                        )}
                      </TableCell>

                      {/* Notes Button */}
                      <TableCell className="py-3 text-right">
                        <Button
                          variant={isExpanded ? "default" : "outline"}
                          size="default"
                          onClick={() =>
                            setExpandedNotes((prev) => ({
                              ...prev,
                              [lead.id]: !prev[lead.id],
                            }))
                          }
                          className="h-8 text-xs gap-1.5"
                        >
                          <FileText className="size-3.5" />
                          Notes ({notesList.length})
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* EXPANDABLE INLINE FULL-WIDTH NOTES LOGGER ROW */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30 border-b border-border">
                        <TableCell colSpan={7} className="p-4">
                          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                <span className="font-bold text-sm">
                                  Notes &amp; Timestamp Logs for {lead.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">
                                {notesList.length} {notesList.length === 1 ? "entry" : "entries"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column: Note Input Form */}
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-foreground">
                                  Log New Note (Saves with exact day &amp; time)
                                </label>
                                <textarea
                                  placeholder="Type notes here (e.g. Client requested 3D elevation changes, advance paid ₹5,000...)"
                                  value={noteInputs[lead.id] || ""}
                                  onChange={(e) =>
                                    setNoteInputs((prev) => ({
                                      ...prev,
                                      [lead.id]: e.target.value,
                                    }))
                                  }
                                  rows={3}
                                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                                />
                                <div className="flex justify-end">
                                  <Button
                                    size="default"
                                    onClick={() => handleAddNote(lead.id)}
                                    disabled={
                                      !noteInputs[lead.id] ||
                                      !noteInputs[lead.id].trim() ||
                                      actionLoading === `note_${lead.id}`
                                    }
                                    className="h-8 text-xs gap-1.5"
                                  >
                                    <Send className="size-3.5" />
                                    {actionLoading === `note_${lead.id}`
                                      ? "Saving Note..."
                                      : "Log Note"}
                                  </Button>
                                </div>
                              </div>

                              {/* Right Column: Historical Logs Timeline */}
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-foreground">
                                  Logged History
                                </label>
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                  {notesList.length > 0 ? (
                                    notesList.map((note) => (
                                      <div
                                        key={note.id}
                                        className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs space-y-1"
                                      >
                                        <div className="flex items-center justify-between text-[11px] text-primary font-semibold">
                                          <span>📅 {note.formattedTime || formatLogTimestamp(note.createdAt)}</span>
                                          {note.author && (
                                            <span className="text-muted-foreground text-[10px]">
                                              by {note.author}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                          {note.text}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                                      No notes logged yet for this lead. Type a note on the left and click &quot;Log Note&quot;.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* PAGINATION CONTROLS (10 PER PAGE) */}
        {!loading && totalLeads > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
              <span className="font-semibold text-foreground">{totalLeads}</span> service leads
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="default"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={safeCurrentPage === pageNum ? "default" : "ghost"}
                    size="default"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 w-8 text-xs font-semibold p-0"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="default"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={safeCurrentPage === totalPages}
                className="h-8 text-xs gap-1"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE DEADLINE CALENDAR PICKER MODAL */}
      {calendarTargetLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Set Project Deadline
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Client: <span className="font-semibold text-foreground">{calendarTargetLead.name}</span>
                </p>
              </div>
              <button
                onClick={() => setCalendarTargetLead(null)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* CALENDAR MONTH NAVIGATOR */}
            <div className="flex items-center justify-between px-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCalendarViewMonth((prev) => prev.subtract(1, "month"))
                }
                className="h-7 w-7"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-sm font-bold text-foreground">
                {calendarViewMonth.format("MMMM YYYY")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCalendarViewMonth((prev) => prev.add(1, "month"))
                }
                className="h-7 w-7"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* WEEKDAY HEADERS */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted-foreground">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* MONTHLY CALENDAR DAY GRID */}
            <div className="grid grid-cols-7 gap-1 place-items-center">
              {renderCalendarDays(calendarTargetLead)}
            </div>

            {/* QUICK PRESET BUTTONS */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() =>
                    handleSaveDeadline(calendarTargetLead.id, dayjs().format("YYYY-MM-DD"))
                  }
                  className="h-7 text-[10px] px-2"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() =>
                    handleSaveDeadline(
                      calendarTargetLead.id,
                      dayjs().add(7, "day").format("YYYY-MM-DD")
                    )
                  }
                  className="h-7 text-[10px] px-2"
                >
                  +7 Days
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() =>
                    handleSaveDeadline(
                      calendarTargetLead.id,
                      dayjs().add(14, "day").format("YYYY-MM-DD")
                    )
                  }
                  className="h-7 text-[10px] px-2"
                >
                  +14 Days
                </Button>
              </div>

              <Button
                variant="ghost"
                size="default"
                onClick={() => handleSaveDeadline(calendarTargetLead.id, "")}
                className="h-7 text-[10px] px-2 text-destructive hover:bg-destructive/10"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold">Add New Service Lead</h3>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ankit Sharma"
                  value={newLeadForm.name}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, name: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newLeadForm.phone}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, phone: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Recd (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="999"
                    value={newLeadForm.moneyReceived}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, moneyReceived: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Invoice (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={newLeadForm.totalInvoice}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, totalInvoice: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newLeadForm.deadlineDate}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, deadlineDate: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Initial Status
                </label>
                <select
                  value={newLeadForm.status}
                  onChange={(e) =>
                    setNewLeadForm({
                      ...newLeadForm,
                      status: e.target.value as LeadStatus,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background p-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                >
                  {LEAD_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Initial Note (Log date &amp; time)
                </label>
                <textarea
                  rows={2}
                  placeholder="Log initial notes about client request..."
                  value={newLeadForm.initialNote}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, initialNote: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setShowAddLeadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="default"
                  disabled={actionLoading === "create_lead"}
                >
                  {actionLoading === "create_lead" ? "Saving..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
