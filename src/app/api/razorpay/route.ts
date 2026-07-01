import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR" } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: amount * 100, // Razorpay amount is in paise (lowest denomination)
      currency,
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
