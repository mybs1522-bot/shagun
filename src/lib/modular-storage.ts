import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export interface ModularLead {
  id: string;
  name: string;
  phone: string;
  products: string[];
  city?: string;
  propertyType?: string;
  status: "New" | "Contacted" | "Quote Sent" | "Follow Up" | "Closed" | "Not Interested";
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

const PRIMARY_DATA_DIR = path.join(process.cwd(), "data");
const PRIMARY_LEADS_FILE = path.join(PRIMARY_DATA_DIR, "modular_leads.json");
const TMP_LEADS_FILE = path.join("/tmp", "modular_leads.json");

function readJsonFile(filePath: string): ModularLead[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonFile(filePath: string, leads: ModularLead[]): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), "utf-8");
    return true;
  } catch (err) {
    return false;
  }
}

function readLocalLeads(): ModularLead[] {
  const primary = readJsonFile(PRIMARY_LEADS_FILE);
  const tmp = readJsonFile(TMP_LEADS_FILE);

  const map = new Map<string, ModularLead>();
  primary.forEach((l) => map.set(l.id, l));
  tmp.forEach((l) => {
    if (!map.has(l.id)) {
      map.set(l.id, l);
    }
  });

  return Array.from(map.values());
}

function writeLocalLeads(leads: ModularLead[]): void {
  // Try primary location
  const okPrimary = writeJsonFile(PRIMARY_LEADS_FILE, leads);
  // Also sync to /tmp (useful in serverless environments)
  writeJsonFile(TMP_LEADS_FILE, leads);
  if (!okPrimary) {
    console.warn("Primary leads file read-only, wrote to /tmp fallback successfully.");
  }
}

/**
 * Fetch all modular leads from local cache AND Supabase database
 */
export async function getModularLeads(): Promise<ModularLead[]> {
  const localLeads = readLocalLeads();
  const leadsMap = new Map<string, ModularLead>();

  // Add local leads first
  localLeads.forEach((l) => leadsMap.set(l.id, l));

  // 1. Try fetching from dedicated Supabase table `modular_leads`
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("modular_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => {
        const lead: ModularLead = {
          id: row.id,
          name: row.name || "",
          phone: row.phone || "",
          products: Array.isArray(row.products)
            ? row.products
            : row.products
            ? [row.products]
            : ["Kitchens", "Wardrobes", "Bathroom Vanity", "TV Units"],
          city: row.city || "",
          propertyType: row.property_type || "",
          status: row.status || "New",
          notes: row.notes || "",
          source: row.source || "modular_page",
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || undefined,
        };
        leadsMap.set(lead.id, lead);
      });
    }
  } catch (err) {
    // Expected if modular_leads table not created yet
  }

  // 2. Fetch from existing Supabase table `service_leads` (used across production)
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: servLeads, error: servErr } = await supabaseAdmin
      .from("service_leads")
      .select("*")
      .or("payment_status.eq.modular_inquiry,google_calendar_event_id.eq.modular_quotation")
      .order("created_at", { ascending: false });

    if (!servErr && Array.isArray(servLeads) && servLeads.length > 0) {
      for (const row of servLeads) {
        let meta: any = {};
        if (row.notes_json) {
          try {
            meta =
              typeof row.notes_json === "string"
                ? JSON.parse(row.notes_json)
                : row.notes_json;
          } catch {
            meta = {};
          }
        }

        let parsedProducts = [
          "Kitchens",
          "Wardrobes",
          "Bathroom Vanity",
          "TV Units",
        ];
        let city = "";
        let propertyType = "";
        let notes = "";
        let status: ModularLead["status"] = (row.lead_status as any) || "New";

        if (meta && typeof meta === "object" && !Array.isArray(meta)) {
          if (Array.isArray(meta.products) && meta.products.length > 0) {
            parsedProducts = meta.products;
          }
          if (meta.city) city = meta.city;
          if (meta.propertyType) propertyType = meta.propertyType;
          if (meta.notes) notes = meta.notes;
          if (meta.status) status = meta.status;
        }

        const lead: ModularLead = {
          id: row.id,
          name: row.name || "",
          phone: row.phone || "",
          products: parsedProducts,
          city: city || undefined,
          propertyType: propertyType || undefined,
          status: status,
          notes: notes,
          source: "modular_page",
          createdAt: row.created_at || new Date().toISOString(),
        };

        leadsMap.set(lead.id, lead);
      }
    }
  } catch (err) {
    console.warn("Notice: could not query service_leads for modular inquiries:", err);
  }

  const merged = Array.from(leadsMap.values());
  merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Deduplicate any repeated entries with same phone & name within 10 minutes
  const deduplicated: ModularLead[] = [];
  const seenKeys = new Set<string>();

  for (const l of merged) {
    const cleanPhone = (l.phone || "").replace(/\D/g, "");
    const cleanName = (l.name || "").trim().toLowerCase();
    const leadTime = new Date(l.createdAt).getTime();
    const timeBucket = isNaN(leadTime)
      ? 0
      : Math.floor(leadTime / (10 * 60 * 1000));
    const dedupKey = `${cleanPhone}_${cleanName}_${timeBucket}`;

    if (!seenKeys.has(l.id) && (!cleanPhone || !seenKeys.has(dedupKey))) {
      seenKeys.add(l.id);
      if (cleanPhone) seenKeys.add(dedupKey);
      deduplicated.push(l);
    }
  }

  // Sync back into local file cache
  if (deduplicated.length > 0) {
    writeLocalLeads(deduplicated);
  }

  return deduplicated;
}

/**
 * Save a new modular quotation lead
 */
export async function saveModularLead(data: {
  name: string;
  phone: string;
  products?: string[];
  city?: string;
  propertyType?: string;
  notes?: string;
}): Promise<ModularLead> {
  const cleanPhone = data.phone.trim().replace(/\D/g, "");
  const cleanName = data.name.trim().toLowerCase();

  // Deduplication check: if an identical lead was submitted within the last 3 minutes, return it
  if (cleanPhone) {
    const existing = await getModularLeads();
    const duplicate = existing.find((l) => {
      const p = (l.phone || "").replace(/\D/g, "");
      const n = (l.name || "").trim().toLowerCase();
      if (p === cleanPhone && (n === cleanName || !n || !cleanName)) {
        const diff = Math.abs(Date.now() - new Date(l.createdAt).getTime());
        return diff < 180000;
      }
      return false;
    });

    if (duplicate) {
      console.log("ℹ️ Prevented duplicate modular lead submission for:", cleanPhone);
      return duplicate;
    }
  }

  const leadId = randomUUID();
  const newLead: ModularLead = {
    id: leadId,
    name: data.name.trim(),
    phone: data.phone.trim(),
    products:
      data.products && data.products.length > 0
        ? data.products
        : ["Kitchens", "Wardrobes", "Bathroom Vanity", "TV Units"],
    city: data.city?.trim() || undefined,
    propertyType: data.propertyType?.trim() || undefined,
    status: "New",
    notes: data.notes?.trim() || "",
    source: "modular_page",
    createdAt: new Date().toISOString(),
  };

  // 1. Save to local JSON files
  const currentLeads = readLocalLeads();
  currentLeads.unshift(newLead);
  writeLocalLeads(currentLeads);

  // 2. Persist to Supabase dedicated table `modular_leads` (if created)
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("modular_leads").insert([
      {
        id: newLead.id,
        name: newLead.name,
        phone: newLead.phone,
        products: newLead.products,
        city: newLead.city || null,
        property_type: newLead.propertyType || null,
        status: newLead.status,
        notes: newLead.notes || null,
        source: newLead.source,
        created_at: newLead.createdAt,
      },
    ]);
  } catch {
    // Fallback table handles this
  }

  // 3. Persist to existing production table `service_leads` so Vercel never loses it!
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error: insertErr } = await supabaseAdmin.from("service_leads").insert({
      id: newLead.id,
      name: newLead.name,
      phone: newLead.phone,
      service_id: null,
      appointment_date: null,
      appointment_time: null,
      payment_status: "modular_inquiry",
      lead_status: "New",
      google_calendar_event_id: "modular_quotation",
      notes_json: JSON.stringify({
        isModular: true,
        products: newLead.products,
        city: newLead.city || "",
        propertyType: newLead.propertyType || "",
        notes: newLead.notes || "",
        status: newLead.status,
      }),
      created_at: newLead.createdAt,
    });

    if (insertErr) {
      console.error("Error inserting modular inquiry into service_leads:", insertErr);
    } else {
      console.log("✓ Modular lead persisted to Supabase service_leads successfully:", newLead.id);
    }
  } catch (err) {
    console.error("Supabase service_leads insert exception:", err);
  }

  // 4. Send Email Notification
  try {
    const recipientEmail = process.env.NOTIFY_EMAIL || "mybs1522@gmail.com";
    const productList = newLead.products.join(", ");
    await sendEmail({
      to: recipientEmail,
      subject: `🏭 New Factory Modular Lead: ${newLead.name} (${newLead.phone})`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">🏭 New Modular Factory Quotation Lead!</h1>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Ar. Shagun Yadav Modular Studio</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 35%;">👤 Name</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${newLead.name}</td>
              </tr>
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📞 Phone</td>
                <td style="padding: 8px 0; font-weight: 600; color: #2563eb;">
                  <a href="tel:${newLead.phone}" style="color: #2563eb; text-decoration: none;">${newLead.phone}</a>
                </td>
              </tr>
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📦 Products</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${productList}</td>
              </tr>
              ${
                newLead.city
                  ? `
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📍 Location</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${newLead.city}</td>
              </tr>`
                  : ""
              }
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">⏰ Received</td>
                <td style="padding: 8px 0; font-weight: 500; color: #6b7280;">${new Date().toLocaleString(
                  "en-IN",
                  { timeZone: "Asia/Kolkata" }
                )} IST</td>
              </tr>
            </table>
          </div>
          <div style="background: #f9fafb; padding: 12px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb;">
            Manage all leads anytime at: <a href="/data" style="color: #2563eb;">/data</a>
          </div>
        </div>
      `,
    }).catch((emailErr) => {
      console.warn("Email alert failed (non-blocking):", emailErr);
    });
  } catch (err) {
    console.warn("Could not dispatch email notification:", err);
  }

  return newLead;
}

/**
 * Update an existing modular lead
 */
export async function updateModularLead(
  id: string,
  updates: Partial<ModularLead>
): Promise<ModularLead | null> {
  const currentLeads = readLocalLeads();
  const idx = currentLeads.findIndex((l) => l.id === id);

  const updatedLead: ModularLead = {
    ...(idx !== -1
      ? currentLeads[idx]
      : {
          id,
          name: "",
          phone: "",
          products: [],
          status: "New",
          createdAt: new Date().toISOString(),
        }),
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (idx !== -1) {
    currentLeads[idx] = updatedLead;
  } else {
    currentLeads.unshift(updatedLead);
  }
  writeLocalLeads(currentLeads);

  // Sync to Supabase table `modular_leads`
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("modular_leads")
      .update({
        status: updatedLead.status,
        notes: updatedLead.notes,
        updated_at: updatedLead.updatedAt,
      })
      .eq("id", id);
  } catch {}

  // Sync to Supabase table `service_leads`
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing } = await supabaseAdmin
      .from("service_leads")
      .select("notes_json, lead_status")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      let meta: any = {};
      if (existing.notes_json) {
        try {
          meta =
            typeof existing.notes_json === "string"
              ? JSON.parse(existing.notes_json)
              : existing.notes_json;
        } catch {}
      }
      if (updates.status) meta.status = updates.status;
      if (updates.notes !== undefined) meta.notes = updates.notes;

      await supabaseAdmin
        .from("service_leads")
        .update({
          ...(updates.status ? { lead_status: updates.status } : {}),
          notes_json: JSON.stringify(meta),
        })
        .eq("id", id);
    }
  } catch {}

  return updatedLead;
}

/**
 * Delete a modular lead
 */
export async function deleteModularLead(id: string): Promise<boolean> {
  const currentLeads = readLocalLeads();
  const targetLead = currentLeads.find((l) => l.id === id);
  const targetPhone = targetLead ? (targetLead.phone || "").trim() : "";

  const filtered = currentLeads.filter((l) => l.id !== id);
  writeLocalLeads(filtered);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("modular_leads").delete().eq("id", id);
    if (targetPhone) {
      await supabaseAdmin.from("modular_leads").delete().eq("phone", targetPhone);
    }
  } catch {}

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("service_leads").delete().eq("id", id);
    if (targetPhone) {
      await supabaseAdmin
        .from("service_leads")
        .delete()
        .eq("phone", targetPhone)
        .eq("payment_status", "modular_inquiry");
    }
  } catch {}

  return true;
}
