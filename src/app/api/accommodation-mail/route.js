import sendAccommodationEmail from "@/utils/sendAccommodationEmail.js";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Received accommodation booking request:", body);
    const response = await sendAccommodationEmail(body);
    return new Response(
      JSON.stringify({ 
        message: "Accommodation confirmation email sent", 
        response 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error sending accommodation email:", error);
    
    return new Response(
      JSON.stringify({ 
        message: "Error sending accommodation email", 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}