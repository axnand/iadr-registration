// app/api/pcc-registrations/route.js

import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import PCCRegistration from "../../../../models/Pcc";
import { PCC_DATA } from "@/app/pcc-registration/PCC";

// GET all registrations
export async function GET() {
  try {
    await dbConnect();
    const registrations = await PCCRegistration.find({}, "-__v");
    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST new registration with seat check
export async function POST(request) {
  try {
    await dbConnect();
    const { fullName, phone, email, courseCode, courseDate } = await request.json();

    // 1️⃣ Find course by code
    const course = PCC_DATA.find(c => c.code === courseCode);
    if (!course) {
      return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 });
    }

    // 2️⃣ Seat limit check
    if (course.pax && Number(course.pax) > 0) {
      const currentCount = await PCCRegistration.countDocuments({ courseCode });
      if (currentCount >= course.pax) {
        return NextResponse.json({ success: false, message: "Seats are full for this course." }, { status: 400 });
      }
    }

    // 3️⃣ Save registration
    const registration = await PCCRegistration.create({
      fullName,
      phone,
      email,
      courseCode,
      courseName: course.title,
      courseDate
    });

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
