import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Accommodation from "../../../../models/Accommodation";

export async function GET() {
  try {
    await dbConnect();
    const accommodations = await Accommodation.find({}, "-__v"); // Exclude MongoDB versioning field
    return NextResponse.json({ success: true, accommodations });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    const accommodation = await Accommodation.create({
      ...data,
      amountPaid: parseFloat(data.amountPaid) || 0, // Ensure it's a number
      currency: data.currency || "INR",
    });

    return NextResponse.json({ success: true, accommodation });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const data = await request.json();

    const accommodation = await Accommodation.findByIdAndUpdate(
      data._id,
      { ...data, amountPaid: parseFloat(data.amountPaid) || 0 }, // Ensure it's a number
      { new: true }
    );

    if (!accommodation) throw new Error("Accommodation booking not found");
    return NextResponse.json({ success: true, accommodation });
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
    
    const accommodation = await Accommodation.findByIdAndDelete(id);
    if (!accommodation) throw new Error("Accommodation booking not found");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}