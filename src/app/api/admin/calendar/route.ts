import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const AVAILABLE_TIMES = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

// Persistent in-memory store for blocked slots fallback
const memoryBlockedSlots = new Set<string>(); // "YYYY-MM-DD_HH:MM AM/PM"

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("service_leads")
      .select(`
        id,
        name,
        phone,
        appointment_date,
        appointment_time,
        payment_status,
        lead_status,
        created_at,
        services (
          title
        )
      `)
      .not("appointment_date", "is", null)
      .not("appointment_time", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching calendar slots via admin client:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rawLeads = data || [];

    // Filter out unpaid/pending leads! Only keep completed payments OR admin-blocked slots!
    const validLeads = rawLeads.filter((l: any) => {
      const isPaid = l.payment_status === "completed";
      const isAdminBlocked =
        l.phone === "0000000000" ||
        l.name === "Admin Blocked Slot" ||
        l.id?.startsWith("block_") ||
        l.id?.startsWith("mem_block_");

      return isPaid || isAdminBlocked;
    });

    // Overlay memory blocked slots if not already in validLeads
    const existingKeys = new Set(
      validLeads.map((l: any) => `${l.appointment_date}_${l.appointment_time}`)
    );

    memoryBlockedSlots.forEach((key) => {
      if (!existingKeys.has(key)) {
        const [date, time] = key.split("_");
        validLeads.push({
          id: `mem_block_${key}`,
          name: "Admin Blocked Slot",
          phone: "0000000000",
          appointment_date: date,
          appointment_time: time,
          payment_status: "completed",
          lead_status: "Closed",
          created_at: new Date().toISOString(),
          services: { title: "Blocked by Admin" } as any,
        });
      }
    });

    return NextResponse.json({ slots: validLeads });
  } catch (err: any) {
    console.error("Admin GET calendar route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, time } = body;
    const supabaseAdmin = getSupabaseAdmin();

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    if (action === "block_slot") {
      if (!time) {
        return NextResponse.json({ error: "time is required" }, { status: 400 });
      }

      const key = `${date}_${time}`;
      memoryBlockedSlots.add(key);

      const blockId = `block_${date.replace(/-/g, "")}_${time.replace(/[: ]/g, "")}`;

      try {
        await supabaseAdmin.from("service_leads").upsert(
          {
            id: blockId,
            name: "Admin Blocked Slot",
            phone: "0000000000",
            appointment_date: date,
            appointment_time: time,
            payment_status: "completed",
            lead_status: "Closed",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.warn("Supabase block_slot insert notice:", err);
      }

      return NextResponse.json({ success: true, date, time, blocked: true });
    }

    if (action === "unblock_slot") {
      if (!time) {
        return NextResponse.json({ error: "time is required" }, { status: 400 });
      }

      const key = `${date}_${time}`;
      memoryBlockedSlots.delete(key);

      try {
        await supabaseAdmin
          .from("service_leads")
          .delete()
          .eq("appointment_date", date)
          .eq("appointment_time", time)
          .eq("phone", "0000000000");
      } catch (err) {
        console.warn("Supabase unblock_slot delete notice:", err);
      }

      return NextResponse.json({ success: true, date, time, blocked: false });
    }

    if (action === "block_day") {
      const insertedSlots: string[] = [];

      for (const t of AVAILABLE_TIMES) {
        const key = `${date}_${t}`;
        memoryBlockedSlots.add(key);

        const blockId = `block_${date.replace(/-/g, "")}_${t.replace(/[: ]/g, "")}`;
        try {
          await supabaseAdmin.from("service_leads").upsert(
            {
              id: blockId,
              name: "Admin Blocked Slot",
              phone: "0000000000",
              appointment_date: date,
              appointment_time: t,
              payment_status: "completed",
              lead_status: "Closed",
              created_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
          insertedSlots.push(t);
        } catch (err) {
          console.warn(`Error upserting blocked slot ${key}:`, err);
        }
      }

      return NextResponse.json({ success: true, date, blockedSlots: AVAILABLE_TIMES });
    }

    if (action === "unblock_day") {
      AVAILABLE_TIMES.forEach((t) => {
        memoryBlockedSlots.delete(`${date}_${t}`);
      });

      try {
        await supabaseAdmin
          .from("service_leads")
          .delete()
          .eq("appointment_date", date)
          .eq("phone", "0000000000");
      } catch (err) {
        console.warn("Supabase unblock_day delete notice:", err);
      }

      return NextResponse.json({ success: true, date, unblocked: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin POST calendar route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
