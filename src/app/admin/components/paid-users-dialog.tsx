"use client";

import dayjs from "dayjs";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Phone,
  Search,
  Users,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

export interface CompletedPaymentLead {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string;
  appointment_date?: string | null;
  appointment_time?: string | null;
  razorpay_order_id?: string | null;
  money_received?: number | null;
  total_invoice?: number | null;
  lead_status?: string | null;
}

interface Service {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category?: string | null;
}

interface PaidUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  leads: CompletedPaymentLead[];
}

export function parseLeadName(rawName: string) {
  let cleanName = rawName || "Unnamed User";
  let txnId: string | null = null;
  let apptInfo: string | null = null;

  const txnMatch = cleanName.match(/\(TXN:\s*([^)]+)\)/i);
  if (txnMatch) {
    txnId = txnMatch[1].trim();
    cleanName = cleanName.replace(txnMatch[0], "").trim();
  }

  const apptMatch = cleanName.match(/\(Appt:\s*([^)]+)\)/i);
  if (apptMatch) {
    apptInfo = apptMatch[1].trim();
    cleanName = cleanName.replace(apptMatch[0], "").trim();
  }

  cleanName = cleanName.replace(/\(CAL_ERR:[^)]+\)/i, "").trim();

  return {
    cleanName: cleanName || rawName,
    txnId,
    apptInfo,
  };
}

function getWhatsAppUrl(phone: string, serviceTitle: string, clientName: string) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  const msg = `Hi ${clientName}, Ar Shagun this side regarding your booking for "${serviceTitle}". Let me know if you have any questions!`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

export function PaidUsersDialog({
  open,
  onOpenChange,
  service,
  leads,
}: PaidUsersDialogProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter leads for this service
  const serviceLeads = useMemo(() => {
    if (!service) return [];
    return leads.filter((l) => l.service_id === service.id);
  }, [leads, service]);

  // Filter by search term
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return serviceLeads;

    return serviceLeads.filter((lead) => {
      const parsed = parseLeadName(lead.name);
      const phoneDigits = lead.phone.replace(/\D/g, "");
      const matchName = parsed.cleanName.toLowerCase().includes(q);
      const matchRawName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone.toLowerCase().includes(q) || phoneDigits.includes(q);
      const matchTxn = parsed.txnId?.toLowerCase().includes(q) || lead.razorpay_order_id?.toLowerCase().includes(q);
      const matchStatus = lead.lead_status?.toLowerCase().includes(q);
      const matchAppt = parsed.apptInfo?.toLowerCase().includes(q) || (lead.appointment_date && lead.appointment_date.includes(q));

      return matchName || matchRawName || matchPhone || matchTxn || matchStatus || matchAppt;
    });
  }, [serviceLeads, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Reset page when search or service changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, service]);

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyAllPhones = () => {
    if (filteredLeads.length === 0) return;
    const phoneList = filteredLeads
      .map((l) => l.phone.trim())
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(phoneList);
    toast.success(`Copied ${filteredLeads.length} phone numbers to clipboard!`);
  };

  const handleExportCSV = () => {
    if (!service || filteredLeads.length === 0) return;

    const headers = [
      "Client Name",
      "Phone",
      "Transaction ID",
      "Order ID",
      "Paid At",
      "Appointment Date",
      "Appointment Time",
      "Amount",
      "Status",
    ];

    const rows = filteredLeads.map((lead) => {
      const parsed = parseLeadName(lead.name);
      return [
        `"${parsed.cleanName.replace(/"/g, '""')}"`,
        `"${lead.phone.replace(/"/g, '""')}"`,
        `"${(parsed.txnId || "").replace(/"/g, '""')}"`,
        `"${(lead.razorpay_order_id || "").replace(/"/g, '""')}"`,
        `"${lead.paid_at ? dayjs(lead.paid_at).format("YYYY-MM-DD HH:mm:ss") : dayjs(lead.created_at).format("YYYY-MM-DD HH:mm:ss")}"`,
        `"${(lead.appointment_date || parsed.apptInfo || "").replace(/"/g, '""')}"`,
        `"${(lead.appointment_time || "").replace(/"/g, '""')}"`,
        `"${lead.money_received || service.amount}"`,
        `"${(lead.lead_status || "Closed").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const sanitizedTitle = service.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    link.setAttribute("download", `paid_users_${sanitizedTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const totalCalculatedRevenue = useMemo(() => {
    if (!service) return 0;
    return serviceLeads.reduce((acc, lead) => {
      const val = lead.money_received ?? service.amount;
      return acc + (typeof val === "number" ? val : parseFloat(val) || service.amount);
    }, 0);
  }, [serviceLeads, service]);

  const getStatusBadgeClass = (status?: string | null) => {
    switch (status) {
      case "Advance Payment":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Floor Plan":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "3D Design":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Follow Up Again":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "Closed":
        return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 gap-5">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Completed Payments
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                  {service.title}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7 px-3 text-xs font-semibold gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                <Users className="size-3.5" />
                <span>{serviceLeads.length} Paid Users</span>
              </Badge>
              <Badge variant="outline" className="h-7 px-3 text-xs font-semibold gap-1.5 border-border bg-card">
                <CreditCard className="size-3.5 text-primary" />
                <span>₹{totalCalculatedRevenue.toLocaleString("en-IN")} Total</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar: Search + Quick Export Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, txn..."
              className="pl-9 pr-8 h-9 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="default"
              onClick={handleCopyAllPhones}
              disabled={filteredLeads.length === 0}
              className="h-9 text-xs gap-1.5"
              title="Copy all filtered phone numbers"
            >
              <Copy className="size-3.5" />
              Copy Phones
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="h-9 text-xs gap-1.5"
              title="Export paid users list to CSV"
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
          {filteredLeads.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground space-y-1.5">
              <Users className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-medium text-foreground">
                {serviceLeads.length === 0
                  ? "No completed payments found for this service yet."
                  : `No users found matching "${search}"`}
              </p>
              {serviceLeads.length > 0 && search && (
                <Button variant="link" size="default" onClick={() => setSearch("")} className="text-xs">
                  Clear search query
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="min-w-[190px] text-xs">Client Name &amp; TXN</TableHead>
                  <TableHead className="min-w-[170px] text-xs">Phone &amp; Contact</TableHead>
                  <TableHead className="min-w-[140px] text-xs">Paid On</TableHead>
                  <TableHead className="min-w-[150px] text-xs">Appointment Slot</TableHead>
                  <TableHead className="w-28 text-center text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead, idx) => {
                  const serialIndex = (currentPage - 1) * pageSize + idx + 1;
                  const parsed = parseLeadName(lead.name);
                  const isCopiedTxn = copiedId === `txn_${lead.id}`;
                  const isCopiedPhone = copiedId === `phone_${lead.id}`;
                  const waUrl = getWhatsAppUrl(lead.phone, service.title, parsed.cleanName);
                  const paidDateStr = lead.paid_at || lead.created_at;

                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/30">
                      {/* Index */}
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {serialIndex}
                      </TableCell>

                      {/* Name & TXN ID */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-sm text-foreground">
                          {parsed.cleanName}
                        </div>
                        {parsed.txnId ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-[11px] text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded border border-border/60">
                              {parsed.txnId}
                            </span>
                            <button
                              onClick={() => handleCopy(parsed.txnId!, `txn_${lead.id}`, "Transaction ID")}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              title="Copy Transaction ID"
                            >
                              {isCopiedTxn ? (
                                <Check className="size-3 text-emerald-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        ) : lead.razorpay_order_id ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-[11px] text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded border border-border/60">
                              {lead.razorpay_order_id}
                            </span>
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Phone & Contact Actions */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-foreground">
                            {lead.phone}
                          </span>
                          <button
                            onClick={() => handleCopy(lead.phone, `phone_${lead.id}`, "Phone Number")}
                            className="text-muted-foreground hover:text-foreground p-0.5"
                            title="Copy Phone Number"
                          >
                            {isCopiedPhone ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="size-3 text-emerald-500" />
                            WhatsApp
                          </a>
                          <span className="text-muted-foreground/40">•</span>
                          <a
                            href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Direct Phone Call"
                          >
                            <Phone className="size-3 text-muted-foreground" />
                            Call
                          </a>
                        </div>
                      </TableCell>

                      {/* Paid Date */}
                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">
                          {dayjs(paidDateStr).format("MMM D, YYYY")}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {dayjs(paidDateStr).format("h:mm A")}
                        </div>
                      </TableCell>

                      {/* Appointment */}
                      <TableCell className="py-2.5 text-xs">
                        {lead.appointment_date ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-emerald-400 flex items-center gap-1">
                              <CalendarDays className="size-3 shrink-0" />
                              {dayjs(lead.appointment_date).format("MMM D, YYYY")}
                            </div>
                            {lead.appointment_time && (
                              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                <Clock className="size-3 shrink-0" />
                                {lead.appointment_time}
                              </div>
                            )}
                          </div>
                        ) : parsed.apptInfo ? (
                          <div className="font-medium text-emerald-400 flex items-center gap-1">
                            <CalendarDays className="size-3 shrink-0" />
                            {parsed.apptInfo}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] px-2 py-0.5 font-medium border",
                            getStatusBadgeClass(lead.lead_status || "Closed")
                          )}
                        >
                          {lead.lead_status || "Closed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer with Pagination */}
        {filteredLeads.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-medium text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * pageSize, filteredLeads.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredLeads.length}
              </span>{" "}
              paid users
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="size-3.5" />
                  Previous
                </Button>
                <span className="font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
