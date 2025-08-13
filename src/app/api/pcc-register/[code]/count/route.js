import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import PCCRegistration from "../../../../../../models/Pcc";
import { PCC_DATA } from "@/app/pcc-registration/PCC";

export async function GET(req, context) {
  const { code } = await context.params; // ✅ required in Next.js 15+
  console.log("Course code:", code);
  try {
    await dbConnect();

    const course = PCC_DATA.find(c => c.code === code);
    if (!course) {
      return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 });
    }

    const count = await PCCRegistration.countDocuments({ courseCode: code });

    return NextResponse.json({
      success: true,
      code,
      count,
      courseName: course.title,
      totalRegistrations: count,
      maxSeats: course.pax || null,
      seatsAvailable: course.pax ? course.pax - count : null
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
