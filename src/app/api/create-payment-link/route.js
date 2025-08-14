import Razorpay from "razorpay";

export async function POST(req) {
  const body = await req.json();
  const { fullName, email, phone, amount, description, currency } = body;

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: currency || "INR",
      accept_partial: false,
      description: description || "Payment Request",
      customer: {
        name: fullName,
        email,
        contact: phone
      },
      notify: {
        sms: true,
        email: true
      },
      expire_by: Math.floor(new Date("2030-12-31").getTime() / 1000),
      notes: {
        internal_ref: `admin_${Date.now()}`
      }
    });

    return Response.json(paymentLink);
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}