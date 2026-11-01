"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ChanhDaiMark } from "@/components/chanhdai-mark";
import { ToggleTheme } from "@/components/toggle-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModularLead } from "@/lib/modular-storage";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  Contacted: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  "Quote Sent": "bg-purple-500/10 text-purple-500 border-purple-500/30",
  "Follow Up": "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  Closed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  "Not Interested": "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
};

export default function ModularDataPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [checking, setChecking] = useState(true);

  // Hydrate auth state from localStorage, sessionStorage or cookies
  useEffect(() => {
    const isLocal = localStorage.getItem("modular_data_auth") === "true";
    const isSession = sessionStorage.getItem("modular_data_auth") === "true";
    const hasCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("modular_data_auth=true");
    const storedPw =
      sessionStorage.getItem("modular_password") ||
      localStorage.getItem("modular_password") ||
      "";

    if (isLocal || isSession || hasCookie || storedPw) {
      setAuthenticated(true);
      if (storedPw) setAuthToken(storedPw);
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("modular_data_auth");
    sessionStorage.removeItem("modular_data_auth");
    localStorage.removeItem("modular_password");
    sessionStorage.removeItem("modular_password");
    if (typeof document !== "undefined") {
      document.cookie =
        "modular_data_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    setAuthenticated(false);
    setAuthToken("");
    toast.success("Logged out successfully");
  };

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    setAuthenticated(true);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authenticated) {
    return <DataPasswordGate onSuccess={handleLoginSuccess} />;
  }

  return (
    <ModularLeadsDashboard
      token={authToken}
      onLogout={handleLogout}
    />
  );
}

// ---------------------------------------------------------------------------
// Password Gate
// ---------------------------------------------------------------------------
function DataPasswordGate({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPw = password.trim();
    if (!cleanPw) return;

    setLoading(true);
    try {
      const res = await fetch("/api/modular/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: cleanPw }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("modular_data_auth", "true");
        sessionStorage.setItem("modular_data_auth", "true");
        localStorage.setItem("modular_password", cleanPw);
        sessionStorage.setItem("modular_password", cleanPw);
        document.cookie =
          "modular_data_auth=true; path=/; max-age=2592000; SameSite=Lax";
        toast.success("Welcome to Modular Leads Portal");
        onSuccess(cleanPw);
      } else {
        toast.error(data.message || "Invalid password");
        setPassword("");
      }
    } catch {
      toast.error("Failed to verify password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl border border-grid bg-card p-6 sm:p-8 shadow-xl"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Modular Leads Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter the private access password to view customer quotation inquiries.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Access Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="rounded-xl font-mono"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl h-10 font-semibold"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            "Access Data Portal"
          )}
        </Button>

        <div className="text-center pt-1 border-t border-grid">
          <Link
            href="/modular"
            className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            ← View /modular public page
          </Link>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard View
// ---------------------------------------------------------------------------
function ModularLeadsDashboard({
  token: initialToken,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [leads, setLeads] = useState<ModularLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  // Notes Modal state
  const [activeNoteLead, setActiveNoteLead] = useState<ModularLead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const getEffectiveToken = useCallback(() => {
    if (initialToken) return initialToken;
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("modular_password") ||
        localStorage.getItem("modular_password") ||
        "shagun@modular"
      );
    }
    return "shagun@modular";
  }, [initialToken]);

  const fetchLeads = useCallback(
    async (showToast = false) => {
      setLoading(true);
      try {
        const token = getEffectiveToken();
        const res = await fetch(
          `/api/modular/leads?auth=${encodeURIComponent(token)}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-modular-password": token,
            },
            cache: "no-store",
          }
        );

        if (res.status === 401) {
          toast.error("Session expired. Please enter password again.");
          onLogout();
          return;
        }

        const data = await res.json();
        if (data.success) {
          let serverLeads: ModularLead[] = data.leads || [];

          // Merge locally saved submissions if present on this device
          try {
            const clientSubmissions = JSON.parse(
              localStorage.getItem("my_modular_submissions") || "[]"
            );
            if (
              Array.isArray(clientSubmissions) &&
              clientSubmissions.length > 0
            ) {
              const missing = clientSubmissions.filter(
                (c: any) =>
                  !serverLeads.some(
                    (s) =>
                      s.id === c.id ||
                      (s.phone === c.phone &&
                        Math.abs(
                          new Date(s.createdAt).getTime() -
                            new Date(c.createdAt).getTime()
                        ) < 300000)
                  )
              );

              // Auto-sync missing leads to the server
              for (const m of missing) {
                fetch("/api/modular/lead", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: m.name,
                    phone: m.phone,
                    products: m.products,
                    city: m.city,
                    propertyType: m.propertyType,
                    notes: m.notes,
                  }),
                }).catch(() => {});
              }

              if (missing.length > 0) {
                serverLeads = [...missing, ...serverLeads];
              }
            }
          } catch {}

          serverLeads.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setLeads(serverLeads);
          if (showToast) {
            toast.success(`Synced ${serverLeads.length} leads successfully`);
          }
        } else {
          toast.error("Could not load leads: " + data.message);
        }
      } catch {
        toast.error("Network error while fetching leads");
      } finally {
        setLoading(false);
      }
    },
    [getEffectiveToken, onLogout]
  );

  // Initial load and live background sync
  useEffect(() => {
    fetchLeads(false);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchLeads(false);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const token = getEffectiveToken();
      const res = await fetch(
        `/api/modular/leads?auth=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-modular-password": token,
          },
          body: JSON.stringify({ id: leadId, status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: newStatus as any } : l
          )
        );
        toast.success(`Status updated to "${newStatus}"`);
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error while updating status");
    }
  };

  const handleSaveNotes = async () => {
    if (!activeNoteLead) return;
    setSavingNote(true);
    try {
      const token = getEffectiveToken();
      const res = await fetch(
        `/api/modular/leads?auth=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-modular-password": token,
          },
          body: JSON.stringify({ id: activeNoteLead.id, notes: noteText }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === activeNoteLead.id ? { ...l, notes: noteText } : l
          )
        );
        toast.success("Notes saved successfully");
        setActiveNoteLead(null);
      } else {
        toast.error("Failed to save note");
      }
    } catch {
      toast.error("Network error while saving note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead for ${name}?`)) return;

    try {
      const token = getEffectiveToken();
      const res = await fetch(
        `/api/modular/leads?id=${id}&auth=${encodeURIComponent(token)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "x-modular-password": token,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        toast.success("Lead removed");
      } else {
        toast.error("Failed to delete lead");
      }
    } catch {
      toast.error("Network error while deleting lead");
    }
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        (lead.city && lead.city.toLowerCase().includes(q)) ||
        (lead.notes && lead.notes.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const matchProduct =
        productFilter === "all" ||
        lead.products.some((p) => p.toLowerCase().includes(productFilter.toLowerCase()));

      return matchSearch && matchStatus && matchProduct;
    });
  }, [leads, search, statusFilter, productFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "New").length;
    const contactedCount = leads.filter(
      (l) => l.status === "Contacted" || l.status === "Quote Sent"
    ).length;
    const closedCount = leads.filter((l) => l.status === "Closed").length;
    return { total, newCount, contactedCount, closedCount };
  }, [leads]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-grid bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Ar. Shagun Home">
              <ChanhDaiMark className="h-7" />
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 bg-primary/10 text-primary border-primary/20 text-xs py-0.5"
              >
                <Package className="size-3" />
                Modular Portal
              </Badge>
              <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
                /data
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="default"
              className="text-xs h-8 rounded-lg"
            >
              <Link href="/modular" target="_blank">
                <span>View /modular</span>
                <span className="ml-1 text-[10px]">↗</span>
              </Link>
            </Button>
            <ToggleTheme />
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              title="Logout"
              className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Header & Stats Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Factory Modular Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              All quotation submissions for Kitchens, Wardrobes, Vanities &amp; TV Units.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => fetchLeads(true)}
              disabled={loading}
              className="rounded-xl text-xs h-9 gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Button
              asChild
              variant="default"
              size="default"
              className="rounded-xl text-xs h-9 gap-1.5"
            >
              <a
                href={`/api/modular/export?token=${encodeURIComponent(getEffectiveToken())}`}
                download
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </a>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-grid bg-card p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-mono">Total Leads</span>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats.total}
            </div>
            <span className="text-[11px] text-muted-foreground">All time submissions</span>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
            <span className="text-xs text-amber-500 font-mono font-medium">New / Uncontacted</span>
            <div className="text-2xl font-bold tracking-tight text-amber-500">
              {stats.newCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Needs quick outreach</span>
          </div>

          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-1">
            <span className="text-xs text-blue-500 font-mono font-medium">In Discussion</span>
            <div className="text-2xl font-bold tracking-tight text-blue-500">
              {stats.contactedCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Contacted / Quote Sent</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
            <span className="text-xs text-emerald-500 font-mono font-medium">Closed / Won</span>
            <div className="text-2xl font-bold tracking-tight text-emerald-500">
              {stats.closedCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Converted to projects</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-grid bg-card p-3 sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, city or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs sm:text-sm bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="New">🟡 New</option>
              <option value="Contacted">🔵 Contacted</option>
              <option value="Quote Sent">🟣 Quote Sent</option>
              <option value="Follow Up">⚪ Follow Up</option>
              <option value="Closed">🟢 Closed</option>
              <option value="Not Interested">⚫ Not Interested</option>
            </select>

            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Products</option>
              <option value="Kitchens">Kitchens</option>
              <option value="Wardrobes">Wardrobes</option>
              <option value="Vanity">Vanity</option>
              <option value="TV Units">TV Units</option>
            </select>
          </div>
        </div>

        {/* Leads Table Container */}
        <div className="rounded-2xl border border-grid bg-card overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="size-6" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                No Leads Found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {search || statusFilter !== "all" || productFilter !== "all"
                  ? "Try adjusting your search query or filters to find leads."
                  : "No quotation requests have been submitted yet. Test the form on /modular!"}
              </p>
              <Button asChild size="default" className="rounded-xl text-xs h-9">
                <Link href="/modular">Go to /modular page</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-grid bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grid">
                  {filteredLeads.map((lead) => {
                    const cleanDigits = lead.phone.replace(/\D/g, "");
                    const waLink = `https://wa.me/91${cleanDigits}?text=${encodeURIComponent(
                      `Hi ${lead.name}, this is from Ar. Shagun Yadav's modular studio regarding your inquiry for factory-made ${lead.products.join(
                        ", "
                      )}.`
                    )}`;

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* Name & City */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-foreground">
                            {lead.name}
                          </div>
                          {lead.city && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              📍 {lead.city}
                            </div>
                          )}
                          {lead.notes && (
                            <div className="mt-1 text-[11px] text-amber-500/90 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate">
                              💬 {lead.notes}
                            </div>
                          )}
                        </td>

                        {/* Phone & Shortcuts */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono font-medium text-foreground">
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="size-3" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-2 py-0.5 text-[11px] font-medium transition-colors"
                              title="Call Phone"
                            >
                              <Phone className="size-3" />
                              <span>Call</span>
                            </a>
                          </div>
                        </td>

                        {/* Products */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {lead.products.map((p, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 font-normal bg-muted/60"
                              >
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </td>

                        {/* Status Select */}
                        <td className="py-3.5 px-4 align-top">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(lead.id, e.target.value)
                            }
                            className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none transition-colors ${
                              STATUS_COLORS[lead.status] || "bg-muted text-foreground"
                            }`}
                          >
                            <option value="New">🟡 New</option>
                            <option value="Contacted">🔵 Contacted</option>
                            <option value="Quote Sent">🟣 Quote Sent</option>
                            <option value="Follow Up">⚪ Follow Up</option>
                            <option value="Closed">🟢 Closed</option>
                            <option value="Not Interested">⚫ Not Interested</option>
                          </select>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 align-top text-muted-foreground text-xs font-mono">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          <div className="text-[10px] text-muted-foreground/80">
                            {new Date(lead.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setActiveNoteLead(lead);
                                setNoteText(lead.notes || "");
                              }}
                              title="Add/Edit Notes"
                              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <MessageSquare className="size-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLead(lead.id, lead.name)}
                              title="Delete Lead"
                              className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Notes Dialog */}
      <Dialog
        open={Boolean(activeNoteLead)}
        onOpenChange={(open) => !open && setActiveNoteLead(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-card border-grid">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">
              Notes for {activeNoteLead?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-mono">
                Client Contact
              </Label>
              <div className="font-mono text-xs font-semibold text-foreground">
                {activeNoteLead?.phone} • {activeNoteLead?.city || "No city specified"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-notes" className="text-xs">
                Internal Remarks &amp; Quotation Follow-up
              </Label>
              <textarea
                id="lead-notes"
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Sent Acrylic kitchen estimate ₹2.4L. Follow up on Tuesday at 4 PM..."
                className="w-full rounded-xl border border-input bg-background p-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => setActiveNoteLead(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="default"
                onClick={handleSaveNotes}
                disabled={savingNote}
                className="rounded-xl font-semibold"
              >
                {savingNote ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
