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
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  | "Follow Up Again";

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  "Advance Payment",
  "Floor Plan",
  "3D Design",
  "Follow Up Again",
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
  services: Pick<Service, "title"> | null;
};

function formatLogTimestamp(isoStr: string): string {
  const d = dayjs(isoStr);
  return d.format("ddd, MMM D, YYYY [at] h:mm A");
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

  // New lead form modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    serviceTitle: "3D Design for Interiors and Exteriors",
    status: "Advance Payment" as LeadStatus,
    initialNote: "",
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
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
      setLeads((data as unknown as ServiceLead[]) || []);
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

  // Helper to get effective status
  const getLeadStatus = (lead: ServiceLead): LeadStatus => {
    if (lead.lead_status && LEAD_STATUS_OPTIONS.includes(lead.lead_status)) {
      return lead.lead_status;
    }
    if (lead.payment_status === "completed") {
      return "Advance Payment";
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

  // Update lead status in Supabase
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setActionLoading(`status_${leadId}`);
    try {
      const { error } = await supabase
        .from("service_leads")
        .update({ lead_status: newStatus })
        .eq("id", leadId);

      if (error) {
        toast.error("Failed to update status");
        console.error(error);
      } else {
        toast.success(`Status updated to "${newStatus}"`);
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    } finally {
      setActionLoading(null);
    }
  };

  // Add note with timestamp
  const handleAddNote = async (leadId: string) => {
    const text = (noteInputs[leadId] || "").trim();
    if (!text) return;

    setActionLoading(`note_${leadId}`);
    try {
      const targetLead = leads.find((l) => l.id === leadId);
      if (!targetLead) return;

      const currentNotes = getNotes(targetLead);
      const nowISO = new Date().toISOString();
      const newNote: LeadNote = {
        id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        text,
        createdAt: nowISO,
        formattedTime: formatLogTimestamp(nowISO),
        author: "Admin",
      };

      const updatedNotes = [newNote, ...currentNotes];

      const { error } = await supabase
        .from("service_leads")
        .update({ notes_json: JSON.stringify(updatedNotes) })
        .eq("id", leadId);

      if (error) {
        toast.error("Failed to save note");
        console.error(error);
      } else {
        toast.success("Note logged with day & time");
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, notes_json: updatedNotes } : l
          )
        );
        setNoteInputs((prev) => ({ ...prev, [leadId]: "" }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding note");
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
      const nowISO = new Date().toISOString();
      const initialNotes: LeadNote[] = [];
      if (newLeadForm.initialNote.trim()) {
        initialNotes.push({
          id: "note_" + Date.now(),
          text: newLeadForm.initialNote.trim(),
          createdAt: nowISO,
          formattedTime: formatLogTimestamp(nowISO),
          author: "Admin",
        });
      }

      const { data, error } = await supabase
        .from("service_leads")
        .insert({
          id: crypto.randomUUID(),
          name: newLeadForm.name.trim(),
          phone: newLeadForm.phone.trim(),
          payment_status: "completed",
          lead_status: newLeadForm.status,
          notes_json: JSON.stringify(initialNotes),
          created_at: nowISO,
        })
        .select(`
          *,
          services (
            title
          )
        `)
        .single();

      if (error) {
        toast.error("Failed to create lead");
        console.error(error);
      } else {
        toast.success("New service lead created");
        setLeads((prev) => [data as unknown as ServiceLead, ...prev]);
        setShowAddLeadModal(false);
        setNewLeadForm({
          name: "",
          phone: "",
          serviceTitle: "3D Design for Interiors and Exteriors",
          status: "Advance Payment",
          initialNote: "",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating lead");
    } finally {
      setActionLoading(null);
    }
  };

  // Status counts
  const statusCounts = {
    advance: leads.filter((l) => getLeadStatus(l) === "Advance Payment").length,
    floorPlan: leads.filter((l) => getLeadStatus(l) === "Floor Plan").length,
    design3d: leads.filter((l) => getLeadStatus(l) === "3D Design").length,
    followUp: leads.filter((l) => getLeadStatus(l) === "Follow Up Again").length,
  };

  const getStatusBadgeStyle = (status: LeadStatus) => {
    switch (status) {
      case "Advance Payment":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50";
      case "Floor Plan":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/50";
      case "3D Design":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/50";
      case "Follow Up Again":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* STATUS STATS CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Advance Payment" ? "all" : "Advance Payment"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Advance Payment"
              ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-500"
              : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Advance Payment</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">{statusCounts.advance}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Floor Plan" ? "all" : "Floor Plan"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Floor Plan"
              ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-500"
              : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Floor Plan</span>
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Layers className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">{statusCounts.floorPlan}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "3D Design" ? "all" : "3D Design"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "3D Design"
              ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 dark:border-purple-500"
              : "border-border bg-card hover:border-purple-300 dark:hover:border-purple-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">3D Design</span>
            <span className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">{statusCounts.design3d}</p>
        </div>

        <div
          onClick={() =>
            setSelectedStatusFilter(
              selectedStatusFilter === "Follow Up Again" ? "all" : "Follow Up Again"
            )
          }
          className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
            selectedStatusFilter === "Follow Up Again"
              ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-500"
              : "border-border bg-card hover:border-amber-300 dark:hover:border-amber-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Follow Up Again</span>
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">{statusCounts.followUp}</p>
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

      {/* TABLE WITH 10 LEADS PER PAGE */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No service leads found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px]">Client Info</TableHead>
                <TableHead>Requested Service</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-[180px]">Status (Click to Change)</TableHead>
                <TableHead className="text-right">Notes & Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const status = getLeadStatus(lead);
                const notesList = getNotes(lead);
                const isExpanded = !!expandedNotes[lead.id];

                return (
                  <TableRow key={lead.id} className="align-top">
                    {/* Client Info */}
                    <TableCell className="py-3">
                      <div className="font-semibold text-sm">{lead.name}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Phone className="size-3" />
                        <span>{lead.phone}</span>
                      </div>
                    </TableCell>

                    {/* Requested Service */}
                    <TableCell className="py-3">
                      {lead.services?.title ? (
                        <span className="font-medium text-xs">
                          {lead.services.title}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Consultation Call
                        </span>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {dayjs(lead.created_at).format("MMM D, YYYY [at] h:mm A")}
                      </div>
                    </TableCell>

                    {/* Appointment Slot */}
                    <TableCell className="py-3 text-xs">
                      {lead.appointment_date ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            {dayjs(lead.appointment_date).format("MMM D, YYYY")}
                          </div>
                          {lead.appointment_time && (
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {lead.appointment_time}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell className="py-3">
                      {lead.payment_status === "completed" ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-400/20">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-700/10 dark:bg-amber-950/60 dark:text-amber-400 dark:ring-amber-400/20">
                          Pending
                        </span>
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
                        className={`w-full rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none transition ${getStatusBadgeStyle(
                          status
                        )}`}
                      >
                        {LEAD_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="bg-background text-foreground font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    {/* Notes & Logs Action */}
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
                        className="h-7 text-xs gap-1.5"
                      >
                        <FileText className="size-3.5" />
                        Notes ({notesList.length})
                      </Button>

                      {/* Expandable Notes Logger Panel */}
                      {isExpanded && (
                        <div className="mt-3 text-left rounded-lg border border-border bg-muted/40 p-3 shadow-md space-y-3 min-w-[260px]">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="font-semibold text-xs flex items-center gap-1.5">
                              <Clock className="size-3 text-primary" />
                              Notes &amp; Timestamp Logs
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {notesList.length} {notesList.length === 1 ? "entry" : "entries"}
                            </span>
                          </div>

                          {/* Notes Input Form */}
                          <div className="space-y-2">
                            <textarea
                              placeholder="Enter details to log (e.g. Discussed 3D floor plan layout, scheduled follow-up call...)"
                              value={noteInputs[lead.id] || ""}
                              onChange={(e) =>
                                setNoteInputs((prev) => ({
                                  ...prev,
                                  [lead.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
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
                                className="h-7 text-xs gap-1"
                              >
                                <Send className="size-3" />
                                {actionLoading === `note_${lead.id}`
                                  ? "Logging..."
                                  : "Log Note"}
                              </Button>
                            </div>
                          </div>

                          {/* Timeline List of Logged Notes */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {notesList.length > 0 ? (
                              notesList.map((note) => (
                                <div
                                  key={note.id}
                                  className="rounded-md border border-border bg-background p-2 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-primary font-medium">
                                    <span>📅 {note.formattedTime || formatLogTimestamp(note.createdAt)}</span>
                                    {note.author && (
                                      <span className="text-muted-foreground">
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
                              <p className="text-center text-[11px] text-muted-foreground py-2">
                                No notes logged yet. Enter details above to log with day &amp; time.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
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

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Status
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
