"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ------------------ Accommodation Registration Form ------------------ //

const titles = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];
const delegateTypes = ["Indian Delegate", "International Delegate"];
const roomTypes = ["Twin Sharing", "Single Occupancy"];

// Calculate number of days between two dates
const calculateDays = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0;
  
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  
  // Calculate difference in time
  const timeDifference = checkOut.getTime() - checkIn.getTime();
  
  // Convert time difference to days
  const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  
  return dayDifference > 0 ? dayDifference : 0;
};

// Pricing based on delegate type, room type, and number of days
const calculateAccommodationAmount = (delegateType, roomType, numberOfDays) => {
  if (!delegateType || !roomType || numberOfDays <= 0) {
    return { amount: 0, currency: "INR", numberOfDays: 0 };
  }

  let dailyRate;
  let currency;

  if (delegateType === "Indian Delegate") {
    dailyRate = roomType === "Twin Sharing" ? 500000 : 1000000; // Daily rate in paise (Rs.5000 or Rs.10000)
    currency = "INR";
  } else {
    dailyRate = roomType === "Twin Sharing" ? 7500 : 15000; // Daily rate in cents (USD 75 or USD 150)
    currency = "USD";
  }

  return {
    amount: dailyRate * numberOfDays,
    currency,
    numberOfDays,
    dailyRate
  };
};

export default function AccommodationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    pincode: "",
    address: "",
    delegateType: "Indian Delegate",
    roomType: "Single Occupancy",
    twinSharingDelegateName: "",
    checkInDate: "",
    checkOutDate: "",
  });
  const [totalAmount, setTotalAmount] = useState({ amount: 0, currency: "INR", numberOfDays: 0 });
  const [errors, setErrors] = useState({});
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  // Recalculate total based on pricing logic
  useEffect(() => {
    const numberOfDays = calculateDays(formData.checkInDate, formData.checkOutDate);
    
    const calculatedTotal = calculateAccommodationAmount(
      formData.delegateType,
      formData.roomType,
      numberOfDays
    );

    setTotalAmount(calculatedTotal);
  }, [formData.delegateType, formData.roomType, formData.checkInDate, formData.checkOutDate]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const isEmpty = (field) => {
      return !field || (typeof field === 'string' && field.trim() === '');
    };
  
    if (isEmpty(formData.fullName)) {
      newErrors.fullName = "Full name is required";
    }
  
    if (isEmpty(formData.email)) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
  
    if (isEmpty(formData.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?\d{1,3}?\d{7,15}$/.test(formData.phone)) {
      newErrors.phone =
        "Please enter a valid international phone number (e.g., +91XXXXXXXXXX or +1 5555555555)";
    }
  
    if (isEmpty(formData.pincode)) {
      newErrors.pincode = "Pincode is required";
    }
  
    if (isEmpty(formData.city)) {
      newErrors.city = "City is required";
    }
  
    if (isEmpty(formData.country)) {
      newErrors.country = "Country is required";
    }
  
    if (isEmpty(formData.address)) {
      newErrors.address = "Address is required";
    }

    if (isEmpty(formData.checkInDate)) {
      newErrors.checkInDate = "Check-in date is required";
    }

    if (isEmpty(formData.checkOutDate)) {
      newErrors.checkOutDate = "Check-out date is required";
    } else if (formData.checkInDate && new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      newErrors.checkOutDate = "Check-out date must be after check-in date";
    }

    // Additional validation for minimum stay
    if (formData.checkInDate && formData.checkOutDate) {
      const days = calculateDays(formData.checkInDate, formData.checkOutDate);
      if (days <= 0) {
        newErrors.checkOutDate = "Check-out date must be at least one day after check-in date";
      }
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Payment handler: on successful payment, post registration data to API and mark complete
  const handlePayNow = async () => {
    if (!validateForm()) {
      console.log("Form has errors:", errors);
      toast.error("Please correct the errors in the form");
      return;
    }

    if (totalAmount.amount <= 0) {
      toast.error("Please select valid dates to calculate the amount");
      return;
    }
  
    const { amount, currency } = totalAmount;
  
    // Create order on your server with the calculated amount
    let orderData;
    try {
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          currency,
          receipt: `ACCOM-${formData.fullName}-${Date.now()}` // Add accommodation identifier
        }),
      });
      orderData = await orderResponse.json();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error creating order. Please try again.");
      return;
    }
  
    // Configure Razorpay checkout options using the order_id from the API
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,
      amount, // in paise/cents
      currency,
      order_id: orderData.id,
      name: "Hotel Leela Accommodation",
      description: `Payment for ${totalAmount.numberOfDays} night(s) accommodation booking`,
      handler: async function (response) {
        toast.success("Payment successful! Razorpay Payment ID: " + response.razorpay_payment_id);
        toast.success("Wait for the Confirmation Mail");

        setLoading(true);
  
        // Submit the registration data along with the payment ID
        const registrationData = {
          ...formData,
          paymentId: response.razorpay_payment_id,
          amountPaid: amount / 100, 
          currency,
          numberOfDays: totalAmount.numberOfDays,
          twinSharingDelegateName: formData.twinSharingDelegateName,
          registrationType: "Accommodation", // Add identifier for accommodation
        };
  
        try {
          const res = await fetch("/api/accommodation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registrationData),
          });
          const data = await res.json();
          if (data.success) {
            setRegistrationComplete(true);
            toast.success("Accommodation booking successful!");
            setLoading(false);
          } else {
            toast.error("Payment succeeded, but booking failed: " + data.error);
          }
          
          // Send confirmation email
          const emailResponse = await fetch("/api/accommodation-mail", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(registrationData),
          });

          if (!emailResponse.ok) {
            const emailError = await emailResponse.json();
            throw new Error(emailError.message || "Failed to send confirmation email");
          }

          const emailResult = await emailResponse.json();
          console.log("Email result:", emailResult);
          if (emailResult.response && emailResult.response.success) {
            toast.success("Confirmation email sent successfully!");
          } else {
            toast.error("Failed to send confirmation email: " + emailResult.message);
          }
        } catch (error) {
          console.error("Error submitting accommodation booking:", error);
          toast.error("Payment succeeded, but booking submission encountered an error.");
          setLoading(false);
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
      handlePayNow();
    } else {
      console.log("Form has errors");
    }
  };

  // Helper function to get daily rate display text
  const getDailyRateText = () => {
    if (formData.delegateType === "Indian Delegate") {
      return formData.roomType === "Twin Sharing" ? "₹5,000" : "₹10,000";
    } else {
      return formData.roomType === "Twin Sharing" ? "$75" : "$150";
    }
  };

  return (
    <>
    {loading ? (
      <div className="flex justify-center items-center h-screen">
        <div className="border-t-transparent border-[#377DFF] w-8 h-8 border-4 border-solid rounded-full animate-spin"></div>
      </div>
    ) : (
      <div className="w-full h-full">
        <div className="py-5 shadow-md">
          <Link href={"https://iadrapr2025.com"}>
            <div
              className="p-4 flex justify-start md:h-24 h-20 w-full"
              style={{
                backgroundImage: 'url(/logo2.png)',
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            >
              {/* Logo container */}
            </div>
          </Link>
        </div>

        <div className="max-w-2xl mt-6 mx-auto p-4">
          {registrationComplete ? (
            <div className="flex flex-col items-center justify-center p-4">
              <h1 className="text-4xl font-extrabold mb-4">
                Thank You for Your Accommodation Booking!
              </h1>
              <p className="mb-8 text-center">
                We have received your booking details for Hotel Leela. Kindly check for the confirmation mail.
              </p>
              <a
                href="https://iadrapr2025.com"
                className="bg-white text-blue-500 font-bold py-2 px-6 rounded hover:bg-gray-100 transition"
              >
                Return Home
              </a>
            </div>
          ) : (
            <>
              <h1 className="md:text-4xl text-2xl font-extrabold mb-4 text-[#2f3644]">
                Accommodation Booking Form
              </h1>
              <p className="mb-6 text-gray-600">
                Hotel Leela (In-House Accommodation)
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-[13px]">
                  <label
                    htmlFor="delegateType"
                    className="block text-gray-700 font-medium pb-2 text-sm"
                  >
                    Delegate Type
                  </label>
                  <select
                    id="delegateType"
                    name="delegateType"
                    value={formData.delegateType}
                    onChange={(e) => handleSelectChange("delegateType", e.target.value)}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    required
                  >
                    {delegateTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[13px]">
                  <label
                    htmlFor="roomType"
                    className="block text-gray-700 font-medium pb-2 text-sm"
                  >
                    Room Type
                  </label>
                  <select
                    id="roomType"
                    name="roomType"
                    value={formData.roomType}
                    onChange={(e) => handleSelectChange("roomType", e.target.value)}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    required
                  >
                    {roomTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {formData.roomType === "Twin Sharing" && (
                    <div className="mt-4">
                      <label
                        htmlFor="twinSharingDelegateName"
                        className="block text-gray-700 font-medium pb-2 text-sm"
                      >
                        Twin Sharing Delegate Name (Optional)
                      </label>
                      <input
                        id="twinSharingDelegateName"
                        name="twinSharingDelegateName"
                        value={formData.twinSharingDelegateName}
                        onChange={handleInputChange}
                        className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Enter delegate name if you have made mutual arrangements"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Please add name of delegate if you have made mutual arrangements with another delegate. 
                        Otherwise, you will be matched with the best possible option available.
                      </p>
                    </div>
                  )}
                </div>

                {/* Row: Title & Full Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
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
                    <label
                      htmlFor="fullName"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
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

                {/* Row: Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
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
                    <label
                      htmlFor="phone"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      placeholder="+91999999999 or +15555555555"
                      type="tel"
                      onChange={handleInputChange}
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      required
                      pattern="^\+?[0-9]{7,15}$"
                      title="Please enter a valid international phone number (7-15 digits, optional leading +)"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Row: City & Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      onChange={handleInputChange}
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      required
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      onChange={handleInputChange}
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      required
                    />
                    {errors.country && (
                      <p className="text-red-500 text-xs">{errors.country}</p>
                    )}
                  </div>
                </div>

                {/* Row: Pincode */}
                <div className="text-[13px]">
                  <label
                    htmlFor="pincode"
                    className="block text-gray-700 font-medium pb-2 text-sm"
                  >
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    onChange={handleInputChange}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    required
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs">{errors.pincode}</p>
                  )}
                </div>

                {/* Row: Address */}
                <div className="text-[13px]">
                  <label
                    htmlFor="address"
                    className="block text-gray-700 font-medium pb-2 text-sm"
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    onChange={handleInputChange}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    required
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs">{errors.address}</p>
                  )}
                </div>

                {/* Row: Check-in & Check-out dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <label
                      htmlFor="checkInDate"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
                      Check-in Date
                    </label>
                    <input
                      id="checkInDate"
                      name="checkInDate"
                      type="date"
                      onChange={handleInputChange}
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      required
                    />
                    {errors.checkInDate && (
                      <p className="text-red-500 text-xs">{errors.checkInDate}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="checkOutDate"
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
                      Check-out Date
                    </label>
                    <input
                      id="checkOutDate"
                      name="checkOutDate"
                      type="date"
                      onChange={handleInputChange}
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      required
                    />
                    {errors.checkOutDate && (
                      <p className="text-red-500 text-xs">{errors.checkOutDate}</p>
                    )}
                  </div>
                </div>

                

                {/* Row: Total Amount */}
                <div className="text-[13px]">
                  <label className="block text-gray-700 font-medium pb-2 text-sm">
                    Total Amount Payable
                  </label>
                  <div className="text-2xl font-bold">
                    {totalAmount?.amount > 0
                      ? totalAmount.currency === "INR"
                        ? `₹${(totalAmount.amount / 100).toLocaleString()}`
                        : `$${(totalAmount.amount / 100).toLocaleString()}`
                      : "Select dates to calculate amount"}
                  </div>
                  {totalAmount?.numberOfDays > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      <p>{getDailyRateText()} per night × {totalAmount.numberOfDays} night{totalAmount.numberOfDays > 1 ? 's' : ''}</p>
                      <p className="font-semibold">
                        {formData.delegateType} - {formData.roomType}
                      </p>
                    </div>
                  )}
                </div>

                {/* Row: Cancellation Policy */}
                <div className="text-[13px] text-gray-500">
                  <h3 className="font-semibold">Cancellation Policy:</h3>
                  <p>
                    Refund will be provided with written notification against the original
                    booking receipt only if applied before 15 July 2025.
                  </p>
                  <p>Post 15 July 2025, no refund will be made.</p>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={totalAmount?.amount <= 0}
                    className={`w-full font-semibold transition text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      totalAmount?.amount > 0 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {totalAmount?.amount > 0 ? 'Pay Now' : 'Select dates to continue'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        <ToastContainer />
      </div>
    )}
    </>
  );
}