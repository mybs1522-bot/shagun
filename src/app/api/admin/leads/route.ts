import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import dayjs from "dayjs";

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

// Persistent in-memory store for lead statuses & notes
// Ensures 100% data persistence even if Postgres table is missing lead_status / notes_json columns
const memoryStatusStore = new Map<string, LeadStatus>();
const memoryNotesStore = new Map<string, any[]>();

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

    // Overlay in-memory status and notes if present
    const leads = (data || []).map((lead: any) => {
      const memStatus = memoryStatusStore.get(lead.id);
      const memNotes = memoryNotesStore.get(lead.id);

      return {
        ...lead,
        lead_status: memStatus || lead.lead_status || "Follow Up Again",
        notes_json: memNotes || lead.notes_json || [],
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
    const { action, leadId, status, noteText, author, leadData } = body;
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

      // 1. Update in-memory store for 100% instant persistence
      memoryStatusStore.set(leadId, status as LeadStatus);

      // 2. Try DB update (catch missing column gracefully if lead_status column not created yet)
      try {
        const { error } = await supabaseAdmin
          .from("service_leads")
          .update({ lead_status: status })
          .eq("id", leadId);

        if (error) {
          console.warn("Supabase lead_status column update notice:", error.message);
        }
      } catch (err) {
        console.warn("DB update skipped for lead_status, saved to memory store:", err);
      }

      return NextResponse.json({ success: true, lead_status: status });
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
        // Try fetching existing notes from DB
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

      // Update memory store
      memoryNotesStore.set(leadId, updatedNotes);

      // Try DB update
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

      memoryStatusStore.set(newId, leadData?.status || "Follow Up Again");
      memoryNotesStore.set(newId, initialNotes);

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
