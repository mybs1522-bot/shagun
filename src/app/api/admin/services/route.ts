import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching services via admin client:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch all completed payments from service_leads
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("service_leads")
      .select(`
        id,
        name,
        phone,
        service_id,
        payment_status,
        paid_at,
        created_at,
        appointment_date,
        appointment_time,
        razorpay_order_id,
        money_received,
        lead_status
      `)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false });

    if (leadsError) {
      console.error("Error fetching leads via admin client:", leadsError);
    }

    // Filter out admin-blocked slots
    const realCompletedLeads = (leads || []).filter((lead: any) => {
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

    return NextResponse.json({
      services: data || [],
      completedLeads: realCompletedLeads,
    });
  } catch (err: any) {
    console.error("Admin GET services error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, serviceId, payload, reorderedItems } = body;
    const supabaseAdmin = getSupabaseAdmin();

    if (action === "reorder") {
      if (!Array.isArray(reorderedItems)) {
        return NextResponse.json({ error: "reorderedItems must be an array" }, { status: 400 });
      }

      for (const item of reorderedItems) {
        const { error } = await supabaseAdmin
          .from("services")
          .update({ display_order: item.display_order })
          .eq("id", item.id);

        if (error) {
          console.error(`Error updating display_order for service ${item.id}:`, error);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "save_service") {
      if (!payload || !payload.title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      if (serviceId) {
        // Update existing service
        const { data, error } = await supabaseAdmin
          .from("services")
          .update(payload)
          .eq("id", serviceId)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, service: data });
      } else {
        // Insert new service
        const { data, error } = await supabaseAdmin
          .from("services")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, service: data });
      }
    }

    if (action === "delete_service") {
      if (!serviceId) {
        return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin POST services error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
