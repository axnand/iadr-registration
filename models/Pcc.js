import mongoose from "mongoose";

const PCCRegistrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, 
  phone: { type: String, required: true },   
  email: { type: String, required: true },   
  courseName: { type: String, required: true }, 
  courseCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now } 
}); 

export default mongoose.models.PCCRegistration ||
  mongoose.model("PCCRegistration", PCCRegistrationSchema);
