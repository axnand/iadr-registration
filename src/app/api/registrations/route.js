import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Registrations from "../../../../models/Registrations";

export async function GET() {
  try {
    await dbConnect();
    const registrations = await Registrations.find({}, "-__v"); // Exclude MongoDB versioning field
    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    const registration = await Registrations.create({
      ...data,
      amountPaid: parseFloat(data.amountPaid) || 0, // Ensure it's a number
      currency: data.currency || "INR",
    });

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



export async function PUT(request) {
  try {
    await dbConnect();
    const data = await request.json();

    const registration = await Registrations.findByIdAndUpdate(
      data._id,
      { ...data, amountPaid: parseFloat(data.amountPaid) || 0 }, // Ensure it's a number
      { new: true }
    );

    if (!registration) throw new Error("Registration not found");
    return NextResponse.json({ success: true, registration });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    const registration = await Registrations.findByIdAndDelete(id);
    if (!registration) throw new Error("Registration not found");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
