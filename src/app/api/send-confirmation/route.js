import sendConfirmationEmail from "@/utils/sendConfirmations";
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Received confirmation request:", body);
    const response = await sendConfirmationEmail(body);
    return new Response(
      JSON.stringify({ message: "Confirmation email sent", response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ message: "Error sending email", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
