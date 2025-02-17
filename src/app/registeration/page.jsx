"use client";

import React, { useState, useEffect } from "react";
import { calculateTotalAmount } from "./pricing-logic";
import Image from "next/image";



// ------------------ Actual Registration Form ------------------ //

const titles = ["Mr.", "Mrs.", "Ms.", "Dr."];
const categories = [
  "ISDR Member",
  "Non-Member (Delegate)",
  "Student: UG/PG/PhD (ISDR Member)",
  "Student: UG/PG/PhD (Non-Member)",
  "International Delegate (IADR Member)",
  "International Delegate (Non-IADR Member)",
];
const eventTypes = ["WWW9 Meeting Fee", "IADR-APR Fee", "Combo (WWW9 & IADR-APR)"];
const accompanyingOptions = ["No", "Yes"];

export default function RegistrationForm() {
    const [formData, setFormData] = useState({
        title: "",
        fullName: "",
        email: "",
        phone: "",
        city: "",
        country: "",
        pincode: "",
        address: "",
        category: "",  // You might also consider a default here if appropriate.
        eventType: eventTypes[0] || "", // Default to the first event type.
        accompanying: "No",
        numberOfAccompanying: 0,
        accompanyingPersons: [],
      });
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Recalculate total based on pricing logic
  useEffect(() => {
    async function updateTotal() {
      const total = await calculateTotalAmount(
        formData.category,
        formData.eventType,
        formData.numberOfAccompanying,
        new Date()
      );
      setTotalAmount(total);
    }
    updateTotal();
  }, [formData.category, formData.eventType, formData.numberOfAccompanying]);

  // Load Razorpay script once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccompanyingChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      accompanying: value,
      numberOfAccompanying: value === "Yes" ? 1 : 0,
      accompanyingPersons: value === "Yes" ? [{ name: "" }] : [],
    }));
  };
  

  const handleAccompanyingPersonChange = (index, value) => {
    setFormData((prev) => {
      const newAccompanyingPersons = [...prev.accompanyingPersons];
      newAccompanyingPersons[index] = { name: value };
      return { ...prev, accompanyingPersons: newAccompanyingPersons };
    });
  };

  const handleNumberOfAccompanyingChange = (value) => {
    const number = Number.parseInt(value, 10);
    setFormData((prev) => {
      const newAccompanyingPersons = Array.from({ length: number }, (_, i) => {
        return prev.accompanyingPersons[i] || { name: "" };
      });
      return {
        ...prev,
        numberOfAccompanying: number,
        accompanyingPersons: newAccompanyingPersons,
      };
    });
  };
  

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number should be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Payment handler: on successful payment, post registration data to API and mark complete
  const handlePayNow = async () => {
    if (!validateForm()) {
      console.log("Form has errors:", errors);
      return;
    }

    // Convert totalAmount (INR) to paise
    const amountInPaise = totalAmount * 100;

    const options = {
      // Use public environment variable for Razorpay key.
      key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,
      amount: amountInPaise, // Amount in paise
      currency: "INR",
      name: "Event Registration",
      description: "Payment for event registration",
      handler: async function (response) {
        console.log("Payment successful:", response);
        alert("Payment successful! Razorpay Payment ID: " + response.razorpay_payment_id);

        const registrationData = { ...formData, paymentId: response.razorpay_payment_id };

        // Post registration data to your API endpoint
        try {
          const res = await fetch("/api/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registrationData),
          });
          const data = await res.json();
          if (data.success) {
            setRegistrationComplete(true);
          } else {
            alert("Payment succeeded, but registration failed: " + data.error);
          }
        } catch (error) {
          console.error("Error submitting registration:", error);
          alert("Payment succeeded, but registration submission encountered an error.");
        }
      },
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", formData);
      // You can either handle submission via a button click or via payment flow.
    } else {
      console.log("Form has errors");
    }
  };

  return (
    <div className="w-full h-full ">
      <div className="py-5 shadow-md ">
        <div
  className="p-4 flex justify-start md:h-24 h-20 w-full "
  style={{ backgroundImage: 'url(/logo.jpg)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
>
  {/* Optionally, you can add text or other elements inside the div */}
</div>
</div>

    <div className="max-w-2xl mt-6 mx-auto p-4">
    <h1 className="md:text-4xl text-2xl font-extrabold mb-8 text-[#2f3644]">Registration Form</h1>
    {registrationComplete ? (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Thanks for registering!</h2>
        <p className="mt-4">We have received your registration details.</p>
      </div>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-6 ">
        {/* Row 1: Title & Full Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
          <div>
            <label htmlFor="title" className="block text-gray-700 font-medium pb-2 text-sm">
              Title
            </label>
            <select
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleSelectChange("title", e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Select title</option>
              {titles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="full-name" className="block text-gray-700 font-medium pb-2 text-sm">
              Full Name
            </label>
            <input
              id="full-name"
              name="fullName"
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs">{errors.fullName}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium pb-2 text-sm">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-gray-700 font-medium pb-2 text-sm">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            {errors.phone && (
              <p className="text-red-500 text-xs">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Row 3: City & Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div>
            <label htmlFor="city" className="block text-gray-700 font-medium pb-2 text-sm">
              City
            </label>
            <input
              id="city"
              name="city"
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-gray-700 font-medium pb-2 text-sm">
              Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={(e) => handleSelectChange("country", e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Select country</option>
              <option value="india">India</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="australia">Australia</option>
            </select>
          </div>
        </div>

        {/* Row 4: Pincode */}
        <div className="text-[13px]">
          <label htmlFor="pincode" className="block text-gray-700 font-medium pb-2 text-sm">
            Pincode
          </label>
          <input
            id="pincode"
            name="pincode"
            type="number"
            onChange={handleInputChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          />
        </div>

        {/* Row 5: Address */}
        <div className="text-[13px]">
          <label htmlFor="address" className="block text-gray-700 font-medium pb-2 text-sm">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            onChange={handleInputChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          />
        </div>

        {/* Row 6: Category */}
        <div className="text-[13px]">
          <label htmlFor="category" className="block text-gray-700 font-medium pb-2 text-sm">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={(e) => handleSelectChange("category", e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Row 7: Event Type */}
        <div className="text-[13px]">
          <label htmlFor="eventType" className="block text-gray-700 font-medium pb-2 text-sm">
            Event Type
          </label>
          <select
  id="eventType"
  name="eventType"
  value={formData.eventType}
  onChange={(e) => handleSelectChange("eventType", e.target.value)}
  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  required
>
  <option value="">Select event type</option>
  {eventTypes.map((type) => (
    <option key={type} value={type}>
      {type}
    </option>
  ))}
</select>

        </div>

        {/* Row 8: Payment ID */}
        

        {/* Row 9: Accompanying Option */}
        <div className="text-[13px]">
          <label htmlFor="accompanying" className="block text-gray-700 font-medium pb-2 text-sm">
            Accompanying Person
          </label>
          <select
            id="accompanying"
            name="accompanying"
            value={formData.accompanying}
            onChange={(e) => handleAccompanyingChange(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {accompanyingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Row 10: Number of Accompanying Persons */}
        {formData.accompanying === "Yes" && (
          <div className="text-[13px]">
            <label htmlFor="numberOfAccompanying" className="block text-gray-700 font-medium pb-2 text-sm">
              Number of Accompanying Persons
            </label>
            <input
              id="numberOfAccompanying"
              name="numberOfAccompanying"
              type="number"
              min="1"
              value={String(formData.numberOfAccompanying)}
              onChange={(e) => handleNumberOfAccompanyingChange(e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>
        )}

        {/* Row 11: Accompanying Persons Fields (if manually entered) */}
        {formData.accompanying === "Yes" &&
          formData.accompanyingPersons.map((person, index) => (
            <div key={index} className="text-[13px]">
              <label htmlFor={`accompanyingPerson${index}`} className="block text-gray-700 font-medium pb-2 text-sm">
                Accompanying Person {index + 1} Name
              </label>
              <input
                id={`accompanyingPerson${index}`}
                name={`accompanyingPerson${index}`}
                type="text"
                value={person.name}
                onChange={(e) =>
                  handleAccompanyingPersonChange(index, e.target.value)
                }
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                required
              />
            </div>
          ))}

        {/* Row 12: Total Amount */}
        <div className="text-[13px]">
          <label className="block text-gray-700 font-medium pb-2 text-sm">Total Amount Payable</label>
          <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
        </div>

        {/* Row 13: Cancellation Policy */}
        <div className="text-[13px] text-gray-500">
          <h3 className="font-semibold">Cancellation Policy:</h3>
          <p>
            Refund will be provided with written notification against the original registration receipt only if applied before 15 July 2025.
          </p>
          <p>Post 15 July 2025, no refund will be made.</p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handlePayNow}
            className="w-full bg-blue-600 font-semibold transition text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Pay Now
          </button>
        </div>
      </form>
    )}
  </div>
  </div>
  );
}
