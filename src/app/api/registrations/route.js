// src/app/api/registrations/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Registrations from "../../../../models/Registrations";

export async function GET() {
  try {
    await dbConnect();
    const registrations = await Registrations.find({});
    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error("Error in GET /api/registrations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    // Ensure that data.paymentId is included
    const registration = await Registrations.create(data);
    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error("Error in POST /api/registrations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
