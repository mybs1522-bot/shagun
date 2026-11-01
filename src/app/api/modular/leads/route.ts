import { NextRequest, NextResponse } from "next/server";
import {
  getModularLeads,
  updateModularLead,
  deleteModularLead,
} from "@/lib/modular-storage";
import { DEFAULT_PASSWORDS } from "../verify/route";

function isAuthorized(req: NextRequest): boolean {
  // Check cookie
  const cookie = req.cookies.get("modular_data_auth");
  if (cookie?.value === "true") return true;

  // Check header
  const authHeader = req.headers.get("x-modular-password") || req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    const envPassword = process.env.MODULAR_DATA_PASSWORD?.trim();
    const allowed = [envPassword, ...DEFAULT_PASSWORDS].filter(Boolean);
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
    return NextResponse.json({ success: true, leads });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required" },
        { status: 400 }
      );
    }

    const updated = await updateModularLead(id, {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteModularLead(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
