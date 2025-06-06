import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
  address: { type: String, required: true },
  category: { type: String, required: true },
  eventType: { type: String, required: true },
  accompanying: { type: String, required: true },
  numberOfAccompanying: { type: Number, required: true },
  accompanyingPersons: [
    {
      name: { type: String, required: true },
    },
  ],
  amountPaid: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentId: { type: String },
  paymentMode: { type: String, enum: ["offline", "online"], default: "online" },
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
