import sendPaymentRequestEmail from "@/utils/paymentMail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await sendPaymentRequestEmail(req.body);
    res.status(200).json({ success: true, message: "Payment request email sent!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
}
