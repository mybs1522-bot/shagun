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

    return NextResponse.json({ leads: data || [] });
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

      const { data, error } = await supabaseAdmin
        .from("service_leads")
        .update({ lead_status: status })
        .eq("id", leadId)
        .select()
        .single();

      if (error) {
        console.error("Failed to update status in DB:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, lead: data });
    }

    if (action === "add_note") {
      if (!leadId || !noteText || !noteText.trim()) {
        return NextResponse.json(
          { error: "leadId and non-empty noteText are required" },
          { status: 400 }
        );
      }

      // Fetch existing lead notes first
      const { data: existingLead, error: fetchErr } = await supabaseAdmin
        .from("service_leads")
        .select("notes_json")
        .eq("id", leadId)
        .single();

      if (fetchErr) {
        console.error("Error fetching lead for note append:", fetchErr);
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      let currentNotes: any[] = [];
      if (existingLead?.notes_json) {
        if (Array.isArray(existingLead.notes_json)) {
          currentNotes = existingLead.notes_json;
        } else {
          try {
            currentNotes = JSON.parse(existingLead.notes_json);
          } catch {}
        }
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

      const { data, error: updateErr } = await supabaseAdmin
        .from("service_leads")
        .update({ notes_json: JSON.stringify(updatedNotes) })
        .eq("id", leadId)
        .select()
        .single();

      if (updateErr) {
        console.error("Failed to update notes in DB:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, lead: data, notes: updatedNotes });
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

      const { data, error } = await supabaseAdmin
        .from("service_leads")
        .insert({
          id: newId,
          name: leadData?.name?.trim() || "New Lead",
          phone: leadData?.phone?.trim() || "",
          payment_status: "completed",
          lead_status: leadData?.status || "Follow Up Again",
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
        console.error("Error creating lead in DB:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, lead: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin POST leads route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
