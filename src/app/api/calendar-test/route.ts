import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
// Force a fresh Vercel build to pick up new environment variables

export async function GET(req: NextRequest) {
  // Check every possible env var name for the Google Calendar key
  const checks: Record<string, boolean> = {};
  const possibleKeys = [
    "GOOGLE_CALENDAR_PRIVATE_KEY",
    "GOOGLE_CALENDAR_CLIENT_EMAIL", 
    "GOOGLE_CALENDAR_ID",
    "NEXT_PUBLIC_GOOGLE_CALENDAR_PRIVATE_KEY",
    "NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_EMAIL",
    "NEXT_PUBLIC_GOOGLE_CALENDAR_ID",
    "VITE_GOOGLE_CALENDAR_PRIVATE_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "VITE_SUPABASE_SERVICE_ROLE_KEY",
    "GMAIL_USER",
  ];

  for (const key of possibleKeys) {
    const val = process.env[key];
    checks[key] = !!val;
    if (val && key.includes("PRIVATE_KEY")) {
      checks[key + "_length"] = val.length as any;
      checks[key + "_starts"] = val.substring(0, 20) as any;
    }
  }

  // Also list ALL env var keys (names only, no values) that contain GOOGLE or CALENDAR
  const allEnvKeys = Object.keys(process.env).filter(
    (k) => k.includes("GOOGLE") || k.includes("CALENDAR") || k.includes("SUPABASE") || k.includes("RAZORPAY")
  );

  return NextResponse.json({
    buildSignature: "test-rebuild-v1",
    checks,
    allMatchingEnvKeys: allEnvKeys,
    totalEnvCount: Object.keys(process.env).length,
  });
}
