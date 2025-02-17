"use client";

import React, { useState, useEffect } from "react";
import { calculateTotalAmount } from "./pricing-logic";

// ------------------ Reusable UI Components Using Tailwind ------------------ //

function Card({ children, className }) {
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 ${className || ""}`}>
      {children}
    </div>
  );
}

function CardHeader({ children, className }) {
  return <div className={`mb-4 ${className || ""}`}>{children}</div>;
}

function CardTitle({ children, className }) {
  return <h2 className={`text-xl font-semibold ${className || ""}`}>{children}</h2>;
}

function CardContent({ children, className }) {
  return <div className={`mb-4 ${className || ""}`}>{children}</div>;
}

function CardFooter({ children, className }) {
  return <div className={`mt-4 ${className || ""}`}>{children}</div>;
}

function Button({ className = "", children, ...rest }) {
  return (
    <button
      className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 
                  focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function Label({ className = "", children, ...rest }) {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className}`} {...rest}>
      {children}
    </label>
  );
}

function Input({ className = "", ...rest }) {
  return (
    <input
      className={`border border-gray-300 rounded px-3 py-2 w-full 
                  focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
      {...rest}
    />
  );
}

function Textarea({ className = "", ...rest }) {
  return (
    <textarea
      className={`border border-gray-300 rounded px-3 py-2 w-full 
                  focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
      {...rest}
    />
  );
}

function Select({ className = "", children, ...rest }) {
  return (
    <select
      className={`border border-gray-300 rounded px-3 py-2 w-full 
                  focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

// ------------------ Actual Registration Form ------------------ //

const titles = ["Mr.", "Mrs.", "Ms.", "Dr."];
const categories = [
  "ISDR Member (Scientific Sessions, Trade Fair, Symposia with Hospitality)",
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
        category: "",
        eventType: "",
        accompanying: "No",
        numberOfAccompanying: 0,
        accompanyingPersons: [], // Array of objects like [{ name: "John Doe" }]
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
            body: JSON.stringify(formData),
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registration Form</CardTitle>
      </CardHeader>
      <CardContent>
        {registrationComplete ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold">Thanks for registering!</h2>
            <p className="mt-4">We have received your registration details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Title & Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleSelectChange("title", e.target.value)}
                >
                  <option value="">Select title</option>
                  {titles.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  name="fullName"
                  onChange={handleInputChange}
                  required
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">{errors.fullName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  onChange={handleInputChange}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  onChange={handleInputChange}
                  required
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Row 3: City & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={(e) => handleSelectChange("country", e.target.value)}
                >
                  <option value="">Select country</option>
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="uk">UK</option>
                  <option value="australia">Australia</option>
                </Select>
              </div>
            </div>

            {/* Row 4: Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  type="number"
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Row 5: Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" onChange={handleInputChange} required />
            </div>

            {/* Row 6: Category */}
            <div className="space-y-2">
              <Label htmlFor="select-category">Category</Label>
              <Select
                id="select-category"
                name="category"
                value={formData.category}
                onChange={(e) => handleSelectChange("category", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>

            {/* Row 7: Event Type */}
            <div className="space-y-2">
              <Label htmlFor="select-event-type">Event Type</Label>
              <Select
                id="select-event-type"
                name="eventType"
                value={formData.eventType}
                onChange={(e) => handleSelectChange("eventType", e.target.value)}
              >
                <option value="">Select event type</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            {/* Row 8: Accompanying Person */}
            <div className="space-y-2">
              <Label htmlFor="select-accompanying">Accompanying Person</Label>
              <Select
                id="select-accompanying"
                name="accompanying"
                value={formData.accompanying}
                onChange={(e) => handleAccompanyingChange(e.target.value)}
              >
                {accompanyingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            {/* Number of Accompanying Persons */}
            {formData.accompanying === "Yes" && (
              <div className="space-y-2">
                <Label htmlFor="number-of-accompanying">Number of Accompanying Persons</Label>
                <Input
                  id="number-of-accompanying"
                  name="numberOfAccompanying"
                  type="number"
                  min="1"
                  value={formData.numberOfAccompanying}
                  onChange={(e) => handleNumberOfAccompanyingChange(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Accompanying Persons Fields */}
            {formData.accompanying === "Yes" &&
  formData.accompanyingPersons.map((person, index) => (
    <div key={index} className="space-y-2">
      <Label htmlFor={`accompanying-person-${index}`}>
        Accompanying Person {index + 1} Name
      </Label>
      <Input
        id={`accompanying-person-${index}`}
        name={`accompanyingPerson${index}`}
        value={person.name}
        onChange={(e) =>
          handleAccompanyingPersonChange(index, e.target.value)
        }
        required
      />
    </div>
  ))
}

            {/* Total Amount */}
            <div className="space-y-2">
              <Label>Total Amount Payable</Label>
              <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            </div>

            {/* Cancellation Policy */}
            <div className="text-sm text-gray-500">
              <h3 className="font-semibold">Cancellation Policy:</h3>
              <p>
                Refund will be provided with written notification against the
                original registration receipt only if applied before 15 July 2025.
              </p>
              <p>Post 15 July 2025, no refund will be made.</p>
            </div>
          </form>
        )}
      </CardContent>
      {!registrationComplete && (
        <CardFooter>
          <Button onClick={handlePayNow}>Pay Now</Button>
        </CardFooter>
      )}
    </Card>
  );
}
