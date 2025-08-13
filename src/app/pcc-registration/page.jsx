'use client'
import { useState, useEffect } from 'react'
import PCCCard from './PCCCard'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { PCC_DATA } from './PCC' 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

    

export default function PCCPage() {1
  const [courseData, setCourseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeatCounts() {
      try {
        const updatedCourses = await Promise.all(
          PCC_DATA.map(async (course) => {
            try {
              const res = await fetch(`/api/pcc-register/${course.code}/count`);
              const data = await res.json();
              return {
                ...course,
                seatsAvailable: data.success ? data.seatsAvailable : 0
              };
            } catch {
              return { ...course, seatsAvailable: 0 };
            }
          })
        );
        setCourseData(updatedCourses);
      } finally {
        setLoading(false);
      }
    }
    fetchSeatCounts();
  }, []);


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
          {/* Course Selection Rules */}
            <div className="mt-4 px-5 py-4 text-sm font-semibold bg-white text-red-600 rounded-md shadow-md max-w-3xl">
              <h2 className="font-bold text-base mb-2">Note:</h2>
              <p className="mb-2">You may register for:</p>
              <ul className="list-disc list-inside mb-2">
                <li>One Morning Half course and/or one Afternoon Half course, OR</li>
                <li>One Full-Day course</li>
              </ul>
              <p className="font-semibold">Please note:</p>
              <ul className="list-disc list-inside">
                <li>You cannot register for more than one Morning Half course.</li>
                <li>You cannot register for more than one Afternoon Half course.</li>
                <li>A Full-Day course takes the entire day, so you cannot take any other course on that day.</li>
              </ul>
            </div>

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
         {loading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[...Array(PCC_DATA.length)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg p-4 animate-strongPulse h-96"
              >
                <div className="h-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {PCC_DATA.map((course) => (
            <PCCCard key={course.code} {...course} />
          ))}
        </div>
        )}
      </main>
    </main>
  )
}


