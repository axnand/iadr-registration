"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Link from "next/link";

const courseCodes = ["F1", "M1", "M2", "M3", "M4", "A1", "A2", "A3", "A4"];

const courseNames = [
  "AI-integrated scientific research writing: From research question to publication",
  "Understanding the systematic review and meta-analysis",
  "Transforming Academic Research Into Journal Publications: A Practical Approach",
  "Pediatric Rotary Endodontics & Space Maintainer Fabrication",
  "Immediate Loading Implants",
  "Applications of Diode Lasers in Dental Practice",
  "Impression & Temporization",
  "Inhalation Sedation",
  "Anterior Direct Composite Veneers"
];

export default function AdminPCCRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // New entry states
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryData, setNewEntryData] = useState({
    fullName: "",
    phone: "",
    email: "",
    courseName: courseNames[0] || "",
    courseCode: courseCodes[0] || "",
    paymentId: "",
    amount: "",
  });

  // Check for admin login on mount. If not logged in, redirect to login.
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleDownloadExcel = () => {
    const dataToExport = registrations.map(({ _id, __v, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PCC Registrations");
    XLSX.writeFile(workbook, "PCC_Registrations.xlsx");
  };

  // Fetch registrations from API
  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/pcc-register");
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        // Sort registrations by createdAt in descending order
        const sortedRegistrations = data.registrations.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        console.log("data",data);
        setRegistrations(sortedRegistrations);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Call the function inside useEffect on component mount
  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin/login");
  };

  // Delete a registration by its ID
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this PCC registration?")) return;
    try {
      const res = await fetch(`/api/pcc-register?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) => prev.filter((reg) => reg._id !== id));
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  // Start editing a registration
  const handleEdit = (registration) => {
    setEditingId(registration._id);
    setEditData(registration);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle changes in edit form for regular fields
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Save updated registration data
  const handleSaveEdit = async () => {
    try {
      const res = await fetch("/api/pcc-register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((reg) => (reg._id === editingId ? data.registration : reg))
        );
        setEditingId(null);
        setEditData({});
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (err) {
      alert("Error updating: " + err.message);
    }
  };

  // New entry handlers
  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntryData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewEntry = async () => {
    setIsSaving(true);

    try {
      const res = await fetch("/api/pcc-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntryData),
      });

      const data = await res.json();
      if (data.success) {
        await fetchRegistrations(); // Fetch all registrations again
        setIsAdding(false);
        setNewEntryData({
          fullName: "",
          phone: "",
          email: "",
          courseName: courseNames[0] || "",
          courseCode: courseCodes[0] || "",
          paymentId: "",
          amount: "",
        });
      } else {
        alert("Add entry failed: " + data.error);
      }
    } catch (err) {
      alert("Error adding entry: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter registrations by search query (fullName, email, phone, courseCode, or paymentId)
  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    return (
      reg.fullName.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.phone.toLowerCase().includes(query) ||
      reg.courseCode.toLowerCase().includes(query) ||
      reg.courseName.toLowerCase().includes(query) ||
      (reg.paymentId && reg.paymentId.toLowerCase().includes(query))
    );
  });

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="border-t-transparent border-[#377DFF] w-8 h-8 border-4 border-solid rounded-full animate-spin"></div>
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      {isSaving ? (
        <div className="min-h-screen flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        </div>
      ) : (
        <div className="p-4 pt-14 md:mx-auto text-[13px]">
          <div className="flex md:flex-row flex-col md:justify-between md:items-center mb-6 gap-y-4">
            <h1 className="text-3xl font-bold">PCC Registrations</h1>
            <div className="flex gap-x-4">
              <button
                onClick={() => setIsAdding(true)}
                className="bg-green-600 text-white px-4 py-2 font-semibold rounded"
              >
                Add New Entry
              </button>
              <button
                onClick={handleDownloadExcel}
                className="bg-blue-600 text-white px-4 py-2 font-semibold rounded"
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="my-2 pb-4 text-sm font-semibold ">
            <p>Showing PCC Registrations: {filteredRegistrations.length} out of {registrations.length}</p>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by Name, Email, Phone, Course Code, Course Name, or Payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border p-2 w-full md:w-1/3 rounded"
            />
          </div>

          {/* New Entry Form */}
          {isAdding && (
            <div className="mb-6 border border-gray-300 p-4 rounded">
              <h2 className="text-xl font-bold mb-4">Add New PCC Registration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={newEntryData.fullName}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={newEntryData.phone}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newEntryData.email}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                  required
                />
                {/* Select for Course Code */}
                <select
                  name="courseCode"
                  value={newEntryData.courseCode}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                  required
                >
                  {courseCodes.map((code, index) => (
                    <option key={index} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                {/* Select for Course Name */}
                <select
                  name="courseName"
                  value={newEntryData.courseName}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                  required
                >
                  {courseNames.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {/* Payment ID */}
                <input
                  type="text"
                  name="paymentId"
                  placeholder="Payment ID"
                  value={newEntryData.paymentId}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                />
                {/* Amount */}
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={newEntryData.amount}
                  onChange={handleNewEntryChange}
                  className="border p-2"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="mt-4 flex gap-x-4">
                <button
                  onClick={handleAddNewEntry}
                  className="bg-green-600 text-white px-4 py-2 font-semibold rounded flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    "Save New Entry"
                  )}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="bg-gray-600 text-white px-4 py-2 font-semibold rounded"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Registrations Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border border-gray-300">Full Name</th>
                  <th className="px-4 py-2 border border-gray-300">Phone</th>
                  <th className="px-4 py-2 border border-gray-300">Email</th>
                  <th className="px-4 py-2 border border-gray-300">Course Code</th>
                  <th className="px-4 py-2 border border-gray-300">Course Name</th>
                  <th className="px-4 py-2 border border-gray-300">Payment ID</th>
                  <th className="px-4 py-2 border border-gray-300">Amount</th>
                  <th className="px-4 py-2 border border-gray-300">Registered At</th>
                  <th className="px-4 py-2 border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg._id} className="text-[13px]">
                    {/* Full Name */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <input
                          type="text"
                          name="fullName"
                          value={editData.fullName || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                        />
                      ) : (
                        reg.fullName
                      )}
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <input
                          type="tel"
                          name="phone"
                          value={editData.phone || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                        />
                      ) : (
                        reg.phone
                      )}
                    </td>
                    {/* Email */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <input
                          type="email"
                          name="email"
                          value={editData.email || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                        />
                      ) : (
                        reg.email
                      )}
                    </td>
                    {/* Course Code */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <select
                          name="courseCode"
                          value={editData.courseCode || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                          required
                        >
                          {courseCodes.map((code, idx) => (
                            <option key={idx} value={code}>
                              {code}
                            </option>
                          ))}
                        </select>
                      ) : (
                        reg.courseCode
                      )}
                    </td>
                    {/* Course Name */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <select
                          name="courseName"
                          value={editData.courseName || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                          required
                        >
                          {courseNames.map((name, idx) => (
                            <option key={idx} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="max-w-xs truncate" title={reg.courseName}>
                          {reg.courseName}
                        </div>
                      )}
                    </td>
                    {/* Payment ID */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <input
                          type="text"
                          name="paymentId"
                          value={editData.paymentId || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                          placeholder="Payment ID"
                        />
                      ) : (
                        reg.paymentId || "-"
                      )}
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <input
                          type="number"
                          name="amount"
                          value={editData.amount || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                          placeholder="Amount"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        reg.amount ? `₹${reg.amount}` : "-"
                      )}
                    </td>
                    {/* Registered At */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <input
                          type="text"
                          name="createdAt"
                          value={new Date(editData.createdAt).toLocaleString() || ""}
                          onChange={handleEditChange}
                          className="border p-1"
                          disabled
                        />
                      ) : (
                        new Date(reg.createdAt).toLocaleString()
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-2 border border-gray-300">
                      {editingId === reg._id ? (
                        <div className="flex flex-col gap-y-1">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 text-white px-2 py-1 mr-2 rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-y-1">
                          <button
                            onClick={() => handleEdit(reg)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(reg._id)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}