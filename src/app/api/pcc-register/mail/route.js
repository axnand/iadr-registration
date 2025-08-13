

import sendCourseRegistrationEmail from "@/utils/pccMail";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Received course registration email request:", body);

    // body should include: fullName, email, phone, courseName, courseDate, courseCode
    const response = await sendCourseRegistrationEmail(body);

    return new Response(
      JSON.stringify({
        message: "Course registration confirmation email sent",
        response
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error sending course registration email:", error);

    return new Response(
      JSON.stringify({
        message: "Error sending course registration email",
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
