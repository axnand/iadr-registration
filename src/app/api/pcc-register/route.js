// app/api/pcc-register/route.js

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

// PUT update existing registration
export async function PUT(request) {
  try {
    await dbConnect();
    const { _id, fullName, phone, email, courseCode, courseName, courseDate } = await request.json();

    if (!_id) {
      return NextResponse.json({ success: false, error: "Registration ID is required" }, { status: 400 });
    }

    // Find and update the registration
    const registration = await PCCRegistration.findByIdAndUpdate(
      _id,
      {
        fullName,
        phone,
        email,
        courseCode,
        courseName,
        courseDate
      },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE registration
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: "Registration ID is required" }, { status: 400 });
    }

    const registration = await PCCRegistration.findByIdAndDelete(id);

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Registration deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}