'use client';

import { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PCCCard({ title, type, conductors, fee, code, imageUrl, seatsAvailable }) {
  const [loading, setLoading] = useState(false);
  const [processingRegistration, setProcessingRegistration] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });

  const badgeColor = type === 'Full Day' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';



  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
      }

      if (!phoneRegex.test(formData.phone)) {
        toast.error("Please enter a valid phone number");
        return;
      }
    setLoading(true);


    try {
     

      // Create Razorpay Order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: fee * 100, courseCode: code, courseTitle: title })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order');

      // Load Razorpay if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,
        amount: orderData.amount,
        currency: 'INR',
        name: 'PCC Registration',
        description: title,
        order_id: orderData.id,
        handler: async function (response) {
          setProcessingRegistration(true);
          try {
            toast.success("Payment successful!");

            const registrationData = {
              ...formData,
              courseCode: code,
              courseName: title,
              paymentId: response.razorpay_payment_id || 'N/A', 
              amount: orderData.amount / 100, 
              currency: 'INR', 
              registrationDate: new Date().toISOString() 
            };

            // Save to DB
            const regRes = await fetch("/api/pcc-register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(registrationData),
            });
            const regData = await regRes.json();
            if (!regRes.ok) throw new Error(regData.error || "Registration failed");

            // Send confirmation email
            await fetch("/api/pcc-register/mail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(registrationData),
            });

            toast.success("Registration complete & confirmation email sent!");
            setShowForm(false);
          } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong after payment");
          } finally {
            setProcessingRegistration(false);
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: '#0ea5a1' },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setLoading(false);
          }
        }
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not start registration");
      setLoading(false);
    }
  } 


  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
        {imageUrl && (
          <div className="h-56 w-full overflow-hidden">
            <img src={imageUrl} alt={title} className="object-cover w-full h-full" />
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col items-start">
          <span className={`px-2 py-1 rounded-full sm:text-sm text-xs font-medium ${badgeColor}`}>{type}</span>
          <h3 className="mt-2 sm:text-lg text-md font-bold text-gray-900">{title}</h3>
          <div className="mt-3">
            <h1 className="text-sm pb-1 font-semibold text-gray-800">Conductors:</h1>
            {conductors.map((name, index) => (
              <p key={index} className="sm:text-sm text-[13px] text-gray-600 font-semibold">{name}</p>
            ))}
          </div>
        </div>
        <div className="flex flex-col py-6 border-t-2 mx-4 mt-2">
          <p className="sm:text-xl text-lg text-zinc-900 mt-4 font-bold">Fee: ₹{fee}</p>
          <p className="text-sm mt-1 font-medium text-gray-500">Code: {code}</p>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading || seatsAvailable === 0}
            className={`mt-4 sm:text-base text-[15px] ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 font-semibold rounded-lg transition`}
          >
            {seatsAvailable === 0
              ? 'Seats Full'
              : loading
              ? 'Processing...'
              : 'Register'}
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 mx-6 w-full max-w-xl">
            <h2 className="sm:text-xl text-[15px] font-bold mb-4">Register for {title}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <div className="flex justify-end gap-3 text-[13px] font-semibold">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded">
                  Proceed to Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {processingRegistration && (
        <div className="fixed inset-0 bg-white flex flex-col justify-center items-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-6"></div>
          <p className="text-lg font-semibold text-gray-700 text-center px-4">
            Processing registration...<br />Wait for confirmation email.<br />Do not close this screen.
          </p>
        </div>
      )}
    </>
  );
}
