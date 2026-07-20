const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');

// Parse .env.local manually
const envContent = fs.readFileSync('./.env.local', 'utf-8');
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  }
});

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

function parseKolkataDateTime(dateStr, timeStr) {
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

async function debug() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const leadId = "b55b9d44-4f63-46e4-b1a1-6b3caeb434d8";
    const razorpay_payment_id = "pay_TFszXJ8jWZaCOj";
    
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
      console.error("Lead not found:", fetchError);
      return;
    }

    const nameWithPayment = `${lead.name} (TXN: ${razorpay_payment_id})`;
    const serviceName = lead.services?.title || "Consultation Call";

    console.log("Lead date:", lead.appointment_date);
    console.log("Lead time:", lead.appointment_time);

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

        console.log("Sending insert event request to Google...");
        const calRes = await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: `📞 ${serviceName} — ${nameWithPayment}`,
            description: `Client: ${lead.name}\nPhone: ${lead.phone}\nService: ${serviceName}`,
            start: { dateTime: startTime, timeZone: "Asia/Kolkata" },
            end: { dateTime: endTime, timeZone: "Asia/Kolkata" },
          },
        });
        console.log("Calendar insertion succeeded! Event ID:", calRes.data.id);
      } catch (calErr) {
        console.error("Failed to add to calendar immediately:", calErr);
      }
    }
  } catch (err) {
    console.error("Debug failed:", err);
  }
}

debug();
