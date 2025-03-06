import Razorpay from "razorpay";

export async function POST(request) {
  try {
    // Parse the incoming JSON payload
    const { amount, currency } = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount, // Amount in paise (e.g., 1 rupee = 100 paise)
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    });

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Error creating order" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
