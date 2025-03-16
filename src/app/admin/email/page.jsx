"use client";
import { useState } from "react";

export default function SendEmailPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    pincode: "",
    address: "",
    eventType: "",
    category: "",
    accompanying: "",
    numberOfAccompanying: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone (Registration ID)</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nationality</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Event Type</label>
            <input type="text" name="eventType" value={formData.eventType} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input type="text" name="category" value={formData.category} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Accompanying</label>
            <input type="text" name="accompanying" value={formData.accompanying} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Accompanying</label>
            <input type="text" name="numberOfAccompanying" value={formData.numberOfAccompanying} onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
          </div>
        </div>

        <button onClick={handleSendEmail} disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {loading ? "Sending..." : "Send Email"}
        </button>

        {message && (
          <p className={`mt-4 text-center ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
