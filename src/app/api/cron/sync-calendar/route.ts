import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getCalendarClient() {
  let rawKey = (process.env.GOOGLE_CALENDAR_PRIVATE_KEY || "").trim();
  if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
    rawKey = rawKey.substring(1, rawKey.length - 1);
  }
  const privateKey = rawKey.includes("\\n")
    ? rawKey.split("\\n").join("\n")
    : rawKey;

  let clientEmail = (process.env.GOOGLE_CALENDAR_CLIENT_EMAIL || "").trim();
  if (clientEmail.startsWith('"') && clientEmail.endsWith('"')) {
    clientEmail = clientEmail.substring(1, clientEmail.length - 1);
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export async function GET(req: NextRequest) {
  try {
    // Basic Cron Security (Vercel automatically sets CRON_SECRET)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    let calendarId = (process.env.GOOGLE_CALENDAR_ID || "").trim();
    if (calendarId.startsWith('"') && calendarId.endsWith('"')) {
      calendarId = calendarId.substring(1, calendarId.length - 1);
    }

    if (!calendarId) {
      return NextResponse.json({ error: "Missing GOOGLE_CALENDAR_ID" }, { status: 400 });
    }

    const calendar = getCalendarClient();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    // Fetch Google Calendar events (past 7 days to next 30 days)
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const gEvents = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
    });

    const existingSummaries = (gEvents.data.items || []).map(
      (e) => e.summary || ""
    );

    // Fetch completed leads with appointments
    const { data: leads, error } = await supabase
      .from("service_leads")
      .select(`
        id,
        name,
        phone,
        appointment_date,
        appointment_time,
        payment_status,
        services (
          title
        )
      `)
      .not("appointment_date", "is", null)
      .not("appointment_time", "is", null)
      .eq("payment_status", "completed");

    if (error) throw error;

    let syncedCount = 0;

    if (leads && leads.length > 0) {
      for (const lead of leads) {
        const serviceName = (lead.services as any)?.title || "Consultation Call";
        const eventSummary = `📞 ${serviceName} — ${lead.name}`;

        // Check if event already exists
        const alreadyExists = existingSummaries.some(
          (summary) =>
            summary.includes(lead.name) ||
            (lead.name.includes("TXN:") && summary.includes(lead.name.split(" (TXN:")[0]))
        );

        if (alreadyExists) continue;

        const dateTimeStr = `${lead.appointment_date} ${lead.appointment_time}`;
        const dateTime = new Date(dateTimeStr);
        if (isNaN(dateTime.getTime())) continue;

        const startTime = dateTime.toISOString();
        const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString();

        await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: eventSummary,
            description: `Client: ${lead.name}\nPhone: ${lead.phone}\nService: ${serviceName}`,
            start: { dateTime: startTime, timeZone: "Asia/Kolkata" },
            end: { dateTime: endTime, timeZone: "Asia/Kolkata" },
          },
        });

        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. Synced ${syncedCount} new events.`,
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
