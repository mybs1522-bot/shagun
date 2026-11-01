import fs from "fs";
import path from "path";
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

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "modular_leads.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalLeads(): ModularLead[] {
  ensureDirectoryExists();
  if (!fs.existsSync(LEADS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(LEADS_FILE, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading modular_leads.json:", err);
    return [];
  }
}

function writeLocalLeads(leads: ModularLead[]): void {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing modular_leads.json:", err);
  }
}

/**
 * Fetch all modular leads from local file and Supabase (if available)
 */
export async function getModularLeads(): Promise<ModularLead[]> {
  const localLeads = readLocalLeads();

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("modular_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Merge by ID
      const map = new Map<string, ModularLead>();
      localLeads.forEach((l) => map.set(l.id, l));
      data.forEach((row: any) => {
        const lead: ModularLead = {
          id: row.id,
          name: row.name || "",
          phone: row.phone || "",
          products: Array.isArray(row.products) ? row.products : (row.products ? [row.products] : []),
          city: row.city || "",
          propertyType: row.property_type || "",
          status: row.status || "New",
          notes: row.notes || "",
          source: row.source || "modular_page",
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || undefined,
        };
        map.set(lead.id, lead);
      });
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      writeLocalLeads(merged);
      return merged;
    }
  } catch {
    // Supabase table may not exist yet, local fallback works 100%
  }

  localLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return localLeads;
}

/**
 * Save a new modular lead
 */
export async function saveModularLead(data: {
  name: string;
  phone: string;
  products?: string[];
  city?: string;
  propertyType?: string;
  notes?: string;
}): Promise<ModularLead> {
  const newLead: ModularLead = {
    id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    phone: data.phone.trim(),
    products: data.products && data.products.length > 0
      ? data.products
      : ["Kitchens", "Wardrobes", "Bathroom Vanity", "TV Units"],
    city: data.city?.trim() || undefined,
    propertyType: data.propertyType?.trim() || undefined,
    status: "New",
    notes: data.notes?.trim() || "",
    source: "modular_page",
    createdAt: new Date().toISOString(),
  };

  // 1. Save to local JSON file
  const currentLeads = readLocalLeads();
  currentLeads.unshift(newLead);
  writeLocalLeads(currentLeads);

  // 2. Attempt sync to Supabase table `modular_leads`
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
  } catch (supaErr) {
    console.warn("Notice: modular_leads table not in Supabase yet; saved to local JSON storage successfully.", supaErr);
  }

  // 3. Notify Admin via Email if configured
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
                  &nbsp;•&nbsp;
                  <a href="https://wa.me/91${newLead.phone.replace(/\\D/g, '')}" target="_blank" style="color: #10b981; font-weight: bold;">WhatsApp ↗</a>
                </td>
              </tr>
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📦 Products</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${productList}</td>
              </tr>
              ${newLead.city ? `
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">📍 Location</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827;">${newLead.city}</td>
              </tr>` : ""}
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">⏰ Received</td>
                <td style="padding: 8px 0; font-weight: 500; color: #6b7280;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
              </tr>
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://wa.me/91${newLead.phone.replace(/\\D/g, '')}?text=${encodeURIComponent(`Hi ${newLead.name}, this is from Ar. Shagun Yadav's modular studio regarding your quotation request for factory-made ${productList}.`)}" 
                style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                Chat on WhatsApp Now
              </a>
            </div>
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
  if (idx === -1) return null;

  const updated: ModularLead = {
    ...currentLeads[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  currentLeads[idx] = updated;
  writeLocalLeads(currentLeads);

  // Sync to Supabase if available
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("modular_leads")
      .update({
        status: updated.status,
        notes: updated.notes,
        updated_at: updated.updatedAt,
      })
      .eq("id", id);
  } catch {
    // Non-blocking
  }

  return updated;
}

/**
 * Delete a modular lead
 */
export async function deleteModularLead(id: string): Promise<boolean> {
  const currentLeads = readLocalLeads();
  const filtered = currentLeads.filter((l) => l.id !== id);
  if (filtered.length === currentLeads.length) return false;

  writeLocalLeads(filtered);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("modular_leads").delete().eq("id", id);
  } catch {
    // Non-blocking
  }

  return true;
}
