"use client";

import dayjs from "dayjs";
import {
  AlignCenter,
  AlignLeft,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  FilePlus,
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
  Upload,
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
import { OFFER_LETTER_TEMPLATE_BASE64 } from "@/lib/offer-letter-template-base64";
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
  invoiceTitle: string;
  // Business / Architect Branding
  companyName: string;
  tagline: string;
  contactInfo: string;
  addressInfo: string;
  // Visibility toggles
  showBranding: boolean;
  showTagline: boolean;
  showContact: boolean;
  showAddress: boolean;
  showInvoiceTitle: boolean;
  showClientSection: boolean;
  showDesignMetrics: boolean;
  showPaymentMethod: boolean;
  showNotes: boolean;
  showPercentageSplit?: boolean;
  headerAlignment: "center" | "split";
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

// Convert base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function InvoiceGeneratorTab() {
  // Master state
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [invoiceTitle, setInvoiceTitle] = useState("TAX INVOICE");

  // Business / Architect Branding (Editable & Removable)
  const [companyName, setCompanyName] = useState("Ar. Shagun Yadav");
  const [tagline, setTagline] = useState("Architect & ArchBIZ Consultant");
  const [contactInfo, setContactInfo] = useState("+91 98765 43210 | info@arshagunyadav.com");
  const [addressInfo, setAddressInfo] = useState("Gurugram / New Delhi, NCR, India");

  // Visibility & Calculation toggles
  const [showBranding, setShowBranding] = useState(true);
  const [showTagline, setShowTagline] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showInvoiceTitle, setShowInvoiceTitle] = useState(true);
  const [showClientSection, setShowClientSection] = useState(true);
  const [showDesignMetrics, setShowDesignMetrics] = useState(true);
  const [showPaymentMethod, setShowPaymentMethod] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showPercentageSplit, setShowPercentageSplit] = useState(true);
  const [headerAlignment, setHeaderAlignment] = useState<"center" | "split">("center");

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
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Custom Quick Add Services State
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [newServiceInput, setNewServiceInput] = useState("");
  const [customServiceDialogOpen, setCustomServiceDialogOpen] = useState(false);

  // Attached PDF Merge State (Persists until manually deleted!)
  const [attachedPdfBase64, setAttachedPdfBase64] = useState<string>("");
  const [attachedPdfName, setAttachedPdfName] = useState<string>("");
  const [attachedPdfPageCount, setAttachedPdfPageCount] = useState<number>(0);
  const [enablePdfMerge, setEnablePdfMerge] = useState<boolean>(true);
  const [mergePdfDialogOpen, setMergePdfDialogOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // History & Leads Dialog state
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsDialogOpen, setLeadsDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Load saved invoices, custom quick services, active working draft & attached merge PDF
  useEffect(() => {
    try {
      const storedInvoices = localStorage.getItem("arch_saved_invoices");
      if (storedInvoices) {
        setSavedInvoices(JSON.parse(storedInvoices));
      }
      const storedQuick = localStorage.getItem("arch_quick_services");
      if (storedQuick) {
        setCustomServices(JSON.parse(storedQuick));
      }

      // Load Attached Merge PDF from localStorage (defaults to 2-page Offer Letter)
      const storedPdf = localStorage.getItem("arch_attached_merge_pdf");
      const storedPdfName = localStorage.getItem("arch_attached_merge_pdf_name");
      if (storedPdf) {
        setAttachedPdfBase64(storedPdf);
        setAttachedPdfName(storedPdfName || "Offer_Letter_2_Pages.pdf");
        import("pdf-lib").then(({ PDFDocument }) => {
          PDFDocument.load(base64ToUint8Array(storedPdf))
            .then((doc) => setAttachedPdfPageCount(doc.getPageCount()))
            .catch(() => setAttachedPdfPageCount(2));
        });
      } else if (OFFER_LETTER_TEMPLATE_BASE64) {
        setAttachedPdfBase64(OFFER_LETTER_TEMPLATE_BASE64);
        setAttachedPdfName("Offer_Letter_2_Pages.pdf");
        setAttachedPdfPageCount(2);
        localStorage.setItem("arch_attached_merge_pdf", OFFER_LETTER_TEMPLATE_BASE64);
        localStorage.setItem("arch_attached_merge_pdf_name", "Offer_Letter_2_Pages.pdf");
      }

      // Load active working draft
      const activeDraft = localStorage.getItem("arch_active_working_draft");
      if (activeDraft) {
        const draft: InvoiceData = JSON.parse(activeDraft);
        if (draft.invoiceNumber) setInvoiceNumber(draft.invoiceNumber);
        if (draft.date) setDate(draft.date);
        if (draft.invoiceTitle) setInvoiceTitle(draft.invoiceTitle);
        if (draft.companyName) setCompanyName(draft.companyName);
        if (draft.tagline !== undefined) setTagline(draft.tagline);
        if (draft.contactInfo !== undefined) setContactInfo(draft.contactInfo);
        if (draft.addressInfo !== undefined) setAddressInfo(draft.addressInfo);
        if (draft.showBranding !== undefined) setShowBranding(draft.showBranding);
        if (draft.showTagline !== undefined) setShowTagline(draft.showTagline);
        if (draft.showContact !== undefined) setShowContact(draft.showContact);
        if (draft.showAddress !== undefined) setShowAddress(draft.showAddress);
        if (draft.showInvoiceTitle !== undefined) setShowInvoiceTitle(draft.showInvoiceTitle);
        if (draft.showClientSection !== undefined) setShowClientSection(draft.showClientSection);
        if (draft.showDesignMetrics !== undefined) setShowDesignMetrics(draft.showDesignMetrics);
        if (draft.showPaymentMethod !== undefined) setShowPaymentMethod(draft.showPaymentMethod);
        if (draft.showNotes !== undefined) setShowNotes(draft.showNotes);
        if (draft.showPercentageSplit !== undefined) setShowPercentageSplit(draft.showPercentageSplit);
        if (draft.headerAlignment) setHeaderAlignment(draft.headerAlignment);
        if (draft.clientName !== undefined) setClientName(draft.clientName);
        if (draft.clientPhone !== undefined) setClientPhone(draft.clientPhone);
        if (draft.clientEmail !== undefined) setClientEmail(draft.clientEmail);
        if (draft.siteAddress !== undefined) setSiteAddress(draft.siteAddress);
        if (draft.projectName !== undefined) setProjectName(draft.projectName);
        if (draft.ratePerSqft !== undefined) setRatePerSqft(draft.ratePerSqft);
        if (draft.areaSqft !== undefined) setAreaSqft(draft.areaSqft);
        if (draft.unit) setUnit(draft.unit);
        if (draft.taxRate !== undefined) setTaxRate(draft.taxRate);
        if (draft.paymentMethod !== undefined) setPaymentMethod(draft.paymentMethod);
        if (draft.notes !== undefined) setNotes(draft.notes);
        if (draft.showWatermark !== undefined) setShowWatermark(draft.showWatermark);
        if (draft.rows && draft.rows.length > 0) setRows(draft.rows);
      }
    } catch {}
  }, []);

  // Auto-persist working draft to localStorage on every edit
  useEffect(() => {
    try {
      const activeDraft: InvoiceData = {
        id: "active_working_draft",
        invoiceNumber,
        date,
        invoiceTitle,
        companyName,
        tagline,
        contactInfo,
        addressInfo,
        showBranding,
        showTagline,
        showContact,
        showAddress,
        showInvoiceTitle,
        showClientSection,
        showDesignMetrics,
        showPaymentMethod,
        showNotes,
        showPercentageSplit,
        headerAlignment,
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
      localStorage.setItem("arch_active_working_draft", JSON.stringify(activeDraft));
    } catch {}
  }, [
    invoiceNumber,
    date,
    invoiceTitle,
    companyName,
    tagline,
    contactInfo,
    addressInfo,
    showBranding,
    showTagline,
    showContact,
    showAddress,
    showInvoiceTitle,
    showClientSection,
    showDesignMetrics,
    showPaymentMethod,
    showNotes,
    showPercentageSplit,
    headerAlignment,
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
  ]);

  // Upload/Replace Attached PDF Handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file");
      return;
    }

    const toastId = toast.loading("Processing and saving PDF...");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(arrayBuffer);
          const pageCount = doc.getPageCount();

          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          setAttachedPdfBase64(base64);
          setAttachedPdfName(file.name);
          setAttachedPdfPageCount(pageCount);
          setEnablePdfMerge(true);

          localStorage.setItem("arch_attached_merge_pdf", base64);
          localStorage.setItem("arch_attached_merge_pdf_name", file.name);

          toast.success(`Attached "${file.name}" (${pageCount} page${pageCount > 1 ? "s" : ""})!`, { id: toastId });
          setMergePdfDialogOpen(false);
        } catch (err: any) {
          toast.error("Failed to parse PDF: " + (err?.message || "Invalid PDF"), { id: toastId });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      toast.error("Error reading file", { id: toastId });
    }
  };

  const removeAttachedPdf = () => {
    setAttachedPdfBase64("");
    setAttachedPdfName("");
    setAttachedPdfPageCount(0);
    localStorage.removeItem("arch_attached_merge_pdf");
    localStorage.removeItem("arch_attached_merge_pdf_name");
    toast.info("Attached PDF removed. Invoices will now export as single-page.");
  };

  const restoreDefaultOfferLetter = async () => {
    setAttachedPdfBase64(OFFER_LETTER_TEMPLATE_BASE64);
    setAttachedPdfName("Offer_Letter_2_Pages.pdf");
    setAttachedPdfPageCount(2);
    setEnablePdfMerge(true);
    localStorage.setItem("arch_attached_merge_pdf", OFFER_LETTER_TEMPLATE_BASE64);
    localStorage.setItem("arch_attached_merge_pdf_name", "Offer_Letter_2_Pages.pdf");
    toast.success("Restored default 2-page Offer Letter PDF!");
  };

  // Custom Quick Add Service Handlers
  const addCustomQuickService = () => {
    const title = newServiceInput.trim();
    if (!title) return;
    if (customServices.includes(title) || POPULAR_SERVICE_NAMES.includes(title)) {
      toast.info("Service already in list");
      return;
    }
    const updated = [title, ...customServices];
    setCustomServices(updated);
    try {
      localStorage.setItem("arch_quick_services", JSON.stringify(updated));
      toast.success(`Added "${title}" to Quick Add!`);
    } catch {}
    setNewServiceInput("");
  };

  const removeCustomQuickService = (title: string) => {
    const updated = customServices.filter((s) => s !== title);
    setCustomServices(updated);
    try {
      localStorage.setItem("arch_quick_services", JSON.stringify(updated));
      toast.info(`Removed "${title}" from Quick Add`);
    } catch {}
  };

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
      setRows((prev) =>
        prev.map((r, i) =>
          i === 0
            ? { ...r, service: `Advance for ${lead.services.title}` }
            : r
        )
      );
    }
    if (lead.total_invoice && lead.total_invoice > 0) {
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

  // Save invoice to local storage history
  const saveInvoice = (silent = false) => {
    const newInvoice: InvoiceData = {
      id: "inv_" + Date.now(),
      invoiceNumber,
      date,
      invoiceTitle,
      companyName,
      tagline,
      contactInfo,
      addressInfo,
      showBranding,
      showTagline,
      showContact,
      showAddress,
      showInvoiceTitle,
      showClientSection,
      showDesignMetrics,
      showPaymentMethod,
      showNotes,
      showPercentageSplit,
      headerAlignment,
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
      if (!silent) {
        toast.success(`Invoice ${invoiceNumber} saved to history`);
      }
    } catch {
      if (!silent) {
        toast.error("Failed to save to local storage");
      }
    }
  };

  const loadSavedInvoice = (inv: InvoiceData) => {
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date || dayjs().format("YYYY-MM-DD"));
    setInvoiceTitle(inv.invoiceTitle || "TAX INVOICE");
    setCompanyName(inv.companyName || "Ar. Shagun Yadav");
    setTagline(inv.tagline || "Architect & ArchBIZ Consultant");
    setContactInfo(inv.contactInfo || "+91 98765 43210 | info@arshagunyadav.com");
    setAddressInfo(inv.addressInfo || "Gurugram / New Delhi, NCR, India");
    setShowBranding(inv.showBranding ?? true);
    setShowTagline(inv.showTagline ?? true);
    setShowContact(inv.showContact ?? true);
    setShowAddress(inv.showAddress ?? true);
    setShowInvoiceTitle(inv.showInvoiceTitle ?? true);
    setShowClientSection(inv.showClientSection ?? true);
    setShowDesignMetrics(inv.showDesignMetrics ?? true);
    setShowPaymentMethod(inv.showPaymentMethod ?? true);
    setShowNotes(inv.showNotes ?? true);
    setShowPercentageSplit(inv.showPercentageSplit ?? true);
    setHeaderAlignment(inv.headerAlignment || "center");
    setClientName(inv.clientName || "");
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
    saveInvoice(true);
    window.print();
  };

  // Direct PDF Download function (Merges attached PDF pages + Invoice sheet as final page)
  const handleDownloadPDF = async () => {
    const element = document.getElementById("printable-invoice-sheet");
    if (!element) {
      toast.error("Invoice sheet element not found");
      return;
    }

    // Auto-save draft history on download
    saveInvoice(true);

    setDownloadingPdf(true);
    const toastId = toast.loading(
      enablePdfMerge && attachedPdfBase64
        ? `Merging ${attachedPdfPageCount} PDF pages with Invoice...`
        : "Generating Invoice PDF..."
    );

    try {
      const { toJpeg } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const { PDFDocument } = await import("pdf-lib");

      const safeClient = (clientName || "Client").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${invoiceNumber || "Invoice"}_${safeClient}.pdf`;

      // 1. Capture the visible sheet into high-res JPEG using html-to-image (natively supports all modern CSS: lab, oklch, Tailwind v4)
      const imgData = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      // 2. Build Invoice Page using jsPDF
      const invoicePdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = invoicePdf.internal.pageSize.getWidth();
      const pdfHeight = invoicePdf.internal.pageSize.getHeight();
      invoicePdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      const invoiceArrayBuffer = invoicePdf.output("arraybuffer");

      let finalPdfBytes: Uint8Array;

      // 3. If PDF Merge is enabled and attached PDF exists:
      if (enablePdfMerge && attachedPdfBase64) {
        const invoicePdfDoc = await PDFDocument.load(invoiceArrayBuffer);
        const basePdf = await PDFDocument.load(base64ToUint8Array(attachedPdfBase64));

        const combinedPdf = await PDFDocument.create();

        // Copy all pages from attached PDF (Page 1, 2, ...)
        const pageCount = basePdf.getPageCount();
        const pagesToCopy = Array.from({ length: pageCount }, (_, i) => i);
        const copiedAttachedPages = await combinedPdf.copyPages(
          basePdf,
          pagesToCopy
        );
        copiedAttachedPages.forEach((p) => combinedPdf.addPage(p));

        // Append generated Tax Invoice Sheet as the final page
        const [invoicePage] = await combinedPdf.copyPages(invoicePdfDoc, [0]);
        combinedPdf.addPage(invoicePage);

        finalPdfBytes = await combinedPdf.save();
      } else {
        finalPdfBytes = new Uint8Array(invoiceArrayBuffer);
      }

      // 4. Trigger direct download
      const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      const totalPages = enablePdfMerge && attachedPdfBase64 ? attachedPdfPageCount + 1 : 1;
      toast.success(`Downloaded ${totalPages}-page PDF (${filename})!`, { id: toastId });
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error("Could not export PDF: " + (err?.message || "Unknown error"), { id: toastId });
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Copy WhatsApp summary
  const copyWhatsAppText = () => {
    const lines = [
      `*INVOICE: ${invoiceNumber}*`,
      showBranding ? `*${companyName}* - ${tagline}` : "",
      `-----------------------------------------`,
      `*Client:* ${clientName}`,
      `*Project:* ${projectName}`,
      `*Date:* ${dayjs(date).format("DD MMM, YYYY")}`,
      `*Design Charge:* ₹${ratePerSqft}/${unit}`,
      `*Designable Area:* ${areaSqft} ${unit}`,
      `-----------------------------------------`,
      `*SERVICES & MILESTONES:*`,
      ...rows.map((r) =>
        showPercentageSplit
          ? `• ${r.service} (${r.percentage}%): ${formatINR(r.price)} + Tax: ${formatINR(r.tax)} = *${formatINR(r.total)}*`
          : `• ${r.service}: ${formatINR(r.price)} + Tax: ${formatINR(r.tax)} = *${formatINR(r.total)}*`
      ),
      `-----------------------------------------`,
      `*Sub-total:* ${formatINR(calculatedSubTotal)}`,
      `*GST (${taxRate}%):* + ${formatINR(calculatedTax)}`,
      `*GRAND TOTAL:* *${formatINR(calculatedGrandTotal)}*`,
      `-----------------------------------------`,
      `*Payment Method:* ${paymentMethod}`,
      `\n_Thank you for your business!_`,
    ]
      .filter(Boolean)
      .join("\n");

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
              A4 Studio Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full control over text, alignment, milestone splits, custom services, and A4 print layout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Merge PDF / Attach PDF Button */}
          <Button
            variant="outline"
            onClick={() => setMergePdfDialogOpen(true)}
            className={cn(
              "h-9 gap-1.5 text-xs font-medium border-primary/30",
              attachedPdfBase64 && enablePdfMerge
                ? "bg-primary/5 text-primary border-primary/50"
                : "text-muted-foreground"
            )}
            title="Attach a PDF to merge before the invoice on download"
          >
            <FilePlus className="size-3.5 text-primary" />
            Merge PDF {attachedPdfBase64 && enablePdfMerge ? `(${attachedPdfPageCount} Pgs)` : ""}
          </Button>

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
            onClick={() => saveInvoice(false)}
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

          {/* Download PDF */}
          <Button
            variant="default"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="h-9 gap-1.5 text-xs font-semibold shadow-sm"
          >
            {downloadingPdf ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {enablePdfMerge && attachedPdfBase64
              ? `Download Merged PDF (${attachedPdfPageCount + 1} Pgs)`
              : "Download PDF"}
          </Button>

          {/* Print / Save PDF */}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Printer className="size-3.5" />
            Print (A4)
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Editor on Left / Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: EDIT CONTROLS & SERVICE ROWS MANAGEMENT (Hidden in Print)  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-6 print:hidden">
          {/* 1. Header Branding & Alignment Card (Fully Editable & Removable) */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Header Branding & Alignment
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Alignment:</span>
                <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setHeaderAlignment("center")}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                      headerAlignment === "center"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Center aligned header"
                  >
                    <AlignCenter className="size-3.5" />
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderAlignment("split")}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                      headerAlignment === "split"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Split left-right header"
                  >
                    <AlignLeft className="size-3.5" />
                    Split
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Business Name */}
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Business / Architect Name
                  </Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Ar. Shagun Yadav"
                    className="h-8 text-xs font-semibold"
                    disabled={!showBranding}
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setShowBranding(!showBranding)}
                    className={cn(
                      "p-1.5 rounded-md border text-xs transition-colors",
                      showBranding
                        ? "text-primary border-primary/30 bg-primary/5"
                        : "text-muted-foreground border-border bg-muted/40"
                    )}
                    title={showBranding ? "Visible on invoice (click to hide)" : "Hidden (click to show)"}
                  >
                    {showBranding ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Tagline */}
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Tagline / Subtitle
                  </Label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Architect & ArchBIZ Consultant"
                    className="h-8 text-xs"
                    disabled={!showTagline}
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setShowTagline(!showTagline)}
                    className={cn(
                      "p-1.5 rounded-md border text-xs transition-colors",
                      showTagline
                        ? "text-primary border-primary/30 bg-primary/5"
                        : "text-muted-foreground border-border bg-muted/40"
                    )}
                    title={showTagline ? "Visible on invoice (click to hide)" : "Hidden (click to show)"}
                  >
                    {showTagline ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Phone & Email Line
                  </Label>
                  <Input
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. +91 98765 43210 | info@arshagunyadav.com"
                    className="h-8 text-xs"
                    disabled={!showContact}
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setShowContact(!showContact)}
                    className={cn(
                      "p-1.5 rounded-md border text-xs transition-colors",
                      showContact
                        ? "text-primary border-primary/30 bg-primary/5"
                        : "text-muted-foreground border-border bg-muted/40"
                    )}
                    title={showContact ? "Visible on invoice (click to hide)" : "Hidden (click to show)"}
                  >
                    {showContact ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Address Line */}
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Address / City Line
                  </Label>
                  <Input
                    value={addressInfo}
                    onChange={(e) => setAddressInfo(e.target.value)}
                    placeholder="e.g. Gurugram / New Delhi, NCR, India"
                    className="h-8 text-xs"
                    disabled={!showAddress}
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddress(!showAddress)}
                    className={cn(
                      "p-1.5 rounded-md border text-xs transition-colors",
                      showAddress
                        ? "text-primary border-primary/30 bg-primary/5"
                        : "text-muted-foreground border-border bg-muted/40"
                    )}
                    title={showAddress ? "Visible on invoice (click to hide)" : "Hidden (click to show)"}
                  >
                    {showAddress ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Invoice Title & Number Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Header Title
                  </Label>
                  <Input
                    value={invoiceTitle}
                    onChange={(e) => setInvoiceTitle(e.target.value)}
                    placeholder="TAX INVOICE"
                    className="h-8 text-xs font-bold uppercase mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Invoice #
                    </Label>
                    <button
                      type="button"
                      onClick={() => setInvoiceNumber(generateInvoiceNumber())}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      <RefreshCw className="size-2.5" /> New
                    </button>
                  </div>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-8 text-xs font-mono font-medium mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Invoice Date
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Client & Project Scope Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Billed To & Project Details
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show Card:</span>
                <Switch
                  checked={showClientSection}
                  onCheckedChange={setShowClientSection}
                  className="scale-75"
                />
              </div>
            </div>

            {showClientSection && (
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
            )}
          </div>

          {/* 3. Calculation & Area Settings Card */}
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

            {/* Formula Explainer & Watermark Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground border border-border/50">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span>₹{ratePerSqft}/{unit}</span>
                <span>×</span>
                <span>{areaSqft} {unit}</span>
                <span>=</span>
                <span className="font-semibold text-foreground">{formatINR(baseSubtotal)} Base</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Show Rates:</span>
                  <Switch
                    checked={showDesignMetrics}
                    onCheckedChange={setShowDesignMetrics}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center gap-1.5 border-l pl-3">
                  <span className="text-[11px]">Watermark:</span>
                  <Switch
                    checked={showWatermark}
                    onCheckedChange={setShowWatermark}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Services Milestone Rows Management Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-primary" />
                  Service Milestone Rows
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Edit descriptions, customize prices, split percentages, or add/delete rows.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle for Percentage Split */}
                <div className="flex items-center gap-1.5 border border-border rounded-lg px-2 py-1 bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">% Split:</span>
                  <Switch
                    checked={showPercentageSplit}
                    onCheckedChange={setShowPercentageSplit}
                    className="scale-75"
                  />
                </div>

                {showPercentageSplit && (
                  <Badge
                    variant={totalPercentage === 100 ? "default" : "outline"}
                    className={cn(
                      "font-mono text-xs font-medium px-2 py-0.5",
                      totalPercentage === 100
                        ? "bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400"
                    )}
                  >
                    {totalPercentage}% Split
                  </Badge>
                )}
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
                    {showPercentageSplit && (
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
                    )}

                    <div className={showPercentageSplit ? "col-span-3" : "col-span-4"}>
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

                    <div className={showPercentageSplit ? "col-span-3" : "col-span-4"}>
                      <Label className="text-[10px] text-muted-foreground">
                        Tax ({taxRate}%)
                      </Label>
                      <div className="h-7 flex items-center px-2 rounded-md bg-muted/60 text-muted-foreground font-mono text-xs mt-0.5">
                        {formatINR(row.tax)}
                      </div>
                    </div>

                    <div className={showPercentageSplit ? "col-span-3" : "col-span-4"}>
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

            {/* Add Service Button & Quick Add Suggestions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t">
              <Button
                variant="outline"
                onClick={() => addRow()}
                className="h-8 text-xs gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5"
              >
                <Plus className="size-3.5" />
                Add Service Row
              </Button>

              {/* Quick suggestions dropdown & My Services manager */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Quick Add:</span>
                <select
                  className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-muted-foreground focus:outline-hidden max-w-[180px] sm:max-w-none"
                  onChange={(e) => {
                    if (e.target.value === "__MANAGE__") {
                      setCustomServiceDialogOpen(true);
                      e.target.value = "";
                    } else if (e.target.value) {
                      addRow(e.target.value, 10);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    + Pick Quick Service...
                  </option>
                  {customServices.length > 0 && (
                    <optgroup label="⭐ My Custom Services">
                      {customServices.map((name, i) => (
                        <option key={"custom_" + i} value={name}>
                          ⭐ {name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Standard Architectural Services">
                    {POPULAR_SERVICE_NAMES.map((name, i) => (
                      <option key={"std_" + i} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__MANAGE__">
                    ⚙️ + Manage / Add My Services...
                  </option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => setCustomServiceDialogOpen(true)}
                  className="h-7 text-[11px] px-2 gap-1 text-primary border-primary/30 hover:bg-primary/5 shrink-0"
                  title="Add custom services to Quick Add list"
                >
                  <Plus className="size-3" />
                  My Services
                </Button>
              </div>
            </div>
          </div>

          {/* 5. Attached PDF Merge (Offer Letter / Scope / Proposal) Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Attached PDF for Merge
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Merge your Offer Letter or Proposal as the first pages before the invoice.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Merge on Download:</span>
                <Switch
                  checked={enablePdfMerge && !!attachedPdfBase64}
                  onCheckedChange={(checked) => {
                    if (!attachedPdfBase64) {
                      setMergePdfDialogOpen(true);
                    } else {
                      setEnablePdfMerge(checked);
                    }
                  }}
                  className="scale-75"
                />
              </div>
            </div>

            {attachedPdfBase64 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border text-xs">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                      <Sparkles className="size-3 text-primary shrink-0" />
                      <span className="truncate">{attachedPdfName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {attachedPdfPageCount} Page{attachedPdfPageCount > 1 ? "s" : ""} • Merged as Pages 1-{attachedPdfPageCount} (Invoice on Page {attachedPdfPageCount + 1})
                    </p>
                  </div>

                  <Badge variant="outline" className="bg-emerald-600/10 text-emerald-700 border-emerald-300 shrink-0 font-mono text-[10px]">
                    Attached
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => setMergePdfDialogOpen(true)}
                    className="h-7 text-xs px-2.5 gap-1 text-primary hover:bg-primary/5"
                  >
                    Change PDF
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={restoreDefaultOfferLetter}
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    title="Reset back to default 2-page Offer Letter"
                  >
                    Reset to Default
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={removeAttachedPdf}
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove attached PDF"
                  >
                    <Trash2 className="size-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2 border border-dashed rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  No PDF attached. Invoices will download as single-page.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMergePdfDialogOpen(true)}
                    className="h-7 text-xs px-3 gap-1.5 text-primary"
                  >
                    <Plus className="size-3" />
                    Attach Custom PDF
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={restoreDefaultOfferLetter}
                    className="h-7 text-xs px-3 text-muted-foreground"
                  >
                    Use Default Offer Letter
                  </Button>
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 Your attached PDF is saved in your browser and will <strong>never be removed until you click delete</strong>. Every time you click &quot;Download PDF&quot;, it will automatically merge your PDF before the invoice.
            </p>
          </div>

          {/* 6. Payment Method & Notes Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold border-b pb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Payment Method & Terms
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Show:</span>
                  <Switch
                    checked={showPaymentMethod}
                    onCheckedChange={setShowPaymentMethod}
                    className="scale-75"
                  />
                </div>
              </div>
              {showPaymentMethod && (
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Online/NEFT"
                  className="h-8 text-xs"
                />
              )}

              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs font-medium text-muted-foreground">Terms & Conditions / Notes</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Show:</span>
                  <Switch
                    checked={showNotes}
                    onCheckedChange={setShowNotes}
                    className="scale-75"
                  />
                </div>
              </div>
              {showNotes && (
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="1. All drawings and design revisions will be shared digitally."
                  className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground focus:outline-hidden"
                />
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE INVOICE PREVIEW & PRINT SHEET (TRUE A4 CENTERED)      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="sticky top-6 space-y-3 w-full max-w-[210mm]">
            <div className="flex items-center justify-between px-1 print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Printer className="size-3.5 text-primary" />
                Live Printable A4 Invoice Sheet
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-500 bg-white">
                  210 × 297 mm (A4)
                </Badge>
              </div>
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
                  margin: 0 auto !important;
                  page-break-after: avoid !important;
                  page-break-inside: avoid !important;
                  overflow: hidden !important;
                  background: white !important;
                }
              }
            `}} />

            {/* Interactive Edit Hint Banner */}
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-xs text-primary font-medium print:hidden shadow-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <span><strong>Direct Inline Editor:</strong> Click on any text directly on the sheet below to edit it live!</span>
              </span>
              <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary border-none">
                Interactive
              </Badge>
            </div>

            {/* A4 Paper Container with White Background for Exact Visual & Print Rendering */}
            <div
              id="printable-invoice-sheet"
              className={cn(
                "relative mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 border border-zinc-300 rounded-lg shadow-xl p-8 sm:p-10 overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:w-[210mm] print:h-[297mm] print:bg-white print:text-black",
                "font-sans antialiased flex flex-col justify-between"
              )}
            >
              {/* Optional Sofa Background Watermark */}
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
                {/* 1. Header & Architect Branding (Center vs Split Layout) */}
                {headerAlignment === "center" ? (
                  /* ================================================================= */
                  /* CENTER-ALIGNED HEADER (Requested default)                          */
                  /* ================================================================= */
                  <div className="flex flex-col items-center text-center border-b-2 border-zinc-900 pb-5 space-y-2">
                    {showInvoiceTitle && (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setInvoiceTitle(e.currentTarget.textContent || "TAX INVOICE")}
                        className="inline-block bg-zinc-950 text-white px-4 py-1 text-xs font-black tracking-widest uppercase rounded-xs outline-none focus:ring-2 focus:ring-primary hover:bg-zinc-800 cursor-text transition-all"
                        title="Click to edit title"
                      >
                        {invoiceTitle}
                      </div>
                    )}

                    {showBranding && (
                      <div className="space-y-0.5 pt-1">
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setCompanyName(e.currentTarget.textContent || "")}
                          className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 uppercase outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text transition-all"
                          title="Click to edit business name"
                        >
                          {companyName}
                        </h1>

                        {showTagline && (
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setTagline(e.currentTarget.textContent || "")}
                            className="text-xs font-bold tracking-widest text-zinc-600 uppercase outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text transition-all"
                            title="Click to edit tagline"
                          >
                            {tagline || "ARCHITECT & ARCHBIZ CONSULTANT"}
                          </p>
                        )}
                      </div>
                    )}

                    {(showContact || showAddress) && (
                      <div className="text-[11px] text-zinc-500 space-y-0.5 leading-relaxed pt-0.5">
                        {showContact && (
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setContactInfo(e.currentTarget.textContent || "")}
                            className="outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text transition-all"
                            title="Click to edit contact line"
                          >
                            {contactInfo || "+91 98765 43210 | info@arshagunyadav.com"}
                          </p>
                        )}
                        {showAddress && (
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setAddressInfo(e.currentTarget.textContent || "")}
                            className="outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text transition-all"
                            title="Click to edit address line"
                          >
                            {addressInfo || "Gurugram / New Delhi, NCR, India"}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Invoice Number & Date centered bar */}
                    <div className="flex items-center justify-center gap-4 text-xs pt-1 border-t border-zinc-200 w-full max-w-sm">
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setInvoiceNumber(e.currentTarget.textContent || "")}
                        className="font-mono font-bold text-zinc-900 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit invoice number"
                      >
                        {invoiceNumber}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-600">
                        Date: <strong className="text-zinc-900 font-semibold">{dayjs(date).format("DD MMM, YYYY")}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ================================================================= */
                  /* SPLIT (LEFT / RIGHT) HEADER                                       */
                  /* ================================================================= */
                  <div className="flex flex-row items-start justify-between border-b-2 border-zinc-900 pb-5">
                    <div>
                      {showBranding && (
                        <>
                          <h1
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setCompanyName(e.currentTarget.textContent || "")}
                            className="text-2xl font-black tracking-tight text-zinc-950 uppercase outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text transition-all"
                            title="Click to edit business name"
                          >
                            {companyName}
                          </h1>
                          {showTagline && (
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => setTagline(e.currentTarget.textContent || "")}
                              className="text-xs font-semibold tracking-wide text-zinc-600 uppercase mt-0.5 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text transition-all"
                              title="Click to edit tagline"
                            >
                              {tagline || "ARCHITECT & ARCHBIZ CONSULTANT"}
                            </p>
                          )}
                        </>
                      )}
                      {(showContact || showAddress) && (
                        <div className="text-[11px] text-zinc-500 mt-2 space-y-0.5 leading-relaxed">
                          {showContact && (
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => setContactInfo(e.currentTarget.textContent || "")}
                              className="outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                            >
                              {contactInfo}
                            </p>
                          )}
                          {showAddress && (
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => setAddressInfo(e.currentTarget.textContent || "")}
                              className="outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                            >
                              {addressInfo}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {showInvoiceTitle && (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setInvoiceTitle(e.currentTarget.textContent || "TAX INVOICE")}
                          className="inline-block bg-zinc-950 text-white px-3 py-1 text-xs font-black tracking-widest uppercase outline-none focus:ring-2 focus:ring-primary cursor-text"
                        >
                          {invoiceTitle}
                        </div>
                      )}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setInvoiceNumber(e.currentTarget.textContent || "")}
                        className="text-xs font-mono font-bold text-zinc-900 mt-2 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                      >
                        {invoiceNumber}
                      </div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">
                        Date: <span className="font-semibold text-zinc-800">{dayjs(date).format("DD MMM, YYYY")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Client & Project Details Bar (Optional / Toggleable) */}
                {showClientSection && (
                  <div className="grid grid-cols-2 gap-4 rounded-md bg-zinc-50 p-3.5 text-xs border border-zinc-200">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Billed To
                      </span>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setClientName(e.currentTarget.textContent || "")}
                        className="font-bold text-zinc-900 text-sm mt-0.5 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit client name"
                      >
                        {clientName || "Client Name"}
                      </p>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setClientPhone(e.currentTarget.textContent || "")}
                        className="text-zinc-600 text-[11px] mt-0.5 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit phone"
                      >
                        {clientPhone || "+91 Phone Number"}
                      </p>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setClientEmail(e.currentTarget.textContent || "")}
                        className="text-zinc-600 text-[11px] outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit email"
                      >
                        {clientEmail || "client@email.com"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Project Site & Scope
                      </span>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setProjectName(e.currentTarget.textContent || "")}
                        className="font-bold text-zinc-900 text-sm mt-0.5 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit project title"
                      >
                        {projectName || "Interior Architecture"}
                      </p>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setSiteAddress(e.currentTarget.textContent || "")}
                        className="text-zinc-600 text-[11px] mt-0.5 line-clamp-2 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit site address"
                      >
                        {siteAddress || "Site Location Address"}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. The Core Milestone Table */}
                <div className="overflow-hidden border border-zinc-950">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-black text-white text-xs font-black tracking-wider uppercase">
                        <th className={cn("py-2.5 px-3 border-r border-zinc-800 font-extrabold", showPercentageSplit ? "w-[44%]" : "w-[56%]")}>
                          SERVICE
                        </th>
                        {showPercentageSplit && (
                          <th className="py-2.5 px-3 border-r border-zinc-800 text-center font-extrabold w-[12%]">
                            %
                          </th>
                        )}
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
                          <td
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateRowService(row.id, e.currentTarget.textContent || "")}
                            className="py-3 px-3 border-r border-zinc-300 font-medium text-zinc-900 leading-snug outline-none focus:bg-primary/10 hover:bg-primary/5 cursor-text"
                            title="Click to edit service name"
                          >
                            {row.service}
                          </td>
                          {showPercentageSplit && (
                            <td
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const val = parseFloat(e.currentTarget.textContent || "0");
                                if (!isNaN(val)) updateRowPercentage(row.id, val);
                              }}
                              className="py-3 px-3 border-r border-zinc-300 text-center font-mono font-semibold text-zinc-800 outline-none focus:bg-primary/10 hover:bg-primary/5 cursor-text"
                              title="Click to edit percentage"
                            >
                              {row.percentage}
                            </td>
                          )}
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
                    {showDesignMetrics && (
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
                    )}

                    {showPaymentMethod && (
                      <div className="pt-1">
                        <p className="text-sm font-black text-zinc-950">
                          Payment Method :
                        </p>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setPaymentMethod(e.currentTarget.textContent || "")}
                          className="text-xs text-zinc-700 font-medium mt-0.5 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                          title="Click to edit payment method"
                        >
                          {paymentMethod || "Online/NEFT"}
                        </p>
                      </div>
                    )}

                    {showNotes && (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setNotes(e.currentTarget.textContent || "")}
                        className="text-[10px] text-zinc-500 whitespace-pre-line leading-relaxed pt-2 outline-none focus:bg-primary/10 hover:outline-dashed hover:outline-1 hover:outline-primary/50 rounded px-1 cursor-text"
                        title="Click to edit terms / notes"
                      >
                        {notes || "1. All drawings and design revisions will be shared digitally."}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Exact Summary Box */}
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
      {/* DIALOG: ATTACH / MERGE CUSTOM PDF                                        */}
      {/* ========================================================================= */}
      <Dialog open={mergePdfDialogOpen} onOpenChange={setMergePdfDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FilePlus className="size-4 text-primary" />
              Manage Attached PDF for Merge
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload any PDF document (e.g. Offer Letter, Scope of Work, Terms). It will remain saved in your browser until deleted and will be merged before the invoice every time you download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {attachedPdfBase64 ? (
              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    Currently Attached PDF
                  </span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                    {attachedPdfPageCount} Pages
                  </Badge>
                </div>
                <p className="font-mono text-xs text-foreground truncate">{attachedPdfName}</p>
                <p className="text-[11px] text-muted-foreground">
                  Will appear as Pages 1-{attachedPdfPageCount}, with the Tax Invoice on Page {attachedPdfPageCount + 1}.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-dashed text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No custom PDF attached</p>
                <p className="text-[11px]">Upload a PDF below to merge it automatically with every invoice.</p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handlePdfUpload}
              className="hidden"
            />

            <div className="space-y-2">
              <Button
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-9 text-xs gap-2"
              >
                <Upload className="size-3.5" />
                {attachedPdfBase64 ? "Upload & Replace PDF (.pdf)" : "Upload Custom PDF (.pdf)"}
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={restoreDefaultOfferLetter}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Use Default Offer Letter
                </Button>
                {attachedPdfBase64 && (
                  <Button
                    variant="outline"
                    onClick={removeAttachedPdf}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Remove PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      {/* DIALOG: MANAGE MY QUICK ADD SERVICES                                      */}
      {/* ========================================================================= */}
      <Dialog open={customServiceDialogOpen} onOpenChange={setCustomServiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Manage My Quick Add Services
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add your own custom service deliverables to quickly insert them into any invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Input
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                placeholder="e.g. 3D Architectural Walkthrough Video"
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomQuickService();
                  }
                }}
              />
              <Button
                variant="default"
                onClick={addCustomQuickService}
                className="h-8 text-xs px-3"
              >
                Add Service
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Saved Custom Services ({customServices.length})
              </Label>
              {customServices.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-muted/20">
                  No custom services added yet. Type above to add your own!
                </div>
              ) : (
                <div className="divide-y border rounded-lg max-h-[240px] overflow-y-auto">
                  {customServices.map((name, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <Sparkles className="size-3 text-amber-500" />
                        {name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            addRow(name, 10);
                            setCustomServiceDialogOpen(false);
                          }}
                          className="h-6 text-[10px] text-primary hover:bg-primary/10 px-1.5"
                        >
                          + Use in Invoice
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomQuickService(name)}
                          className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove custom service"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
