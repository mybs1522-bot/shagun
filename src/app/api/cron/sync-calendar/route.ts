import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { getCalendarClient, parseKolkataDateTime } from "@/lib/google-calendar";
import { isAdminBlockedLead } from "@/lib/blocked-slots";

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
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
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

    let reconciledCount = 0;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Fetch captured payments from past 24 hours
        const paymentsData = await razorpay.payments.all({
          count: 100,
        });
        const capturedPayments = (paymentsData.items || []).filter(
          (p: any) => p.status === "captured"
        );

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
      } catch (rpErr) {
        console.error("Razorpay reconciliation error:", rpErr);
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
        // Do NOT sync admin-blocked calls/slots to Google Calendar!
        if (isAdminBlockedLead(lead)) {
          await supabase
            .from("service_leads")
            .update({ google_calendar_event_id: "admin_blocked" })
            .eq("id", lead.id);
          continue;
        }

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

    // ==========================================
    // CLEAN UP ANY PREVIOUSLY-SYNCED ADMIN BLOCKED CALLS FROM GOOGLE CALENDAR
    // ==========================================
    let cleanedBlockedCount = 0;
    try {
      const { data: oldBlockedLeads } = await supabase
        .from("service_leads")
        .select("id, name, phone, google_calendar_event_id")
        .not("google_calendar_event_id", "is", null)
        .neq("google_calendar_event_id", "admin_blocked");

      if (oldBlockedLeads && oldBlockedLeads.length > 0) {
        for (const bl of oldBlockedLeads) {
          if (isAdminBlockedLead(bl) && bl.google_calendar_event_id) {
            try {
              await calendar.events.delete({
                calendarId,
                eventId: bl.google_calendar_event_id,
              });
              cleanedBlockedCount++;
            } catch (delErr: any) {
              if (delErr?.code !== 404 && delErr?.code !== 410) {
                console.error(`Failed to delete event ${bl.google_calendar_event_id} from Google Calendar:`, delErr);
              }
            }
            await supabase
              .from("service_leads")
              .update({ google_calendar_event_id: "admin_blocked" })
              .eq("id", bl.id);
          }
        }
      }

      // Also search Google Calendar directly for any leftover "Admin Blocked Slot" events and remove them
      try {
        const calList = await calendar.events.list({
          calendarId,
          q: "Admin Blocked Slot",
          maxResults: 100,
        });
        const items = calList.data.items || [];
        for (const ev of items) {
          if (ev.id && (ev.summary?.includes("Admin Blocked") || ev.description?.includes("Admin Blocked Slot"))) {
            try {
              await calendar.events.delete({
                calendarId,
                eventId: ev.id,
              });
              cleanedBlockedCount++;
            } catch (err: any) {
              if (err?.code !== 404 && err?.code !== 410) {
                console.error(`Failed to delete leftover event ${ev.id}:`, err);
              }
            }
          }
        }
      } catch (listErr) {
        console.error("Failed to query calendar for Admin Blocked Slot events:", listErr);
      }
    } catch (cleanupErr) {
      console.error("Error during admin blocked cleanup:", cleanupErr);
    }

    // ==========================================
    // CLEAN UP UNPAID / PENDING LEADS FROM GOOGLE CALENDAR
    // ==========================================
    let cleanedPendingCount = 0;
    try {
      const { data: pendingLeadsWithCal } = await supabase
        .from("service_leads")
        .select(`
          id,
          name,
          payment_status,
          google_calendar_event_id,
          services (
            amount
          )
        `)
        .eq("payment_status", "pending")
        .not("google_calendar_event_id", "is", null)
        .neq("google_calendar_event_id", "admin_blocked");

      if (pendingLeadsWithCal && pendingLeadsWithCal.length > 0) {
        for (const pl of pendingLeadsWithCal) {
          const amount = (pl.services as any)?.amount ?? 0;
          // Only clean up if it's a paid service that wasn't paid
          if (amount > 0 && pl.google_calendar_event_id) {
            try {
              await calendar.events.delete({
                calendarId,
                eventId: pl.google_calendar_event_id,
              });
              cleanedPendingCount++;
            } catch (delErr: any) {
              if (delErr?.code !== 404 && delErr?.code !== 410) {
                console.error(`Failed to delete pending event ${pl.google_calendar_event_id}:`, delErr);
              }
            }
            await supabase
              .from("service_leads")
              .update({ google_calendar_event_id: null })
              .eq("id", pl.id);
          }
        }
      }
    } catch (pendingCleanErr) {
      console.error("Error cleaning up pending leads from Google Calendar:", pendingCleanErr);
    }

    return NextResponse.json({
      success: true,
      message: `Reconciled ${reconciledCount} payments. Synced ${syncedCount} new events to Google Calendar. Cleaned ${cleanedBlockedCount} admin-blocked events and ${cleanedPendingCount} unpaid/pending events from Google Calendar.`,
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
