import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

function getCalendarClient() {
  const rawKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY || "";
  // Handle both literal \n (from .env files) and already-parsed newlines
  const privateKey = rawKey.includes("\\n")
    ? rawKey.split("\\n").join("\n")
    : rawKey;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
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
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Parse the date and time into a proper DateTime
    // date comes as "Jul 8, 2026" and time as "11:00 AM"
    const dateTime = new Date(`${date} ${time}`);
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date/time format" },
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
