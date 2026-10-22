import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      phone,
      serviceName,
      paymentStatus,
      date,
      time,
      floorPlanUrl,
      floorPlanName,
    } = await req.json();

    const appointmentLine =
      date && time ? `📅 Appointment: ${date} at ${time}` : "";

    const statusEmoji =
      paymentStatus === "completed"
        ? "✅ Completed"
        : paymentStatus === "pending"
          ? "⏳ Pending"
          : "—";

    const floorPlanRow = floorPlanUrl
      ? `<tr style="border-top: 1px solid #f3f4f6;">
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">📐 Floor Plan</td>
          <td style="padding: 10px 0; font-weight: 600; font-size: 14px;">
            <a href="${floorPlanUrl}" target="_blank" style="color: #10b981; text-decoration: underline; font-weight: bold;">
              View Floor Plan (${floorPlanName || "Attached Drawing"}) ↗
            </a>
          </td>
        </tr>`
      : "";

    // 1. Send Admin Notification Email
    const adminEmail = process.env.NOTIFY_EMAIL || "mybs1522@gmail.com";
    const adminHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">🎉 New Lead Received!</h1>
          <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Ar Shagun Portfolio</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 35%;">👤 Name</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${name}</td>
            </tr>
            ${
              email
                ? `<tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; color: #6b7280;">✉️ Email</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;"><a href="mailto:${email}" style="color: #10b981; text-decoration: none;">${email}</a></td>
            </tr>`
                : ""
            }
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; color: #6b7280;">📞 Phone</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;"><a href="tel:${phone}" style="color: #111827; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; color: #6b7280;">🛎️ Service</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${serviceName}</td>
            </tr>
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; color: #6b7280;">💳 Payment</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${statusEmoji}</td>
            </tr>
            ${
              appointmentLine
                ? `<tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; color: #6b7280;">📅 Appointment</td>
              <td style="padding: 8px 0; font-weight: 600; color: #059669;">${date} at ${time}</td>
            </tr>`
                : ""
            }
            ${floorPlanRow}
          </table>
        </div>
        <div style="background: #f9fafb; padding: 14px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb;">
          Ar Shagun Architecture &amp; Design Studio • Lead Notification
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `🔔 New Booking: ${name} — ${serviceName}`,
      html: adminHtml,
      replyTo: email || undefined,
    });

    // 2. Send Customer Confirmation Email (if client provided email)
    if (email && email.includes("@")) {
      const clientHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🎉 Booking Confirmed!</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Ar Shagun Architecture &amp; Design Studio</p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; color: #1f2937; margin-top: 0;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              Thank you for choosing <strong>Ar Shagun</strong>. Your design session has been successfully booked and scheduled!
            </p>

            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 38%;">🛎️ Service:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${serviceName}</td>
                </tr>
                ${
                  date && time
                    ? `<tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; color: #6b7280;">📅 Date &amp; Time:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #059669;">${date} at ${time}</td>
                </tr>`
                    : ""
                }
                <tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; color: #6b7280;">📞 Contact:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #111827;">${phone}</td>
                </tr>
                ${
                  floorPlanName
                    ? `<tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; color: #6b7280;">📐 Floor Plan:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #059669;">Attached (${floorPlanName}) ✓</td>
                </tr>`
                    : ""
                }
                <tr style="border-top: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; color: #6b7280;">💳 Status:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #10b981;">${statusEmoji}</td>
                </tr>
              </table>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <h4 style="margin: 0 0 6px; font-size: 13px; color: #166534; font-weight: 700;">💡 What happens next?</h4>
              <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5;">
                Ar Shagun and the design team will review your requirements ${
                  floorPlanName ? "and uploaded floor plan " : ""
                }ahead of the session. We will connect with you at your scheduled time.
              </p>
            </div>

            <p style="font-size: 13px; color: #4b5563; line-height: 1.6; margin-bottom: 0;">
              We will connect at your scheduled time. In case of any issue, please mail us at <a href="mailto:hello@archbysha.com" style="color: #10b981; font-weight: 600; text-decoration: none;">hello@archbysha.com</a>.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 18px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
            Ar Shagun Architecture &amp; Design Studio • Support: <a href="mailto:hello@archbysha.com" style="color: #6b7280; text-decoration: underline;">hello@archbysha.com</a>
          </div>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: `🎉 Booking Confirmed: ${serviceName} — Ar Shagun Studio`,
        html: clientHtml,
        replyTo: "hello@archbysha.com",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
