import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCalendarClient, parseKolkataDateTime } from "@/lib/google-calendar";
import { isAdminBlockedLead } from "@/lib/blocked-slots";

export async function POST(req: NextRequest) {
  try {
    const { leadId, name, phone, serviceName, date, time, floorPlanUrl } = await req.json();

    if (!date || !time) {
      return NextResponse.json(
        { error: "Date and time are required" },
        { status: 400 }
      );
    }

    // Do not show or push admin blocked slots to Google Calendar!
    if (isAdminBlockedLead({ id: leadId, name, phone })) {
      return NextResponse.json({
        success: true,
        message: "Admin blocked call not added to Google Calendar",
      });
    }

    // Guard: If leadId is provided, verify it is not an unpaid/pending lead for a paid service
    if (leadId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            ""
        );
        const { data: leadRecord } = await supabase
          .from("service_leads")
          .select("payment_status, service_id, services(amount)")
          .eq("id", leadId)
          .maybeSingle();

        if (leadRecord) {
          const isPaid = leadRecord.payment_status === "completed";
          const amount = (leadRecord.services as any)?.amount ?? 0;
          const isPaidService = amount > 0;

          // Never add unpaid appointments for paid services to Google Calendar
          if (isPaidService && !isPaid) {
            return NextResponse.json(
              {
                success: false,
                error: "Cannot add unpaid or pending payment appointment to Google Calendar",
              },
              { status: 400 }
            );
          }
        }
      } catch (err) {
        console.error("Error verifying payment status in /api/calendar:", err);
      }
    }

    const calendar = getCalendarClient();
    let calendarId = (process.env.GOOGLE_CALENDAR_ID || "").trim();
    if (calendarId.startsWith('"') && calendarId.endsWith('"')) {
      calendarId = calendarId.substring(1, calendarId.length - 1);
    }

    let dateTime;
    try {
      dateTime = parseKolkataDateTime(date, time);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Invalid date/time format" },
        { status: 400 }
      );
    }

    // Create a 1-hour event
    const startTime = dateTime.toISOString();
    const endTime = new Date(
      dateTime.getTime() + 60 * 60 * 1000
    ).toISOString();

    const event = {
      summary: `📞 ${serviceName} — ${name}`,
      description: [
        `👤 Client: ${name}`,
        `📞 Phone: ${phone}`,
        `🛎️ Service: ${serviceName}`,
        floorPlanUrl ? `📐 Floor Plan: ${floorPlanUrl}` : "",
        ``,
        `Booked via Shagun Yadav Website`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: startTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // Update database lead record with Google Calendar Event ID
    if (leadId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        );
        await supabase
          .from("service_leads")
          .update({ google_calendar_event_id: response.data.id })
          .eq("id", leadId);
      } catch (dbErr) {
        console.error("Failed to update google_calendar_event_id in DB:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (error: unknown) {
    console.error("Google Calendar error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
