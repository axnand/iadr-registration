"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for admin login on mount. If not logged in, redirect to login.
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [router]);

  // Fetch registrations from API
  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const res = await fetch("/api/registrations");
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        const data = await res.json();
        if (data.success) {
          setRegistrations(data.registrations);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistrations();
  }, []);

  // Logout function clears the admin flag and redirects to login page.
  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin/login");
  };
  console.log("register", registrations);
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="border-t-transparent border-[#377DFF] w-8 h-8 border-4 border-solid rounded-full animate-spin"></div>
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 pt-14 px-16 text-[13px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Registrations</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 font-semibold rounded"
        >
          Logout
        </button>
      </div>
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border border-gray-300">Full Name</th>
            <th className="px-4 py-2 border border-gray-300">Email</th>
            <th className="px-4 py-2 border border-gray-300">Phone</th>
            <th className="px-4 py-2 border border-gray-300">City</th>
            <th className="px-4 py-2 border border-gray-300">Country</th>
            <th className="px-4 py-2 border border-gray-300">Category</th>
            <th className="px-4 py-2 border border-gray-300">Event Type</th>
            <th className="px-4 py-2 border border-gray-300">Payment ID</th>
            <th className="px-4 py-2 border border-gray-300">Accompanying Persons</th>
            <th className="px-4 py-2 border border-gray-300">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr key={reg._id} className="text-[13px]">
              <td className="px-4 py-2 border border-gray-300">{reg.fullName}</td>
              <td className="px-4 py-2 border border-gray-300">{reg.email}</td>
              <td className="px-4 py-2 border border-gray-300">{reg.phone}</td>
              <td className="px-4 py-2 border border-gray-300">{reg.city}</td>
              <td className="px-4 py-2 border border-gray-300">{reg.country}</td>
              <td className="px-4 py-2 border border-gray-300">{reg.category}</td>
              <td className="px-4 py-2 border border-gray-300">{reg.eventType}</td>
              <td className="px-4 py-2 border border-gray-300">
                {reg.paymentId || "N/A"}
              </td>
              <td className="px-4 py-2 border border-gray-300">
  {reg.accompanyingPersons && reg.accompanyingPersons.length > 0
    ? `${reg.numberOfAccompanying} (${reg.accompanyingPersons.map((person) => person.name).join(", ")})`
    : "N/A"}
</td>
              <td className="px-4 py-2 border border-gray-300">
                {new Date(reg.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
