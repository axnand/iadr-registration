// pages/admin/send-payment.js
'use client';
import { useState } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SendPaymentPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    countryCode: '',
    phone: '',
    currency: 'INR',
    amount: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Email & phone regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidPhone = phone => /^\d{6,14}$/.test(phone); // only digits after country code

  const validateForm = () => {
    if (!emailRegex.test(form.email)) {
      toast.error("Invalid email address");
      return false;
    }

    if (!form.countryCode || !/^\+?[1-9]\d{0,3}$/.test(form.countryCode)) {
      toast.error("Invalid country code");
      return false;
    }

    if (!isValidPhone(form.phone)) {
      toast.error("Invalid phone number");
      return false;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return false;
    }

    if (form.currency === "USD" && parseFloat(form.amount) < 1) {
      toast.error("Minimum amount for USD is $1");
      return false;
    }

    return true;
  };

  const handleSend = async e => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: `${form.countryCode}${form.phone}` 
        })
      });

      const linkData = await res.json();

      if (!linkData.short_url) {
        toast.error(linkData.error || "Error creating payment link");
        return;
      }

      toast.success(
        <a
          href={linkData.short_url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Payment link created — click to view
        </a>
      );

      // Optionally clear form
      setForm({
        fullName: '',
        email: '',
        countryCode: '',
        phone: '',
        currency: 'INR',
        amount: '',
        description: ''
      });

    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3A64B0] flex items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo2.png" 
            alt="Company Logo" 
            className="h-12 w-auto"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Send Payment Request
        </h1>

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-4 text-[15px]">
          <input 
            name="fullName" 
            placeholder="Full Name" 
            value={form.fullName}
            onChange={handleChange} 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
          />
          
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            value={form.email}
            onChange={handleChange} 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
          />

          <div className="flex gap-2">
  <div className="w-1/3">
    <input 
      name="countryCode"
      placeholder="e.g. 91"
      value={form.countryCode}
      onChange={e => {
        // Allow only digits, max 4
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setForm({ ...form, countryCode: val });
      }}
      required
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
    />
  </div>
  <input 
    name="phone" 
    placeholder="Phone"
    value={form.phone}
    onChange={e => {
      // Allow only digits, max 14
      const val = e.target.value.replace(/\D/g, '').slice(0, 14);
      setForm({ ...form, phone: val });
    }}
    required
    className="w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
  />
</div>


          <select
            name="currency"
            onChange={handleChange}
            value={form.currency}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
          >
            <option value="INR">INR - Indian Rupee</option>
            <option value="USD">USD - US Dollar</option>
          </select>

          <input 
            name="amount" 
            type="number" 
            placeholder="Amount" 
            value={form.amount}
            onChange={handleChange} 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
          />

          <textarea 
            name="description" 
            placeholder="Description (optional)" 
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none resize-none"
          />

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full font-semibold text-white py-2 px-4 rounded-lg transition-colors ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-[#3A64B0] hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : "Send Payment Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
