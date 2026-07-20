import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { google } from "googleapis";

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

export async function POST(req: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, leadId, type } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !leadId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Initialize Supabase with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    if (type === "service") {
      // 2. Fetch the pending lead
      const { data: lead, error: fetchError } = await supabase
        .from("service_leads")
        .select(`
          id,
          name,
          phone,
          appointment_date,
          appointment_time,
          service_id,
          services (
            title
          )
        `)
        .eq("id", leadId)
        .single();

      if (fetchError || !lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const nameWithPayment = `${lead.name} (TXN: ${razorpay_payment_id})`;
      const serviceName = (lead.services as any)?.title || "Consultation Call";

      // 3. Update database
      const { error: updateError } = await supabase
        .from("service_leads")
        .update({
          name: nameWithPayment,
          payment_status: "completed",
          paid_at: new Date().toISOString(),
          razorpay_order_id
        })
        .eq("id", leadId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update lead status" }, { status: 500 });
      }

      // 4. Send email notification
      fetch(`${req.nextUrl.origin}/api/notify-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameWithPayment,
          phone: lead.phone,
          serviceName: serviceName,
          paymentStatus: "completed",
          date: lead.appointment_date ? new Date(lead.appointment_date).toLocaleDateString() : null,
          time: lead.appointment_time,
        }),
      }).catch(console.error);

      // 5. Add to Google Calendar immediately
      if (lead.appointment_date && lead.appointment_time) {
        try {
          const calendar = getCalendarClient();
          let calendarId = (process.env.GOOGLE_CALENDAR_ID || "").trim();
          if (calendarId.startsWith('"') && calendarId.endsWith('"')) {
            calendarId = calendarId.substring(1, calendarId.length - 1);
          }

          const dateTime = parseKolkataDateTime(lead.appointment_date, lead.appointment_time);
          const startTime = dateTime.toISOString();
          const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString();

          await calendar.events.insert({
            calendarId,
            requestBody: {
              summary: `📞 ${serviceName} — ${nameWithPayment}`,
              description: `Client: ${lead.name}\nPhone: ${lead.phone}\nService: ${serviceName}`,
              start: { dateTime: startTime, timeZone: "Asia/Kolkata" },
              end: { dateTime: endTime, timeZone: "Asia/Kolkata" },
            },
          });
        } catch (calErr) {
          console.error("Failed to add to calendar immediately:", calErr);
        }
      }

    } else if (type === "book") {
      // Reconcile book lead
      const { error: updateError } = await supabase
        .from("book_leads")
        .update({
          payment_status: "completed",
          paid_at: new Date().toISOString(),
          razorpay_order_id
        })
        .eq("id", leadId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update book lead status" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
