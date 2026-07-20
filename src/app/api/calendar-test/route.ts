import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  try {
    let rawKey = (process.env.GOOGLE_CALENDAR_PRIVATE_KEY || "").trim();
    const hasKey = !!rawKey;
    const keyLength = rawKey.length;
    const startsWithBegin = rawKey.startsWith("-----BEGIN PRIVATE KEY-----");
    const endsWithEnd = rawKey.endsWith("-----END PRIVATE KEY-----") || rawKey.endsWith("-----END PRIVATE KEY-----\n") || rawKey.endsWith("-----END PRIVATE KEY-----\"");

    let clientEmail = (process.env.GOOGLE_CALENDAR_CLIENT_EMAIL || "").trim();
    const hasEmail = !!clientEmail;

    let calendarId = (process.env.GOOGLE_CALENDAR_ID || "").trim();
    const hasCalendarId = !!calendarId;

    // Test authentication
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    }
    const privateKey = rawKey.includes("\\n")
      ? rawKey.split("\\n").join("\n")
      : rawKey;

    let parsedEmail = clientEmail;
    if (parsedEmail.startsWith('"') && parsedEmail.endsWith('"')) {
      parsedEmail = parsedEmail.substring(1, parsedEmail.length - 1);
    }

    const auth = new google.auth.JWT({
      email: parsedEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    
    let calendarIdClean = calendarId;
    if (calendarIdClean.startsWith('"') && calendarIdClean.endsWith('"')) {
      calendarIdClean = calendarIdClean.substring(1, calendarIdClean.length - 1);
    }

    const listRes = await calendar.events.list({
      calendarId: calendarIdClean,
      maxResults: 1,
    });

    return NextResponse.json({
      success: true,
      hasKey,
      keyLength,
      startsWithBegin,
      endsWithEnd,
      hasEmail,
      hasCalendarId,
      eventsCount: listRes.data.items?.length || 0,
      debug: {
        rawKeySlice: rawKey.substring(0, 30) + "..." + rawKey.substring(rawKey.length - 30),
        privateKeySlice: privateKey.substring(0, 30) + "..." + privateKey.substring(privateKey.length - 30),
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      debug: {
        rawKeyExists: !!process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
        rawKeyLength: (process.env.GOOGLE_CALENDAR_PRIVATE_KEY || "").length,
        rawKeySlice: (process.env.GOOGLE_CALENDAR_PRIVATE_KEY || "").substring(0, 30),
      }
    });
  }
}
