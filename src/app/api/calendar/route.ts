import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

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
    const { name, phone, serviceName, date, time } = await req.json();

    if (!date || !time) {
      return NextResponse.json(
        { error: "Date and time are required" },
        { status: 400 }
      );
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
        ``,
        `Booked via Shagun Yadav Website`,
      ].join("\n"),
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
