"use client";

import React, { useState, useEffect } from "react";
import { calculateTotalAmount } from "./pricing-logic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ------------------ Actual Registration Form ------------------ //

const titles = ["Mr.", "Mrs.", "Ms.", "Dr.","Prof."];
const iadrCategories = [
  "ISDR Member",
  "Non-Member (Delegate)",
  "Student (ISDR Member)",
  "Student (Non-Member)",
  "International Delegate (IADR Member)",
  "International Delegate (Non-IADR Member)",
  // "Domestic Student Presenting Paper",
];

const WW9ComboCategories = [
  "Indian IADR APR delegate",
  "International IADR APR delegate",
];

const eventTypes = [
  "IADR-APR",
];

const accompanyingOptions = ["No", "Yes"];

export default function RegistrationForm() {
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
    eventType: "IADR-APR",
    category: iadrCategories[0],
    accompanying: "No",
    numberOfAccompanying: 0,
    accompanyingPersons: [],
    couponCode: "",
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");


  // Recalculate total based on pricing logic
  useEffect(() => {
    async function updateTotal() {
      if (!formData.category || !formData.eventType) {
        setTotalAmount({ amount: 0, currency: "INR" });
        return;
      }

      const calculatedTotal = await calculateTotalAmount(
        formData.category,
        formData.eventType,
        formData.numberOfAccompanying,
        new Date(),
        appliedCoupon 
      );

      setTotalAmount(calculatedTotal);
      console.log(calculatedTotal);
    }
    updateTotal();
  }, [formData.category, formData.eventType, formData.numberOfAccompanying, appliedCoupon]);

  

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
    if (name === "eventType") {
      // When eventType changes, set a valid default category immediately.
      setFormData((prev) => ({
        ...prev,
        eventType: value,
        category: value === "IADR-APR" ? iadrCategories[0] : WW9ComboCategories[0],
      }));
      resetCoupon();
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      resetCoupon();
    }
  };

  const resetCoupon = () => {
    if (couponApplied) {
      setCouponInput("");
      setAppliedCoupon("");
      setCouponApplied(false);
      setCouponMessage("");
      toast.info("Coupon removed due to category change.");
    }
  };

    const handleApplyCoupon = () => {
    const couponCode = couponInput.trim().toUpperCase();

    if (couponCode === "IADR2025" && 
        (formData.category === "International Delegate (IADR Member)" || 
         formData.category === "International Delegate (Non-IADR Member)")) {
      setCouponApplied(true);
      setAppliedCoupon(couponCode);
      setCouponMessage("Coupon applied successfully! Special discount for International Delegates.");
      toast.success("Coupon applied successfully!");
    } else if (couponCode === "IADR2025") {
      setAppliedCoupon("");
      setCouponApplied(false);
      setCouponMessage("This coupon is only valid for International Delegate categories.");
      toast.error("This coupon is only valid for International Delegate categories.");
    } else if (couponCode === "") {
      setAppliedCoupon("");
      setCouponApplied(false);
      setCouponMessage("Please enter a coupon code.");
      toast.error("Please enter a coupon code.");
    } else {
      setAppliedCoupon("");
      setCouponApplied(false);
      setCouponMessage("Invalid coupon code. Please check and try again.");
      toast.error("Invalid coupon code. Please check and try again.");
    }
  };

    const handleRemoveCoupon = () => {
    setAppliedCoupon("");
    setFormData((prev) => ({ ...prev, couponCode: "" }));
    setCouponApplied(false);
    setCouponMessage("");
    toast.info("Coupon removed.");
  };

  // If category includes "International Delegate", force accompanying count to 1.
  const handleAccompanyingChange = (value) => {
    setFormData((prev) => {
      const isInternational =
        prev.category && prev.category.includes("International Delegate");
      return {
        ...prev,
        accompanying: value,
        numberOfAccompanying: value === "Yes" ? (isInternational ? 1 : prev.numberOfAccompanying || 1) : 0,
        accompanyingPersons: value === "Yes" ? [{ name: "" }] : [],
      };
    }); 
  };

  const handleAccompanyingPersonChange = (index, value) => {
    setFormData((prev) => {
      const newAccompanyingPersons = [...prev.accompanyingPersons];
      newAccompanyingPersons[index] = { name: value };
      return { ...prev, accompanyingPersons: newAccompanyingPersons };
    });
  };

  const handleNumberOfAccompanyingChange = (value) => {
    const inputNumber = Number.parseInt(value, 10);
    // If category is International Delegate, force accompanying number to 1.
    const finalNumber =
      formData.category && formData.category.includes("International Delegate")
        ? 1
        : inputNumber;
    setFormData((prev) => {
      const newAccompanyingPersons = Array.from({ length: finalNumber }, (_, i) => {
        return prev.accompanyingPersons[i] || { name: "" };
      });
      return {
        ...prev,
        numberOfAccompanying: finalNumber,
        accompanyingPersons: newAccompanyingPersons,
      };
    });
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
      newErrors.country = "Nationality is required";
    }
  
    if (isEmpty(formData.address)) {
      newErrors.address = "Address is required";
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
  
    const { amount, currency } = await calculateTotalAmount(
      formData.category,
      formData.eventType,
      formData.numberOfAccompanying,
      new Date(),
      appliedCoupon
    );

    // const amount = 100;
    // const currency = "INR";
  
    // Create order on your server with the fixed amount
    let orderData;
    try {
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency }),
      });
      orderData = await orderResponse.json();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error creating order. Please try again.");
      return;
    }
  
    // Configure Razorpay checkout options using the order_id from the API
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY, // Ensure this is your live mode key
      amount, // in paise
      currency,
      order_id: orderData.id, // Order ID returned from your API
      name: "Event Registration",
      description: "Payment for event registration",
      handler: async function (response) {
        toast.success("Payment successful! Razorpay Payment ID: " + response.razorpay_payment_id);
        toast.success("Wait for the Confirmation Mail")

        setLoading(true);
  
        // Submit the registration data along with the payment ID
        const registrationData = {
          ...formData,
          couponCode: appliedCoupon,
          paymentId: response.razorpay_payment_id,
          amountPaid: amount / 100, 
          currency,
          couponApplied: couponApplied,
        };
  
        try {
          const res = await fetch("/api/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registrationData),
          });
          const data = await res.json();
          if (data.success) {
            setRegistrationComplete(true);
            toast.success("Registration successful!");
            setLoading(false);
          } else {
            toast.error("Payment succeeded, but registration failed: " + data.error);
          }
          const emailResponse = await fetch("/api/send-confirmation", {
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
          if (emailResult.response.success) {
            toast.success("Confirmation email sent successfully!");
          } else {
            toast.error("Failed to send confirmation email: " + emailResult.message);
          }
        } catch (error) {
          console.error("Error submitting registration:", error);
          toast.error("Payment succeeded, but registration submission encountered an error.");
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
    <>
    {loading?  (
  <div className="flex justify-center items-center h-screen">
  <div className="border-t-transparent border-[#377DFF] w-8 h-8 border-4 border-solid rounded-full animate-spin"></div>
</div>
):
<div className="w-full h-full font-medium">
      <div className="py-5 shadow-md ">
        <Link href={"https://iadrapr2025.com"}>
          <div
            className="p-4 flex justify-start md:h-24 h-20 w-full "
            style={{
              backgroundImage: 'url(/logo2.png)',
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            {/* Optionally, you can add text or other elements inside the div */}
          </div>
        </Link>
      </div>

      <div className="max-w-2xl mt-6 mx-auto p-4">
        {registrationComplete ? (
          <div className=" flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-extrabold mb-4">
              Thank You for Registering!
            </h1>
            <p className=" mb-8 text-center">
              We have received your registration details. Kindly check for the confirmation mail.
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
            <h1 className="md:text-4xl text-2xl font-extrabold mb-8 text-[#2f3644]">
              Registration Form
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6 ">
            <div className="text-[13px]">
                <label
                  htmlFor="category"
                  className="block text-gray-700 font-medium pb-2 text-sm"
                >
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
                  {formData.eventType === "IADR-APR"
                    ? iadrCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    : WW9ComboCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                </select>
              </div>
              <div className="text-[13px]">
                <label
                  htmlFor="eventType"
                  className="block text-gray-700 font-medium pb-2 text-sm"
                >
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
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              

              {/* Row 1: Title & Full Name */}
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
                    htmlFor="full-name"
                    className="block text-gray-700 font-medium pb-2 text-sm"
                  >
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
                    placeholder="+91 999999999 or +1 5555555555"
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

              {/* Row 3: City & Country */}
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
                    Nationality
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

              {/* Row 4: Pincode */}
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
                  type="number"
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                  required
                />
                {errors.pincode && (
                    <p className="text-red-500 text-xs">{errors.pincode}</p>
                  )}
              </div>

              {/* Row 5: Address */}
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

              {/* Row 9: Accompanying Option */}
              {formData.eventType == "IADR-APR" && <div className="text-[13px]">
                <label
                  htmlFor="accompanying"
                  className="block text-gray-700 font-medium pb-2 text-sm"
                >
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
              </div>}

              {/* Row 10: Number of Accompanying Persons */}
              {formData.accompanying === "Yes" && (
                <div className="text-[13px]">
                  <label
                    htmlFor="numberOfAccompanying"
                    className="block text-gray-700 font-medium pb-2 text-sm"
                  >
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
                    <label
                      htmlFor={`accompanyingPerson${index}`}
                      className="block text-gray-700 font-medium pb-2 text-sm"
                    >
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

                <div className="text-[13px] bg-gray-50 p-4 rounded-lg border">
                <label
                  htmlFor="couponCode"
                  className="block text-gray-700 font-medium pb-2 text-sm"
                >
                  Coupon Code (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="couponCode"
                    name="couponCode"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}  
                    placeholder="Enter coupon code"
                    className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    disabled={couponApplied}
                  />
                  {!couponApplied ? (
                    <button
                      type="button"   
                      onClick={handleApplyCoupon}
                      className="bg-green-600 text-white px-4 py-2 rounded transition font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 whitespace-nowrap"
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 whitespace-nowrap"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`text-xs mt-2 ${couponApplied ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMessage}
                  </p>
                )}
                {couponApplied && (
                  <div className="mt-2 flex items-center text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs font-medium">Coupon Applied Successfully!</span>
                  </div>
                )}
              </div>

              {/* Row 12: Total Amount */}
              <div className="text-[13px]">
                <label className="block text-gray-700 font-medium pb-2 text-sm">
                  Total Amount Payable
                </label>
                <div className="text-2xl font-bold">
                  {totalAmount?.amount > 0 ? (
                    <div>
                      <span>
                        {totalAmount.currency === "INR" 
                          ? `₹${(totalAmount.amount / 100).toFixed(2)}`
                          : `$${(totalAmount.amount / 100).toFixed(2)}`
                        }
                      </span>
                      {totalAmount?  
                        <div className="text-sm text-gray-500 font-normal mt-1">
                          Base Fee: <span className=" font-medium">{totalAmount.baseFee}</span> + 
                          Convenience Fee: <span className=" font-medium">{totalAmount.convenienceFee}</span>
                          {couponApplied && totalAmount.discount && (
                            <>
                              {" "}- Discount: <span className="font-medium text-green-600">{totalAmount.discount}</span>
                            </>
                          )}
                        </div> 
                        :<></>
                      }
                    </div>
                  ) : (
                    "Select a valid category & event"
                  )}
                </div>
              </div>

              {/* Row 13: Cancellation Policy */}
              <div className="text-[13px] text-gray-500">
                <h3 className="font-semibold">Cancellation Policy:</h3>
                <p>
                  Refund will be provided with written notification against original registration receipt only if applied before 15 July 2025. Deduction of Bank, GST and other taxes shall be applicable. 
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
          </>
        )}
      </div>
      <ToastContainer />
    </div>}
    
    </>
  );
}
