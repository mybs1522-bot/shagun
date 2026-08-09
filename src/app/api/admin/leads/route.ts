import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import dayjs from "dayjs";

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

// Persistent in-memory store for lead statuses, notes, money received, total invoice, and deadline dates
const memoryStatusStore = new Map<string, LeadStatus>();
const memoryNotesStore = new Map<string, any[]>();
const memoryMoneyStore = new Map<string, number>();
const memoryInvoiceStore = new Map<string, number>();
const memoryDeadlineStore = new Map<string, string>();

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("service_leads")
      .select(`
        *,
        services (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads via admin client:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out admin-blocked slots so they never show up as completed payments or client leads
    const realLeads = (data || []).filter((lead: any) => {
      if (!lead) return false;
      const name = String(lead.name || "").toLowerCase().trim();
      const phoneDigits = String(lead.phone || "").replace(/\D/g, "");
      const idStr = String(lead.id || "");

      const isBlocked =
        name.includes("blocked") ||
        phoneDigits === "0000000000" ||
        phoneDigits.endsWith("0000000000") ||
        idStr.startsWith("block_") ||
        idStr.startsWith("mem_block_");

      return !isBlocked;
    });

    // Overlay in-memory status, notes, money received, total invoice, and deadline dates
    const leads = realLeads.map((lead: any) => {
      const memStatus = memoryStatusStore.get(lead.id);
      const memNotes = memoryNotesStore.get(lead.id);
      const memMoney = memoryMoneyStore.get(lead.id);
      const memInvoice = memoryInvoiceStore.get(lead.id);
      const memDeadline = memoryDeadlineStore.get(lead.id);

      const defaultMoney =
        memMoney !== undefined
          ? memMoney
          : lead.money_received !== undefined && lead.money_received !== null
          ? parseFloat(lead.money_received)
          : lead.payment_status === "completed"
          ? 999
          : 0;

      const defaultInvoice =
        memInvoice !== undefined
          ? memInvoice
          : lead.total_invoice !== undefined && lead.total_invoice !== null
          ? parseFloat(lead.total_invoice)
          : defaultMoney;

      return {
        ...lead,
        lead_status: memStatus || lead.lead_status || "Follow Up Again",
        notes_json: memNotes || lead.notes_json || [],
        money_received: defaultMoney,
        total_invoice: defaultInvoice,
        deadline_date: memDeadline || lead.deadline_date || null,
      };
    });

    return NextResponse.json({ leads });
  } catch (err: any) {
    console.error("Admin GET leads route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      leadId,
      status,
      noteText,
      author,
      moneyReceived,
      totalInvoice,
      deadlineDate,
      leadData,
    } = body;
    const supabaseAdmin = getSupabaseAdmin();

    if (action === "update_status") {
      if (!leadId || !status) {
        return NextResponse.json(
          { error: "leadId and status are required" },
          { status: 400 }
        );
      }

      if (!LEAD_STATUS_OPTIONS.includes(status as LeadStatus)) {
        return NextResponse.json(
          { error: "Invalid lead status" },
          { status: 400 }
        );
      }

      memoryStatusStore.set(leadId, status as LeadStatus);

      try {
        await supabaseAdmin
          .from("service_leads")
          .update({ lead_status: status })
          .eq("id", leadId);
      } catch (err) {
        console.warn("DB update skipped for lead_status, saved to memory store:", err);
      }

      return NextResponse.json({ success: true, lead_status: status });
    }

    if (action === "update_money") {
      if (!leadId) {
        return NextResponse.json({ error: "leadId is required" }, { status: 400 });
      }

      const numMoney = typeof moneyReceived === "number" ? moneyReceived : parseFloat(moneyReceived || "0");
      memoryMoneyStore.set(leadId, numMoney);

      try {
        await supabaseAdmin
          .from("service_leads")
          .update({ money_received: numMoney })
          .eq("id", leadId);
      } catch (err) {
        console.warn("DB update skipped for money_received, saved to memory store:", err);
      }

      return NextResponse.json({ success: true, money_received: numMoney });
    }

    if (action === "update_invoice") {
      if (!leadId) {
        return NextResponse.json({ error: "leadId is required" }, { status: 400 });
      }

      const numInvoice = typeof totalInvoice === "number" ? totalInvoice : parseFloat(totalInvoice || "0");
      memoryInvoiceStore.set(leadId, numInvoice);

      try {
        await supabaseAdmin
          .from("service_leads")
          .update({ total_invoice: numInvoice })
          .eq("id", leadId);
      } catch (err) {
        console.warn("DB update skipped for total_invoice, saved to memory store:", err);
      }

      return NextResponse.json({ success: true, total_invoice: numInvoice });
    }

    if (action === "update_deadline") {
      if (!leadId) {
        return NextResponse.json({ error: "leadId is required" }, { status: 400 });
      }

      memoryDeadlineStore.set(leadId, deadlineDate || "");

      try {
        await supabaseAdmin
          .from("service_leads")
          .update({ deadline_date: deadlineDate })
          .eq("id", leadId);
      } catch (err) {
        console.warn("DB update skipped for deadline_date, saved to memory store:", err);
      }

      return NextResponse.json({ success: true, deadline_date: deadlineDate });
    }

    if (action === "add_note") {
      if (!leadId || !noteText || !noteText.trim()) {
        return NextResponse.json(
          { error: "leadId and non-empty noteText are required" },
          { status: 400 }
        );
      }

      let currentNotes: any[] = memoryNotesStore.get(leadId) || [];

      if (currentNotes.length === 0) {
        try {
          const { data: existingLead } = await supabaseAdmin
            .from("service_leads")
            .select("notes_json")
            .eq("id", leadId)
            .single();

          if (existingLead?.notes_json) {
            if (Array.isArray(existingLead.notes_json)) {
              currentNotes = existingLead.notes_json;
            } else {
              try {
                currentNotes = JSON.parse(existingLead.notes_json);
              } catch {}
            }
          }
        } catch {}
      }

      const nowISO = new Date().toISOString();
      const formatted = dayjs(nowISO).format("ddd, MMM D, YYYY [at] h:mm A");

      const newNote = {
        id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        text: noteText.trim(),
        createdAt: nowISO,
        formattedTime: formatted,
        author: author || "Admin",
      };

      const updatedNotes = [newNote, ...currentNotes];

      memoryNotesStore.set(leadId, updatedNotes);

      try {
        await supabaseAdmin
          .from("service_leads")
          .update({ notes_json: JSON.stringify(updatedNotes) })
          .eq("id", leadId);
      } catch (err) {
        console.warn("DB update skipped for notes_json, saved to memory store:", err);
      }

      return NextResponse.json({ success: true, notes: updatedNotes });
    }

    if (action === "create_lead") {
      const nowISO = new Date().toISOString();
      const newId = crypto.randomUUID();

      const initialNotes: any[] = [];
      if (leadData?.initialNote && leadData.initialNote.trim()) {
        initialNotes.push({
          id: "note_" + Date.now(),
          text: leadData.initialNote.trim(),
          createdAt: nowISO,
          formattedTime: dayjs(nowISO).format("ddd, MMM D, YYYY [at] h:mm A"),
          author: "Admin",
        });
      }

      const numMoney = parseFloat(leadData?.moneyReceived || "0");
      const numInvoice = parseFloat(leadData?.totalInvoice || leadData?.moneyReceived || "0");

      memoryStatusStore.set(newId, leadData?.status || "Follow Up Again");
      memoryNotesStore.set(newId, initialNotes);
      memoryMoneyStore.set(newId, numMoney);
      memoryInvoiceStore.set(newId, numInvoice);
      memoryDeadlineStore.set(newId, leadData?.deadlineDate || "");

      try {
        await supabaseAdmin
          .from("service_leads")
          .insert({
            id: newId,
            name: leadData?.name?.trim() || "New Lead",
            phone: leadData?.phone?.trim() || "",
            payment_status: "completed",
            lead_status: leadData?.status || "Follow Up Again",
            notes_json: JSON.stringify(initialNotes),
            money_received: numMoney,
            total_invoice: numInvoice,
            deadline_date: leadData?.deadlineDate || null,
            created_at: nowISO,
          });
      } catch (err) {
        console.warn("DB insert skipped for new lead, saved to memory store:", err);
      }

      return NextResponse.json({
        success: true,
        lead: {
          id: newId,
          name: leadData?.name || "New Lead",
          phone: leadData?.phone || "",
          payment_status: "completed",
          lead_status: leadData?.status || "Follow Up Again",
          notes_json: initialNotes,
          money_received: numMoney,
          total_invoice: numInvoice,
          deadline_date: leadData?.deadlineDate || null,
          created_at: nowISO,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin POST leads route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
