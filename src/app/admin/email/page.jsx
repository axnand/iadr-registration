"use client";
import { useState } from "react";

// 🔹 Available Titles
const titles = ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];

// 🔹 Event Types & Categories
const eventTypeCategories = {
  "WW9 Meeting": [
    "International Delegate",
    "International Delegate (Asia Pacific)",
    "Indian Delegate",
    "UG Students",
  ],
  "IADR-APR": [
    "ISDR Member",
    "Non-Member (Delegate)",
    "Student (ISDR Member)",
    "Student (Non-Member)",
    "International Delegate (IADR Member)",
    "International Delegate (Non-IADR Member)",
  ],
  "Combo (WW9 & IADR-APR)": [
    "International Delegate",
    "International Delegate (Asia Pacific)",
    "Indian Delegate",
    "UG Students",
  ],
};

export default function SendEmailPage() {
  const [formData, setFormData] = useState({
    title: "",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    pincode: "",
    address: "",
    eventType: "",
    category: "",
    paymentMode: "",
    amount: "",
    accompanying: "",
    numberOfAccompanying: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔹 Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Handle Sending Email
  const handleSendEmail = async () => {
    setLoading(true);
    setMessage("");
    

    try {
      const response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("✅ Email sent successfully!");
      } else {
        setMessage("❌ Failed to send email: " + result.message);
      }
    } catch (error) {
      setMessage("❌ Error sending email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-semibold text-center text-blue-600 mb-4">📧 Send Confirmation Email</h2>

        <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-4">
          {/* 🔹 Title Dropdown */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Title</label>
            <select name="title" value={formData.title} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200">
              <option value="">Select Title</option>
              {titles.map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>

          {/* 🔹 Full Name */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" required />
          </div>

          {/* 🔹 Email */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" required />
          </div>

          {/* 🔹 Phone */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Phone (Registration ID)</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" required />
          </div>

          {/* 🔹 City */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          {/* 🔹 Nationality */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Nationality</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          {/* 🔹 Address */}
          <div className="md:col-span-2">
            <label className="block text-[13px] font-medium text-gray-700">Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          {/* 🔹 Event Type Dropdown */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Event Type</label>
            <select name="eventType" value={formData.eventType} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200">
              <option value="">Select Event Type</option>
              {Object.keys(eventTypeCategories).map((event) => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>

          {/* 🔹 Category Dropdown (Updates based on Event Type) */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Category</label>
            <select name="category" value={formData.category} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" disabled={!formData.eventType}>
              <option value="">Select Category</option>
              {formData.eventType && eventTypeCategories[formData.eventType]?.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700">Payment Mode</label>
            <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200">
              <option value="">Select Category</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Amount</label>
            <input type="text" name="amount" value={formData.amount} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          {/* 🔹 Accompanying */}
          

          {/* 🔹 Number of Accompanying */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Number of Accompanying</label>
            <input type="text" name="numberOfAccompanying" value={formData.numberOfAccompanying} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700">Name of Accompanying Person</label>
            <input type="text" name="accompanying" value={formData.accompanying} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>
        </div>

        

        {/* 🔹 Submit Button */}
        <button onClick={handleSendEmail} disabled={loading}
          className={`mt-4 w-full py-2 rounded text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
          {loading ? "Sending..." : "Send Email"}
        </button>

        {/* 🔹 Success/Error Message */}
        {message && (
          <p className={`mt-4 text-center ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
