import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { getCalendarClient } from "@/lib/google-calendar";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { leadId, email } = await req.json();

    if (!leadId || !email || !email.trim()) {
      return NextResponse.json(
        { error: "leadId and valid email are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim();
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        ""
    );

    // Fetch the lead details
    const { data: lead, error: fetchErr } = await supabase
      .from("service_leads")
      .select(`
        id,
        name,
        phone,
        appointment_date,
        appointment_time,
        notes_json,
        google_calendar_event_id,
        payment_status,
        services (
          title
        )
      `)
      .eq("id", leadId)
      .maybeSingle();

    if (fetchErr || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Parse existing notes or initialize array
    let notes: any[] = [];
    if (lead.notes_json) {
      try {
        notes = typeof lead.notes_json === "string" ? JSON.parse(lead.notes_json) : lead.notes_json;
        if (!Array.isArray(notes)) notes = [];
      } catch {
        notes = [];
      }
    }

    // Append email note
    const emailNote = {
      id: `note_${Date.now()}_email`,
      text: `✉️ Client Email: ${cleanEmail}`,
      createdAt: new Date().toISOString(),
      formattedTime: dayjs().format("ddd, MMM D, YYYY [at] h:mm A"),
      author: "Client Input (Post-Payment)",
    };

    const updatedNotes = [...notes, emailNote];

    // Update Supabase
    await supabase
      .from("service_leads")
      .update({ notes_json: JSON.stringify(updatedNotes) })
      .eq("id", leadId);

    const serviceTitle = (lead.services as any)?.title || "Consultation Call";
    const apptDate = lead.appointment_date
      ? dayjs(lead.appointment_date).format("MMM D, YYYY")
      : null;

    // Send confirmation email to client
    const clientHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🎉 Booking Confirmed!</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Ar Shagun Architecture &amp; Design Studio</p>
        </div>
        <div style="padding: 28px 24px;">
          <p style="font-size: 15px; color: #1f2937; margin-top: 0;">Hi <strong>${lead.name}</strong>,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Thank you for booking with <strong>Ar Shagun</strong>. Your consultation has been scheduled successfully!
          </p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700;">Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 38%;">🛎️ Service:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${serviceTitle}</td>
              </tr>
              ${
                apptDate && lead.appointment_time
                  ? `<tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📅 Date &amp; Time:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #059669;">${apptDate} at ${lead.appointment_time}</td>
              </tr>`
                  : ""
              }
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📞 Contact:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${lead.phone}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 0;">
            Our team will reach out directly at the scheduled appointment time. If you have any questions, feel free to reply to this email.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 14px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb;">
          Ar Shagun Architecture &amp; Design Studio • hello@archbysha.com
        </div>
      </div>
    `;

    await sendEmail({
      to: cleanEmail,
      subject: `🎉 Booking Confirmed: ${serviceTitle} — Ar Shagun`,
      html: clientHtml,
    }).catch((emailErr) => {
      console.error("Failed to send client confirmation email:", emailErr);
    });

    // Update Google Calendar event if present to add attendee/email
    if (lead.google_calendar_event_id && lead.google_calendar_event_id !== "admin_blocked") {
      try {
        const calendar = getCalendarClient();
        const calendarId = (process.env.GOOGLE_CALENDAR_ID || "").trim().replace(/^"|"$/g, "");
        if (calendarId) {
          await calendar.events.patch({
            calendarId,
            eventId: lead.google_calendar_event_id,
            requestBody: {
              description: `Client: ${lead.name}\nEmail: ${cleanEmail}\nPhone: ${lead.phone}\nService: ${serviceTitle}`,
              attendees: [{ email: cleanEmail }],
            },
          });
        }
      } catch (calPatchErr) {
        console.error("Failed to patch Google Calendar event with email:", calPatchErr);
      }
    }

    return NextResponse.json({ success: true, email: cleanEmail });
  } catch (error: any) {
    console.error("Error in save-email route:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
