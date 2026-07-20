import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

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

function parseKolkataDateTime(dateStr: string, timeStr: string): Date {
  const timeRegex = /(\d+):(\d+)\s*(AM|PM)/i;
  const match = timeStr.match(timeRegex);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  
  const tempDate = new Date(dateStr);
  if (isNaN(tempDate.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  
  const yyyy = tempDate.getFullYear();
  const month = String(tempDate.getMonth() + 1).padStart(2, "0");
  const dd = String(tempDate.getDate()).padStart(2, "0");
  
  const kolkataISO = `${yyyy}-${month}-${dd}T${hh}:${mm}:00+05:30`;
  return new Date(kolkataISO);
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
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    // ==========================================
    // PAYMENT RECONCILER (RECONCILE PENDING LEADS WITH RAZORPAY)
    // ==========================================
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch pending service leads from past 24 hours
    const { data: pendingLeads } = await supabase
      .from("service_leads")
      .select("id, name, razorpay_order_id")
      .eq("payment_status", "pending")
      .not("razorpay_order_id", "is", null)
      .gt("created_at", past24h);

    // Fetch pending book leads from past 24 hours
    const { data: pendingBookLeads } = await supabase
      .from("book_leads")
      .select("id, email, razorpay_order_id")
      .eq("payment_status", "pending")
      .not("razorpay_order_id", "is", null)
      .gt("created_at", past24h);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Fetch captured payments from past 24 hours
    const paymentsData = await razorpay.payments.all({
      count: 100,
    });
    const capturedPayments = (paymentsData.items || []).filter(
      (p: any) => p.status === "captured"
    );

    let reconciledCount = 0;

    if (capturedPayments.length > 0) {
      // Reconcile service leads
      if (pendingLeads && pendingLeads.length > 0) {
        for (const lead of pendingLeads) {
          const matchingPayment = capturedPayments.find(
            (p: any) => p.order_id === lead.razorpay_order_id
          );
          if (matchingPayment) {
            const nameWithPayment = `${lead.name} (TXN: ${matchingPayment.id})`;
            await supabase
              .from("service_leads")
              .update({
                name: nameWithPayment,
                payment_status: "completed",
                paid_at: new Date(matchingPayment.created_at * 1000).toISOString(),
              })
              .eq("id", lead.id);
            reconciledCount++;
          }
        }
      }

      // Reconcile book leads
      if (pendingBookLeads && pendingBookLeads.length > 0) {
        for (const lead of pendingBookLeads) {
          const matchingPayment = capturedPayments.find(
            (p: any) => p.order_id === lead.razorpay_order_id
          );
          if (matchingPayment) {
            await supabase
              .from("book_leads")
              .update({
                payment_status: "completed",
                paid_at: new Date(matchingPayment.created_at * 1000).toISOString(),
              })
              .eq("id", lead.id);
            reconciledCount++;
          }
        }
      }
    }

    // ==========================================
    // GOOGLE CALENDAR SYNC (DATABASE-DRIVEN)
    // ==========================================
    // Fetch completed leads with appointments that DO NOT have a calendar event ID
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
      .eq("payment_status", "completed")
      .is("google_calendar_event_id", null);

    if (error) throw error;

    let syncedCount = 0;

    if (leads && leads.length > 0) {
      for (const lead of leads) {
        const serviceName = (lead.services as any)?.title || "Consultation Call";
        const eventSummary = `📞 ${serviceName} — ${lead.name}`;

        let dateTime;
        try {
          dateTime = parseKolkataDateTime(lead.appointment_date, lead.appointment_time);
        } catch (err) {
          continue;
        }

        const startTime = dateTime.toISOString();
        const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString();

        try {
          const calRes = await calendar.events.insert({
            calendarId,
            requestBody: {
              summary: eventSummary,
              description: `Client: ${lead.name}\nPhone: ${lead.phone}\nService: ${serviceName}`,
              start: { dateTime: startTime, timeZone: "Asia/Kolkata" },
              end: { dateTime: endTime, timeZone: "Asia/Kolkata" },
            },
          });

          // Store the calendar event ID in the database to prevent duplicate syncing
          await supabase
            .from("service_leads")
            .update({ google_calendar_event_id: calRes.data.id })
            .eq("id", lead.id);

          syncedCount++;
        } catch (calErr: any) {
          console.error(`Failed to sync lead ${lead.id} to calendar:`, calErr);
          await supabase
            .from("service_leads")
            .update({ name: `${lead.name} (CAL_CRON_ERR: ${calErr.message})` })
            .eq("id", lead.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reconciled ${reconciledCount} payments. Synced ${syncedCount} new events to Google Calendar.`,
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
