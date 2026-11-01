import { NextRequest, NextResponse } from "next/server";

export const DEFAULT_PASSWORDS = [
  "shagun@modular",
  "modular2026",
  "shagun123",
];

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    const trimmed = password.trim();
    const envPassword = process.env.MODULAR_DATA_PASSWORD?.trim();
    const allowed = [envPassword, ...DEFAULT_PASSWORDS].filter(Boolean);

    if (allowed.includes(trimmed)) {
      const response = NextResponse.json({
        success: true,
        message: "Authenticated successfully",
        token: trimmed,
      });

      // Set cookie for session (30 days)
      response.cookies.set("modular_data_auth", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        httpOnly: false,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid access password" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Authentication error" },
      { status: 500 }
    );
  }
}
