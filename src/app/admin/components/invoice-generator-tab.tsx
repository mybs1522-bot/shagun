"use client";

import dayjs from "dayjs";
import {
  Calculator,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  Loader2,
  Maximize2,
  Minus,
  Percent,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceRow {
  id: string;
  service: string;
  percentage: number;
  price: number;
  tax: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  // Client info
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  siteAddress: string;
  projectName: string;
  // Calculation metrics
  ratePerSqft: number;
  areaSqft: number;
  unit: string;
  taxRate: number; // e.g. 18
  paymentMethod: string;
  notes: string;
  showWatermark: boolean;
  // Services breakdown
  rows: ServiceRow[];
  createdAt: string;
}

const DEFAULT_SERVICES_PRESET: ServiceRow[] = [
  {
    id: "s1",
    service: "Advance for Interior Design",
    percentage: 30,
    price: 26424,
    tax: 4756,
    total: 31180,
  },
  {
    id: "s2",
    service: "Concept Interior",
    percentage: 30,
    price: 26424,
    tax: 4756,
    total: 31180,
  },
  {
    id: "s3",
    service: "Final Interior Design",
    percentage: 40,
    price: 35232,
    tax: 6342,
    total: 41574,
  },
];

const PRESETS = [
  {
    name: "Interior 30-30-40 (Default)",
    rows: [
      { service: "Advance for Interior Design", percentage: 30 },
      { service: "Concept Interior", percentage: 30 },
      { service: "Final Interior Design", percentage: 40 },
    ],
  },
  {
    name: "Architecture 20-30-30-20",
    rows: [
      { service: "Booking & Site Survey Advance", percentage: 20 },
      { service: "Conceptual Architectural Design", percentage: 30 },
      { service: "Working Drawings & Structural Submission", percentage: 30 },
      { service: "Site Supervision & Final Handover", percentage: 20 },
    ],
  },
  {
    name: "Two Stage 50-50",
    rows: [
      { service: "Project Initiation & Advance", percentage: 50 },
      { service: "Final Deliverables & Signoff", percentage: 50 },
    ],
  },
  {
    name: "Full 100% Milestone",
    rows: [{ service: "Interior Architecture Consultancy", percentage: 100 }],
  },
];

const POPULAR_SERVICE_NAMES = [
  "Advance for Interior Design",
  "Concept Interior",
  "Final Interior Design",
  "Booking & Advance Fee",
  "2D Space Planning & Layout",
  "3D Realistic Visualizations",
  "Working & Execution Drawings",
  "BOQ & Material Specifications",
  "Site Execution & Quality Supervision",
  "Turnkey Project Coordination",
];

// Helper to format currency in Indian Format: ₹1,03,934
function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "₹0";
  return (
    "₹" +
    Math.round(val).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })
  );
}

function generateInvoiceNumber(): string {
  const dateStr = dayjs().format("YYYYMM");
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-${dateStr}-${rand}`;
}

export function InvoiceGeneratorTab() {
  // Master state
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Client Details
  const [clientName, setClientName] = useState("Mr. Rajesh Sharma");
  const [clientPhone, setClientPhone] = useState("+91 98765 43210");
  const [clientEmail, setClientEmail] = useState("client@example.com");
  const [siteAddress, setSiteAddress] = useState(
    "Unit 1204, Tower B, Palm Heights, Gurugram"
  );
  const [projectName, setProjectName] = useState(
    "Residential Interior Architecture"
  );

  // Pricing & Metrics
  const [ratePerSqft, setRatePerSqft] = useState<number>(80);
  const [areaSqft, setAreaSqft] = useState<number>(1101);
  const [unit, setUnit] = useState<string>("sqft");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<string>("Online/NEFT");
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [notes, setNotes] = useState(
    "1. All drawings and design revisions will be shared digitally.\n2. Milestone payments are required before initiating the subsequent stage."
  );

  // Rows state
  const [rows, setRows] = useState<ServiceRow[]>(DEFAULT_SERVICES_PRESET);

  // History & Leads Dialog state
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsDialogOpen, setLeadsDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Load saved invoices from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arch_saved_invoices");
      if (stored) {
        setSavedInvoices(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Recalculate row amounts when ratePerSqft or areaSqft or taxRate changes
  const baseSubtotal = useMemo(() => {
    return Math.round(ratePerSqft * areaSqft);
  }, [ratePerSqft, areaSqft]);

  const recalculateRows = useCallback(
    (currentRows: ServiceRow[], basePrice: number, taxPercent: number) => {
      return currentRows.map((r) => {
        const price = Math.round((basePrice * (r.percentage || 0)) / 100);
        const tax = Math.round((price * (taxPercent || 0)) / 100);
        const total = price + tax;
        return {
          ...r,
          price,
          tax,
          total,
        };
      });
    },
    []
  );

  // Auto-sync rows price/tax when area/rate changes
  const handleRateOrAreaChange = (newRate: number, newArea: number) => {
    setRatePerSqft(newRate);
    setAreaSqft(newArea);
    const newBase = Math.round(newRate * newArea);
    setRows((prev) => recalculateRows(prev, newBase, taxRate));
  };

  const handleTaxRateChange = (newTax: number) => {
    setTaxRate(newTax);
    setRows((prev) => recalculateRows(prev, baseSubtotal, newTax));
  };

  // Row update handlers
  const updateRowService = (id: string, newService: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, service: newService } : r))
    );
  };

  const updateRowPercentage = (id: string, newPct: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const price = Math.round((baseSubtotal * newPct) / 100);
          const tax = Math.round((price * taxRate) / 100);
          const total = price + tax;
          return {
            ...r,
            percentage: newPct,
            price,
            tax,
            total,
          };
        }
        return r;
      })
    );
  };

  const updateRowPrice = (id: string, newPrice: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const percentage =
            baseSubtotal > 0
              ? parseFloat(((newPrice / baseSubtotal) * 100).toFixed(2))
              : 0;
          const tax = Math.round((newPrice * taxRate) / 100);
          const total = newPrice + tax;
          return {
            ...r,
            percentage,
            price: newPrice,
            tax,
            total,
          };
        }
        return r;
      })
    );
  };

  const addRow = (initialName = "Additional Architectural Scope", initialPct = 10) => {
    const newId = "s_" + Date.now();
    const price = Math.round((baseSubtotal * initialPct) / 100);
    const tax = Math.round((price * taxRate) / 100);
    const total = price + tax;
    const newRow: ServiceRow = {
      id: newId,
      service: initialName,
      percentage: initialPct,
      price,
      tax,
      total,
    };
    setRows((prev) => [...prev, newRow]);
    toast.success("Added new service milestone row");
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      toast.error("Invoice must have at least one service row");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.info("Service row removed");
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const newRows: ServiceRow[] = preset.rows.map((p, idx) => {
      const price = Math.round((baseSubtotal * p.percentage) / 100);
      const tax = Math.round((price * taxRate) / 100);
      const total = price + tax;
      return {
        id: "preset_" + idx + "_" + Date.now(),
        service: p.service,
        percentage: p.percentage,
        price,
        tax,
        total,
      };
    });
    setRows(newRows);
    toast.success(`Applied preset: ${preset.name}`);
  };

  // Calculations for Summary
  const totalPercentage = useMemo(() => {
    return rows.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
  }, [rows]);

  const calculatedSubTotal = useMemo(() => {
    return rows.reduce((acc, r) => acc + (Number(r.price) || 0), 0);
  }, [rows]);

  const calculatedTax = useMemo(() => {
    return rows.reduce((acc, r) => acc + (Number(r.tax) || 0), 0);
  }, [rows]);

  const calculatedGrandTotal = useMemo(() => {
    return calculatedSubTotal + calculatedTax;
  }, [calculatedSubTotal, calculatedTax]);

  // Fetch leads for quick import
  const fetchLeadsForImport = async () => {
    setLeadsLoading(true);
    setLeadsDialogOpen(true);
    try {
      const { data, error } = await supabase
        .from("service_leads")
        .select("*, services(title)")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setLeadsList(data);
      } else {
        toast.error("Failed to load leads from Supabase");
      }
    } catch {
      toast.error("Error connecting to database");
    } finally {
      setLeadsLoading(false);
    }
  };

  const importLead = (lead: any) => {
    if (lead.name) setClientName(lead.name);
    if (lead.phone) setClientPhone(lead.phone);
    if (lead.services?.title) {
      setProjectName(lead.services.title);
      // If the first row is default, rename it to the service title
      setRows((prev) =>
        prev.map((r, i) =>
          i === 0
            ? { ...r, service: `Advance for ${lead.services.title}` }
            : r
        )
      );
    }
    if (lead.total_invoice && lead.total_invoice > 0) {
      // If lead had a specific total invoice, adjust area/rate to approximate
      const approxArea = Math.round(lead.total_invoice / ratePerSqft);
      if (approxArea > 0) {
        setAreaSqft(approxArea);
        const newBase = Math.round(ratePerSqft * approxArea);
        setRows((prev) => recalculateRows(prev, newBase, taxRate));
      }
    }
    setLeadsDialogOpen(false);
    toast.success(`Imported client: ${lead.name}`);
  };

  // Save invoice to local storage
  const saveInvoice = () => {
    const newInvoice: InvoiceData = {
      id: "inv_" + Date.now(),
      invoiceNumber,
      date,
      clientName,
      clientPhone,
      clientEmail,
      siteAddress,
      projectName,
      ratePerSqft,
      areaSqft,
      unit,
      taxRate,
      paymentMethod,
      notes,
      showWatermark,
      rows,
      createdAt: new Date().toISOString(),
    };

    const updated = [newInvoice, ...savedInvoices.filter((i) => i.invoiceNumber !== invoiceNumber)];
    setSavedInvoices(updated);
    try {
      localStorage.setItem("arch_saved_invoices", JSON.stringify(updated));
      toast.success(`Invoice ${invoiceNumber} saved successfully`);
    } catch {
      toast.error("Failed to save to local storage");
    }
  };

  const loadSavedInvoice = (inv: InvoiceData) => {
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date || dayjs().format("YYYY-MM-DD"));
    setClientName(inv.clientName);
    setClientPhone(inv.clientPhone || "");
    setClientEmail(inv.clientEmail || "");
    setSiteAddress(inv.siteAddress || "");
    setProjectName(inv.projectName || "");
    setRatePerSqft(inv.ratePerSqft || 80);
    setAreaSqft(inv.areaSqft || 1000);
    setUnit(inv.unit || "sqft");
    setTaxRate(inv.taxRate || 18);
    setPaymentMethod(inv.paymentMethod || "Online/NEFT");
    setNotes(inv.notes || "");
    setShowWatermark(inv.showWatermark ?? true);
    setRows(inv.rows || DEFAULT_SERVICES_PRESET);
    setHistoryDialogOpen(false);
    toast.success(`Loaded invoice ${inv.invoiceNumber}`);
  };

  const deleteSavedInvoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedInvoices.filter((i) => i.id !== id);
    setSavedInvoices(updated);
    try {
      localStorage.setItem("arch_saved_invoices", JSON.stringify(updated));
      toast.info("Invoice deleted from history");
    } catch {}
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Copy WhatsApp summary
  const copyWhatsAppText = () => {
    const lines = [
      `*INVOICE: ${invoiceNumber}*`,
      `*Ar. Shagun Yadav - Architect & ArchBIZ Consultant*`,
      `-----------------------------------------`,
      `*Client:* ${clientName}`,
      `*Project:* ${projectName}`,
      `*Date:* ${dayjs(date).format("DD MMM, YYYY")}`,
      `*Design Charge:* ₹${ratePerSqft}/${unit}`,
      `*Designable Area:* ${areaSqft} ${unit}`,
      `-----------------------------------------`,
      `*SERVICES & MILESTONES:*`,
      ...rows.map(
        (r) =>
          `• ${r.service} (${r.percentage}%): ${formatINR(r.price)} + Tax: ${formatINR(r.tax)} = *${formatINR(r.total)}*`
      ),
      `-----------------------------------------`,
      `*Sub-total:* ${formatINR(calculatedSubTotal)}`,
      `*GST (${taxRate}%):* + ${formatINR(calculatedTax)}`,
      `*GRAND TOTAL:* *${formatINR(calculatedGrandTotal)}*`,
      `-----------------------------------------`,
      `*Payment Method:* ${paymentMethod}`,
      `\n_Thank you for your business!_`,
    ].join("\n");

    navigator.clipboard.writeText(lines);
    toast.success("Invoice summary copied to clipboard for WhatsApp!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Invoice Generator</h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-mono">
              Milestone Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, edit, and generate professional architectural invoices with percentage milestone splits, GST, and live preview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Import from Leads */}
          <Button
            variant="outline"
            onClick={fetchLeadsForImport}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <UserCheck className="size-3.5 text-primary" />
            Import Lead
          </Button>

          {/* History / Drafts */}
          <Button
            variant="outline"
            onClick={() => setHistoryDialogOpen(true)}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <History className="size-3.5 text-muted-foreground" />
            Saved Invoices ({savedInvoices.length})
          </Button>

          {/* Save */}
          <Button
            variant="outline"
            onClick={saveInvoice}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Save className="size-3.5 text-emerald-600" />
            Save Draft
          </Button>

          {/* Copy WhatsApp */}
          <Button
            variant="outline"
            onClick={copyWhatsAppText}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Copy className="size-3.5 text-green-600" />
            Copy WhatsApp
          </Button>

          {/* Print / Export PDF */}
          <Button
            variant="default"
            onClick={handlePrint}
            className="h-9 gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Printer className="size-3.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Editor on Left / Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: EDIT CONTROLS & SERVICE ROWS MANAGEMENT (Hidden in Print)  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-6 print:hidden">
          {/* 1. Client & Project Details Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Client & Invoice Meta
              </h3>
              <Button
                variant="ghost"
                className="h-7 text-xs text-muted-foreground gap-1 hover:text-foreground"
                onClick={() => setInvoiceNumber(generateInvoiceNumber())}
              >
                <RefreshCw className="size-3" />
                New Number
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Invoice Number</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-8 text-xs font-mono font-medium mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Invoice Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Client / Company Name</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Phone / WhatsApp</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Project / Scope Title</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Residential Interior Design"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Site Address / Location</Label>
                <Input
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="e.g. Unit 1204, Tower B, Palm Heights, Gurugram"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* 2. Calculation & Area Settings Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="size-4 text-primary" />
                Design Rates & Area Formula
              </h3>
              <span className="text-xs font-medium text-muted-foreground">
                Base Subtotal: <strong className="text-foreground font-mono">{formatINR(baseSubtotal)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Rate / {unit} (₹)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={ratePerSqft || ""}
                  onChange={(e) =>
                    handleRateOrAreaChange(parseFloat(e.target.value) || 0, areaSqft)
                  }
                  className="h-8 text-xs font-mono mt-1 font-semibold"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Area ({unit})
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={areaSqft || ""}
                  onChange={(e) =>
                    handleRateOrAreaChange(ratePerSqft, parseFloat(e.target.value) || 0)
                  }
                  className="h-8 text-xs font-mono mt-1 font-semibold"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Unit</Label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="sqft"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">GST Tax (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>

            {/* Formula Explainer */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground border border-border/50">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span>₹{ratePerSqft}/{unit}</span>
                <span>×</span>
                <span>{areaSqft} {unit}</span>
                <span>=</span>
                <span className="font-semibold text-foreground">{formatINR(baseSubtotal)} Base</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Watermark:</span>
                <Switch
                  checked={showWatermark}
                  onCheckedChange={setShowWatermark}
                  className="scale-75"
                />
              </div>
            </div>
          </div>

          {/* 3. Services Milestone Rows Management Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-primary" />
                  Service Milestone Rows
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Edit descriptions, customize percentage splits, or add new deliverables.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={totalPercentage === 100 ? "default" : "outline"}
                  className={cn(
                    "font-mono text-xs font-medium px-2 py-0.5",
                    totalPercentage === 100
                      ? "bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400"
                  )}
                >
                  {totalPercentage}% Total Split
                </Badge>
              </div>
            </div>

            {/* Preset quick buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">
                Presets:
              </span>
              {PRESETS.map((preset, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => applyPreset(preset)}
                  className="h-6 text-[11px] px-2 py-0 bg-muted/30 hover:bg-muted font-normal"
                >
                  {preset.name}
                </Button>
              ))}
            </div>

            {/* Service Rows List */}
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5 transition-all hover:border-border/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <Input
                        value={row.service}
                        onChange={(e) => updateRowService(row.id, e.target.value)}
                        placeholder="Service Name (e.g. Advance for Interior Design)"
                        className="h-8 text-xs font-medium flex-1"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Remove row"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {/* Calculations row */}
                  <div className="grid grid-cols-12 gap-2 text-xs items-center pl-7">
                    <div className="col-span-3">
                      <Label className="text-[10px] text-muted-foreground">Split %</Label>
                      <div className="relative mt-0.5">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={row.percentage}
                          onChange={(e) =>
                            updateRowPercentage(
                              row.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-7 text-xs font-mono font-semibold pr-5"
                        />
                        <span className="absolute right-1.5 top-1.5 text-[10px] text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-[10px] text-muted-foreground">Price (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={row.price}
                        onChange={(e) =>
                          updateRowPrice(row.id, parseFloat(e.target.value) || 0)
                        }
                        className="h-7 text-xs font-mono mt-0.5"
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-[10px] text-muted-foreground">
                        Tax ({taxRate}%)
                      </Label>
                      <div className="h-7 flex items-center px-2 rounded-md bg-muted/60 text-muted-foreground font-mono text-xs mt-0.5">
                        {formatINR(row.tax)}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-[10px] font-semibold text-foreground">
                        Total (₹)
                      </Label>
                      <div className="h-7 flex items-center px-2 rounded-md bg-primary/5 text-primary font-mono font-semibold text-xs mt-0.5 border border-primary/20">
                        {formatINR(row.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Service Button & Suggestions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t">
              <Button
                variant="outline"
                onClick={() => addRow()}
                className="h-8 text-xs gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5"
              >
                <Plus className="size-3.5" />
                Add Service Row
              </Button>

              {/* Quick suggestions dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Quick Add:</span>
                <select
                  className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-muted-foreground focus:outline-hidden"
                  onChange={(e) => {
                    if (e.target.value) {
                      addRow(e.target.value, 10);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    + Pick Common Service...
                  </option>
                  {POPULAR_SERVICE_NAMES.map((name, i) => (
                    <option key={i} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Payment Method & Notes Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold border-b pb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Payment Method & Notes
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Online/NEFT"
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Terms & Conditions / Notes</Label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="1. All drawings and design revisions will be shared digitally."
                  className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground focus:outline-hidden mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE INVOICE PREVIEW & PRINT SHEET                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Printer className="size-3.5 text-primary" />
                Live Printable Invoice Sheet
              </span>
              <span className="text-[11px] text-muted-foreground">
                Exact reference layout
              </span>
            </div>

            {/* A4 Print Stylesheet Injection */}
            <style dangerouslySetInnerHTML={{ __html: `
              @page {
                size: A4 portrait;
                margin: 0;
              }
              @media print {
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body * {
                  visibility: hidden;
                }
                #printable-invoice-sheet, #printable-invoice-sheet * {
                  visibility: visible;
                }
                #printable-invoice-sheet {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 16mm 14mm !important;
                  box-sizing: border-box !important;
                  border: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  margin: 0 !important;
                  page-break-after: avoid !important;
                  page-break-inside: avoid !important;
                  overflow: hidden !important;
                  background: white !important;
                }
              }
            `}} />

            {/* A4 Paper Container with White Background for Exact Visual & Print Rendering */}
            <div
              id="printable-invoice-sheet"
              className={cn(
                "relative mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 border border-zinc-300 rounded-lg shadow-lg p-8 sm:p-10 overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:w-[210mm] print:h-[297mm] print:bg-white print:text-black",
                "font-sans antialiased flex flex-col justify-between"
              )}
            >
              {/* Optional Sofa Background Watermark (as shown in reference image) */}
              {showWatermark && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12] print:opacity-[0.12] z-0 overflow-hidden"
                  style={{
                    backgroundImage: "url('/images/sofa-backdrop.png')",
                    backgroundSize: "75%",
                    backgroundPosition: "center 58%",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}

              {/* Sheet Content Wrapper */}
              <div className="relative z-10 space-y-6">
                {/* 1. Header & Architect Branding */}
                <div className="flex flex-row items-start justify-between border-b-2 border-zinc-900 pb-5">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase">
                      Ar. Shagun Yadav
                    </h1>
                    <p className="text-xs font-semibold tracking-wide text-zinc-600 uppercase mt-0.5">
                      Architect & ArchBIZ Consultant
                    </p>
                    <div className="text-[11px] text-zinc-500 mt-2 space-y-0.5 leading-relaxed">
                      <p>+91 98765 43210 | info@arshagunyadav.com</p>
                      <p>Gurugram / New Delhi, NCR, India</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-zinc-950 text-white px-3 py-1 text-xs font-black tracking-widest uppercase">
                      TAX INVOICE
                    </div>
                    <div className="text-xs font-mono font-bold text-zinc-900 mt-2">
                      {invoiceNumber}
                    </div>
                    <div className="text-[11px] text-zinc-600 mt-0.5">
                      Date: <span className="font-semibold text-zinc-800">{dayjs(date).format("DD MMM, YYYY")}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Client & Project Details Bar */}
                <div className="grid grid-cols-2 gap-4 rounded-md bg-zinc-50 p-3 text-xs border border-zinc-200">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      Billed To
                    </span>
                    <p className="font-bold text-zinc-900 text-sm mt-0.5">
                      {clientName || "Client Name"}
                    </p>
                    {clientPhone && <p className="text-zinc-600 text-[11px] mt-0.5">{clientPhone}</p>}
                    {clientEmail && <p className="text-zinc-600 text-[11px]">{clientEmail}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      Project Site & Scope
                    </span>
                    <p className="font-bold text-zinc-900 text-sm mt-0.5">
                      {projectName || "Interior Architecture"}
                    </p>
                    {siteAddress && (
                      <p className="text-zinc-600 text-[11px] mt-0.5 line-clamp-2">
                        {siteAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. The Core Milestone Table (Exact match to requested image) */}
                <div className="overflow-hidden border border-zinc-950">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-black text-white text-xs font-black tracking-wider uppercase">
                        <th className="py-2.5 px-3 border-r border-zinc-800 font-extrabold w-[44%]">
                          SERVICE
                        </th>
                        <th className="py-2.5 px-3 border-r border-zinc-800 text-center font-extrabold w-[12%]">
                          %
                        </th>
                        <th className="py-2.5 px-3 border-r border-zinc-800 text-right font-extrabold w-[14%]">
                          PRICE
                        </th>
                        <th className="py-2.5 px-3 border-r border-zinc-800 text-right font-extrabold w-[15%]">
                          TAX ({taxRate}%)
                        </th>
                        <th className="py-2.5 px-3 text-right font-extrabold w-[15%]">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-300 text-xs">
                      {rows.map((row, index) => (
                        <tr
                          key={row.id || index}
                          className="bg-transparent hover:bg-zinc-50/50 transition-colors"
                        >
                          <td className="py-3 px-3 border-r border-zinc-300 font-medium text-zinc-900 leading-snug">
                            {row.service}
                          </td>
                          <td className="py-3 px-3 border-r border-zinc-300 text-center font-mono font-semibold text-zinc-800">
                            {row.percentage}
                          </td>
                          <td className="py-3 px-3 border-r border-zinc-300 text-right font-mono font-medium text-zinc-800">
                            {formatINR(row.price)}
                          </td>
                          <td className="py-3 px-3 border-r border-zinc-300 text-right font-mono font-medium text-zinc-800">
                            {formatINR(row.tax)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-zinc-950">
                            {formatINR(row.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Bottom Metrics, Notes & Grand Summary Box */}
                <div className="grid grid-cols-12 gap-4 pt-2 items-start">
                  {/* Left Side: Design Charge, Area & Payment Details */}
                  <div className="col-span-7 space-y-3 text-xs">
                    <div className="space-y-1 text-zinc-800 font-medium">
                      <p className="text-sm">
                        <span className="font-semibold text-zinc-900">Design Charge - </span>
                        ₹{ratePerSqft}/{unit}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-zinc-900">Designable Area - </span>
                        {areaSqft} {unit}
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm font-black text-zinc-950">
                        Payment Method :
                      </p>
                      <p className="text-xs text-zinc-700 font-medium mt-0.5">
                        {paymentMethod || "Online/NEFT"}
                      </p>
                    </div>

                    {notes && (
                      <div className="text-[10px] text-zinc-500 whitespace-pre-line leading-relaxed pt-2">
                        {notes}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Exact Summary Box matching Screenshot */}
                  <div className="col-span-5">
                    <div className="border border-zinc-950 rounded-none bg-white p-3 space-y-2 text-xs">
                      {/* GST Tag line */}
                      <div className="flex justify-between items-center text-[11px] text-zinc-600 border-b border-zinc-200 pb-2">
                        <span className="font-semibold text-zinc-800">GST @ {taxRate}%</span>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-zinc-900">+ {formatINR(calculatedTax)}</span>
                          <p className="text-[9px] text-zinc-500 font-sans leading-none mt-0.5">
                            Tax Exclusive, Rounded-off
                          </p>
                        </div>
                      </div>

                      {/* Sub-total */}
                      <div className="flex justify-between items-center pt-1 text-xs">
                        <span className="font-medium text-zinc-700">Sub-total :</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          {formatINR(calculatedSubTotal)}
                        </span>
                      </div>

                      {/* Tax */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-zinc-700">Tax :</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          {formatINR(calculatedTax)}
                        </span>
                      </div>

                      {/* Total Box */}
                      <div className="border-t-2 border-zinc-950 pt-2 mt-2 flex justify-between items-center">
                        <span className="text-base font-black tracking-tight text-zinc-950 uppercase">
                          Total :
                        </span>
                        <span className="text-lg font-black font-mono text-zinc-950">
                          {formatINR(calculatedGrandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG: QUICK IMPORT FROM SERVICE LEADS                                   */}
      {/* ========================================================================= */}
      <Dialog open={leadsDialogOpen} onOpenChange={setLeadsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserCheck className="size-4 text-primary" />
              Import Client from Service Leads
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select any existing booked lead to automatically pre-populate client details and scope.
            </DialogDescription>
          </DialogHeader>

          {leadsLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : leadsList.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No service leads found in database.
            </div>
          ) : (
            <div className="divide-y divide-border border rounded-lg max-h-[50vh] overflow-y-auto">
              {leadsList.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => importLead(lead)}
                  className="flex items-center justify-between p-3 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{lead.name}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">{lead.phone}</p>
                    <p className="text-[11px] text-primary font-medium">
                      Service: {lead.services?.title || "Architectural Consultation"}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    {lead.total_invoice ? (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Invoice: ₹{lead.total_invoice.toLocaleString("en-IN")}
                      </Badge>
                    ) : null}
                    <Button variant="outline" className="h-7 text-xs block">
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: SAVED INVOICES HISTORY                                            */}
      {/* ========================================================================= */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-primary" />
              Saved Invoices History
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review and reload previously generated invoices from local storage.
            </DialogDescription>
          </DialogHeader>

          {savedInvoices.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No saved invoices yet. Click &quot;Save Draft&quot; to preserve your invoices.
            </div>
          ) : (
            <div className="divide-y divide-border border rounded-lg max-h-[50vh] overflow-y-auto">
              {savedInvoices.map((inv) => {
                const total = inv.rows.reduce(
                  (acc, r) => acc + (r.price || 0) + (r.tax || 0),
                  0
                );
                return (
                  <div
                    key={inv.id}
                    onClick={() => loadSavedInvoice(inv)}
                    className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          • {inv.date}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{inv.clientName}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {inv.projectName} ({inv.areaSqft} {inv.unit} @ ₹{inv.ratePerSqft}/{inv.unit})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm text-foreground">
                          {formatINR(total)}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {inv.rows.length} Milestones
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => deleteSavedInvoice(inv.id, e)}
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete saved invoice"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
