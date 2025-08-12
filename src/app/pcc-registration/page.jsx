'use client'
import Head from 'next/head'
import { useState } from 'react'
import PCCCard from './PCCCard'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { PCC_DATA } from './PCC' 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

    

export default function PCCPage() {
  const [loadingCode, setLoadingCode] = useState(null)

  // Open Razorpay checkout. This assumes your backend returns { orderId, amount, razorpayKey }
  async function handleRegister(course) {
    try {
      setLoadingCode(course.code)
      // call our Next.js API route which should create the Razorpay order and return order details
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: course.fee * 100, courseCode: course.code, courseTitle: course.title })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create order')

      // dynamically load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve
          s.onerror = reject
          document.body.appendChild(s)
        })
      }

      const options = {
        key: data.razorpayKey, // your Razorpay Key ID from backend
        amount: data.amount, // in paise
        currency: 'INR',
        name: 'Conference PCC Registration',
        description: course.title,
        order_id: data.orderId,
        handler: function (response) {
          // on successful payment, you will receive razorpay_payment_id, razorpay_order_id, razorpay_signature
          // You should verify the payment on the server side.
          alert('Payment successful! Payment ID: ' + response.razorpay_payment_id)
        },
        prefill: {
          // You can prefill name/email/phone here if you have them
        },
        theme: {
          color: '#0ea5a1' // teal-ish
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error(err)
      alert('Could not start payment: ' + (err.message || err))
    } finally {
      setLoadingCode(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-[#3A64B0] text-white py-4 sm:px-1 px-8">
        <div className="flex flex-col items-center w-full">
          <Link href={"https://iadrapr2025.com"} className='w-full max-w-lg'>
          <div
            className="p-4 flex justify-start md:h-36 h-20  "
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
          <h1 className="sm:text-4xl text-2xl font-bold mt-4">Pre-Conference Courses</h1>
          <p className="mt-2 sm:text-lg text-md text-center max-w-3xl">
            Enhance your skills with our comprehensive hands-on courses led by renowned experts.
          </p>
          <div className="flex flex-wrap justify-center sm:text-base text-sm gap-6 mt-8 mb-5 text-blue-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                <span>Multiple Sessions Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Full Day & Half Day Options</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Expert-Led Sessions</span>
              </div>
            </div>
        </div>
      </header>

       <main className="max-w-full mx-auto px-10 sm:px-10 lg:px-20 sm:py-16 py-10">
        <div className="text-center mb-12">
          <h2 className="sm:text-3xl text-lg text-[#182f59] font-bold text-conference-navy mb-4">
            Available Courses
          </h2>
          <p className="sm:text-lg text-sm text-[#234686] text-conference-gray max-w-2xl mx-auto font-semibold">
            Choose from our carefully curated selection of professional development courses. 
            All fees include GST and convenience charges.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
      {PCC_DATA.map((course) => (
        <PCCCard key={course.code} {...course} />
      ))}
    </div>
      </main>
    </main>
  )
}

/* -----------------------------------------------------------------------------
  Backend stub: place this as /pages/api/create-order.js (or in /app/api if using app router)
  -----------------------------------------------------------
  // pages/api/create-order.js
  import Razorpay from 'razorpay'

  export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

    const { amount, courseCode, courseTitle } = req.body

    // initialize Razorpay with your keys (store keys in environment variables)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    try {
      const options = {
        amount: amount, // in paise
        currency: 'INR',
        receipt: `rcpt_${courseCode}_${Date.now()}`,
        payment_capture: 1
      }
      const order = await razorpay.orders.create(options)
      return res.status(200).json({ orderId: order.id, amount: order.amount, razorpayKey: process.env.RAZORPAY_KEY_ID })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Failed to create order' })
    }
  }

  Notes:
  - Verify payments server-side after the Razorpay handler sends payment details.
  - Keep your Razorpay keys in environment variables and never commit them.

  -----------------------------------------------------------------------------*/
