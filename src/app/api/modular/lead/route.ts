import { NextRequest, NextResponse } from "next/server";
import { saveModularLead } from "@/lib/modular-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, products, city, propertyType, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide your full name" },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide your phone number" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    const lead = await saveModularLead({
      name: name.trim(),
      phone: phone.trim(),
      products: Array.isArray(products) && products.length > 0 ? products : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
      propertyType: typeof propertyType === "string" ? propertyType.trim() : undefined,
      notes: typeof notes === "string" ? notes.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Quotation request received successfully!",
      lead,
    });
  } catch (err: any) {
    console.error("Error in /api/modular/lead:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
