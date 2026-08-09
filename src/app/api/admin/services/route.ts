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

    return NextResponse.json({ services: data || [] });
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
