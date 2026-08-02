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
  Calendar,
  IndianRupee,
  Save,
  Check,
  MessageCircle,
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Notes state
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Money & Deadline editing state per lead
  const [moneyInputs, setMoneyInputs] = useState<Record<string, string>>({});
  const [deadlineInputs, setDeadlineInputs] = useState<Record<string, string>>({});

  // Saved feedback highlights
  const [savedSuccess, setSavedSuccess] = useState<Record<string, boolean>>({});

  // New lead form modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    serviceTitle: "3D Design for Interiors and Exteriors",
    status: "Follow Up Again" as LeadStatus,
    moneyReceived: "0",
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
          const dInputs: Record<string, string> = {};
          loadedLeads.forEach((l) => {
            mInputs[l.id] = String(l.money_received ?? 0);
            dInputs[l.id] = l.deadline_date || "";
          });
          setMoneyInputs(mInputs);
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
      const loadedLeads = (data as unknown as ServiceLead[]) || [];
      setLeads(loadedLeads);

      const mInputs: Record<string, string> = {};
      const dInputs: Record<string, string> = {};
      loadedLeads.forEach((l) => {
        mInputs[l.id] = String(l.money_received ?? (l.payment_status === "completed" ? 999 : 0));
        dInputs[l.id] = l.deadline_date || "";
      });
      setMoneyInputs(mInputs);
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

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const serviceName = lead.services?.title || "";
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.toLowerCase().includes(search.toLowerCase()) ||
      serviceName.toLowerCase().includes(search.toLowerCase());

    const status = getLeadStatus(lead);
    const matchesStatus =
      selectedStatusFilter === "all" || status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
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
  }, [search, selectedStatusFilter]);

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

  // Save deadline date
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
          ? `Deadline updated to ${dayjs(deadlineDate).format("MMM D, YYYY")}`
          : "Deadline cleared"
      );
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

  // Calculate Total Money Received across all leads (only for completed payments)
  const totalMoneyReceived = leads.reduce((sum, l) => {
    if (l.payment_status !== "completed") return sum;
    const val =
      l.money_received !== undefined && l.money_received !== null
        ? l.money_received
        : 999;
    return sum + (typeof val === "number" ? val : parseFloat(val || "0"));
  }, 0);

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

  return (
    <div className="space-y-6 w-full">
      {/* TOTAL MONEY RECEIVED BANNER & STATUS COUNTERS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* TOTAL MONEY RECEIVED COUNTER */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">
              Total Money Received
            </span>
            <span className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
              <IndianRupee className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            ₹{totalMoneyReceived.toLocaleString("en-IN")}
          </p>
        </div>

        {/* STATUS COUNTERS */}
        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Advance Payment" ? "all" : "Advance Payment"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Advance Payment"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-border bg-card hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Advance</span>
            <span className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
              <DollarSign className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold">{statusCounts.advance}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Floor Plan" ? "all" : "Floor Plan"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Floor Plan"
              ? "border-blue-500 bg-blue-500/10"
              : "border-border bg-card hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Floor Plan</span>
            <span className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
              <Layers className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold">{statusCounts.floorPlan}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "3D Design" ? "all" : "3D Design"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "3D Design"
              ? "border-purple-500 bg-purple-500/10"
              : "border-border bg-card hover:border-purple-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">3D Design</span>
            <span className="rounded-lg bg-purple-500/10 p-1.5 text-purple-400">
              <Sparkles className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold">{statusCounts.design3d}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Follow Up Again" ? "all" : "Follow Up Again"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Follow Up Again"
              ? "border-amber-500 bg-amber-500/10"
              : "border-border bg-card hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Follow Up</span>
            <span className="rounded-lg bg-amber-500/10 p-1.5 text-amber-400">
              <Clock className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold">{statusCounts.followUp}</p>
        </div>

        {/* CLOSED STATUS COUNTER */}
        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Closed" ? "all" : "Closed"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Closed"
              ? "border-zinc-400 bg-zinc-500/20"
              : "border-border bg-card hover:border-zinc-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Closed</span>
            <span className="rounded-lg bg-zinc-500/20 p-1.5 text-zinc-300">
              <CheckCircle2 className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xl font-bold">{statusCounts.closed}</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={selectedStatusFilter === "all" ? "default" : "outline"}
            size="default"
            onClick={() => setSelectedStatusFilter("all")}
            className="text-xs h-8"
          >
            All Leads ({leads.length})
          </Button>
          {LEAD_STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt}
              variant={selectedStatusFilter === opt ? "default" : "outline"}
              size="default"
              onClick={() => setSelectedStatusFilter(opt)}
              className="text-xs h-8"
            >
              {opt}
            </Button>
          ))}
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

      {/* FULL-WIDTH TABLE ON PC (ZERO HORIZONTAL SCROLLBAR) */}
      <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-x-auto sm:overflow-x-visible">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No service leads found.
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[200px]">Client &amp; Service</TableHead>
                <TableHead className="min-w-[130px]">Appointment</TableHead>
                <TableHead className="min-w-[140px]">Payment Status</TableHead>
                <TableHead className="min-w-[140px]">Money Received (₹)</TableHead>
                <TableHead className="min-w-[140px]">Deadline Date</TableHead>
                <TableHead className="min-w-[150px]">Status (Select)</TableHead>
                <TableHead className="text-right min-w-[100px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const status = getLeadStatus(lead);
                const notesList = getNotes(lead);
                const isExpanded = !!expandedNotes[lead.id];
                const isPaid = lead.payment_status === "completed";
                const moneyVal = moneyInputs[lead.id] ?? String(lead.money_received ?? 0);
                const deadlineVal = deadlineInputs[lead.id] ?? lead.deadline_date ?? "";
                const isMoneySaved = !!savedSuccess[`m_${lead.id}`];
                const isDeadlineSaved = !!savedSuccess[`d_${lead.id}`];
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

                      {/* Payment Status Badge & WhatsApp Follow Up Button */}
                      <TableCell className="py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                            Completed
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                              Pending
                            </span>

                            {/* 1-CLICK WHATSAPP FOLLOW UP BUTTON FOR PENDING ORDERS */}
                            <div>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:scale-[1.02]"
                                title="Click to open WhatsApp with pre-filled follow up message"
                              >
                                <MessageCircle className="size-3.5 fill-white text-emerald-600" />
                                WhatsApp Follow Up
                              </a>
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Money Received Entry Box (ONLY SHOWN WHEN PAYMENT IS COMPLETED) */}
                      <TableCell className="py-3">
                        {isPaid ? (
                          <div className="flex items-center gap-1.5">
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
                                className="w-full rounded-md border border-input bg-background pl-6 pr-2 py-1 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleSaveMoney(lead.id)}
                              disabled={actionLoading === `money_${lead.id}`}
                              className="size-7 shrink-0 text-emerald-500 hover:text-emerald-400"
                              title="Save Money Received"
                            >
                              {actionLoading === `money_${lead.id}` ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : isMoneySaved ? (
                                <Check className="size-3.5 text-emerald-400" />
                              ) : (
                                <Save className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs font-medium italic">—</span>
                        )}
                      </TableCell>

                      {/* Deadline Date Entry (ONLY SHOWN WHEN PAYMENT IS COMPLETED) */}
                      <TableCell className="py-3">
                        {isPaid ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={deadlineVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDeadlineInputs({ ...deadlineInputs, [lead.id]: val });
                                  handleSaveDeadline(lead.id, val);
                                }}
                                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              />
                              {isDeadlineSaved && (
                                <Check className="size-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            {deadlineVal && (
                              <div className="text-[10px] text-amber-500 font-medium mt-1 flex items-center gap-1">
                                <Calendar className="size-3 shrink-0" />
                                Target: {dayjs(deadlineVal).format("MMM D, YYYY")}
                              </div>
                            )}
                          </>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Money Received (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="999"
                    value={newLeadForm.moneyReceived}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, moneyReceived: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Deadline Date
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
