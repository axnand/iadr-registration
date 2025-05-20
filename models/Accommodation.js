import mongoose from "mongoose";

const AccommodationSchema = new mongoose.Schema({
  title: { type: String },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
  address: { type: String, required: true },
  delegateType: { type: String, required: true, enum: ["Indian Delegate", "International Delegate"] },
  roomType: { type: String, required: true, enum: ["Twin Sharing", "Single Occupancy"] },
  twinSharingDelegateName: { type: String },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  amountPaid: { type: Number, required: true },
  currency: { type: String, enum: ["INR", "USD"], required: true },
  paymentId: { type: String },
  paymentMode: { type: String, enum: ["offline", "online"], default: "online" },
});

export default mongoose.models.Accommodation || 
  mongoose.model("Accommodation", AccommodationSchema);