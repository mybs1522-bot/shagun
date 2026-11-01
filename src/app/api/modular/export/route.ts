import { NextRequest, NextResponse } from "next/server";
import { getModularLeads } from "@/lib/modular-storage";
import { DEFAULT_PASSWORDS } from "../verify/route";

function isAuthorized(req: NextRequest): boolean {
  const envPassword = process.env.MODULAR_DATA_PASSWORD?.trim();
  const allowed = [envPassword, ...DEFAULT_PASSWORDS].filter(Boolean);

  const cookie = req.cookies.get("modular_data_auth");
  if (cookie?.value === "true") return true;

  try {
    const url = new URL(req.url);
    const param =
      url.searchParams.get("token") ||
      url.searchParams.get("auth") ||
      url.searchParams.get("password");
    if (param && allowed.includes(param.trim())) return true;
  } catch {}

  const authHeader =
    req.headers.get("x-modular-password") || req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (allowed.includes(token)) return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const leads = await getModularLeads();

    // Generate CSV
    const headers = [
      "ID",
      "Name",
      "Phone",
      "Products",
      "City",
      "Property Type",
      "Status",
      "Notes",
      "Created At",
    ];
    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.products || []).join(", ").replace(/"/g, '""')}"`,
      `"${(l.city || "").replace(/"/g, '""')}"`,
      `"${(l.propertyType || "").replace(/"/g, '""')}"`,
      `"${(l.status || "").replace(/"/g, '""')}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${l.createdAt || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="modular_leads_${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to export CSV" },
      { status: 500 }
    );
  }
}
