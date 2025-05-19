"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Link from "next/link";

// Predefined options
const titles = ["Mr.", "Mrs.", "Ms.", "Dr."];
const delegateTypes = ["Indian Delegate", "International Delegate"];
const roomTypes = ["Twin Sharing", "Single Occupancy"];
const paymentModes = ["online", "offline"];

export default function AdminAccommodationsPage() {
  const router = useRouter();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // New entry states
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryData, setNewEntryData] = useState({
    title: "Mr.",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    pincode: "",
    address: "",
    delegateType: delegateTypes[0],
    roomType: roomTypes[0],
    checkInDate: "",
    checkOutDate: "",
    specialRequests: "",
    amountPaid: "",
    currency: "INR",
    paymentId: "",
    paymentMode: "online",
  });

  // Check for admin login on mount. If not logged in, redirect to login.
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleDownloadExcel = () => {
    const dataToExport = accommodations.map(({ _id, __v, ...rest }) => ({
      ...rest,
      checkInDate: new Date(rest.checkInDate).toLocaleDateString(),
      checkOutDate: new Date(rest.checkOutDate).toLocaleDateString(),
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accommodations");
    XLSX.writeFile(workbook, "Accommodation_Bookings.xlsx");
  };

  // Fetch accommodations from API
  const fetchAccommodations = async () => {
    try {
      const res = await fetch("/api/accommodation");
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        // Sort accommodations by created date in descending order (assuming there's a createdAt field)
        const sortedAccommodations = data.accommodations.sort(
          (a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
        );
        setAccommodations(sortedAccommodations);
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
    fetchAccommodations();
  }, []);

  // Delete an accommodation by its ID
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this accommodation booking?")) return;
    try {
      const res = await fetch(`/api/accommodations?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAccommodations((prev) => prev.filter((acc) => acc._id !== id));
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  // Start editing an accommodation
  const handleEdit = (accommodation) => {
    // Format dates for input fields
    const formattedData = {
      ...accommodation,
      checkInDate: accommodation.checkInDate
        ? new Date(accommodation.checkInDate).toISOString().split('T')[0]
        : "",
      checkOutDate: accommodation.checkOutDate
        ? new Date(accommodation.checkOutDate).toISOString().split('T')[0]
        : "",
    };
    setEditingId(accommodation._id);
    setEditData(formattedData);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle changes in edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Save updated accommodation data
  const handleSaveEdit = async () => {
    try {
      const updatedData = { 
        ...editData, 
        amountPaid: parseFloat(editData.amountPaid) || 0,
        currency: editData.currency || "INR"
      };
  
      const res = await fetch("/api/accommodations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
  
      const data = await res.json();
      if (data.success) {
        setAccommodations((prev) =>
          prev.map((acc) => (acc._id === editingId ? data.accommodation : acc))
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
  
    const updatedData = {
      ...newEntryData,
      amountPaid: parseFloat(newEntryData.amountPaid) || 0,
      currency: newEntryData.currency,
    };
  
    try {
      const res = await fetch("/api/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
  
      const data = await res.json();
      if (data.success) {
        await fetchAccommodations(); // Fetch all accommodations again
        setIsAdding(false);
        setNewEntryData({
          title: "Mr.",
          fullName: "",
          email: "",
          phone: "",
          city: "",
          country: "",
          pincode: "",
          address: "",
          delegateType: delegateTypes[0],
          roomType: roomTypes[0],
          checkInDate: "",
          checkOutDate: "",
          specialRequests: "",
          amountPaid: "",
          currency: "INR",
          paymentId: "",
          paymentMode: "online",
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

  // Filter accommodations by search query (fullName, email, phone)
  const filteredAccommodations = accommodations.filter((acc) => {
    const query = searchQuery.toLowerCase();
    return (
      acc.fullName?.toLowerCase().includes(query) ||
      acc.email?.toLowerCase().includes(query) ||
      acc.phone?.toLowerCase().includes(query) ||
      (acc.paymentId && acc.paymentId.toLowerCase().includes(query)) ||
      acc.paymentMode?.toLowerCase().includes(query)
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
        <h1 className="text-3xl font-bold">Accommodation Bookings</h1>
        <div className="flex gap-x-4">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-green-600 text-white px-4 py-2 font-semibold rounded"
          >
            Add New Booking
          </button>
          <button
            onClick={handleDownloadExcel}
            className="bg-blue-600 text-white px-4 py-2 font-semibold rounded"
          >
            Download Excel
          </button>
          <Link href="/admin">
            <button className="bg-gray-600 text-white px-4 py-2 font-semibold rounded hover:bg-gray-700 transition">
              Back to Registrations
            </button>
          </Link>
        </div>
      </div>
      <div className="my-2 pb-4 text-sm font-semibold">
        <p>Showing Bookings: {filteredAccommodations.length} out of {accommodations.length}</p>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Name, Email, Phone, or Payment ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full md:w-1/3 rounded"
        />
      </div>

      {/* New Entry Form */}
      {isAdding && (
        <div className="mb-6 border border-gray-300 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Add New Accommodation Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="title"
              value={newEntryData.title}
              onChange={handleNewEntryChange}
              className="border p-2"
            >
              {titles.map((title, index) => (
                <option key={index} value={title}>
                  {title}
                </option>
              ))}
            </select>
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
              type="email"
              name="email"
              placeholder="Email"
              value={newEntryData.email}
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
              type="text"
              name="city"
              placeholder="City"
              value={newEntryData.city}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={newEntryData.country}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            />
            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={newEntryData.pincode}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            />
            <textarea
              name="address"
              placeholder="Address"
              value={newEntryData.address}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            />
            {/* Select for Delegate Type */}
            <select
              name="delegateType"
              value={newEntryData.delegateType}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              {delegateTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {/* Select for Room Type */}
            <select
              name="roomType"
              value={newEntryData.roomType}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              {roomTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {/* Check-in Date */}
            <div>
              <label className="block text-sm mb-1">Check-in Date</label>
              <input
                type="date"
                name="checkInDate"
                value={newEntryData.checkInDate}
                onChange={handleNewEntryChange}
                className="border p-2 w-full"
                required
              />
            </div>
            {/* Check-out Date */}
            <div>
              <label className="block text-sm mb-1">Check-out Date</label>
              <input
                type="date"
                name="checkOutDate"
                value={newEntryData.checkOutDate}
                onChange={handleNewEntryChange}
                className="border p-2 w-full"
                required
              />
            </div>
            {/* Special Requests */}
            <textarea
              name="specialRequests"
              placeholder="Special Requests"
              value={newEntryData.specialRequests}
              onChange={handleNewEntryChange}
              className="border p-2"
            />
            {/* Amount Paid */}
            <input
              type="number"
              name="amountPaid"
              placeholder="Amount Paid"
              value={newEntryData.amountPaid}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            />
            {/* Select Currency */}
            <select
              name="currency"
              value={newEntryData.currency}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
            {/* Payment Mode */}
            <select
              name="paymentMode"
              value={newEntryData.paymentMode}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              {paymentModes.map((mode, index) => (
                <option key={index} value={mode}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
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
                "Save New Booking"
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

      {/* Accommodations Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border border-gray-300">Title</th>
              <th className="px-4 py-2 border border-gray-300">Full Name</th>
              <th className="px-4 py-2 border border-gray-300">Email</th>
              <th className="px-4 py-2 border border-gray-300">Phone</th>
              <th className="px-4 py-2 border border-gray-300">City</th>
              <th className="px-4 py-2 border border-gray-300">Country</th>
              <th className="px-4 py-2 border border-gray-300">Pincode</th>
              <th className="px-4 py-2 border border-gray-300">Address</th>
              <th className="px-4 py-2 border border-gray-300">Delegate Type</th>
              <th className="px-4 py-2 border border-gray-300">Room Type</th>
              <th className="px-4 py-2 border border-gray-300">Check-in Date</th>
              <th className="px-4 py-2 border border-gray-300">Check-out Date</th>
              <th className="px-4 py-2 border border-gray-300">Special Requests</th>
              <th className="px-4 py-2 border border-gray-300">Amount Paid</th>
              <th className="px-4 py-2 border border-gray-300">Currency</th>
              <th className="px-4 py-2 border border-gray-300">Payment Mode</th>
              <th className="px-4 py-2 border border-gray-300">Payment ID</th>
              <th className="px-4 py-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccommodations.map((acc) => (
              <tr key={acc._id} className="text-[13px]">
                {/* Title */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <select
                      name="title"
                      value={editData.title || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    >
                      {titles.map((title, idx) => (
                        <option key={idx} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    acc.title || "N/A"
                  )}
                </td>
                {/* Full Name */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="text"
                      name="fullName"
                      value={editData.fullName || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.fullName
                  )}
                </td>
                {/* Email */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="email"
                      name="email"
                      value={editData.email || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.email
                  )}
                </td>
                {/* Phone */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editData.phone || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.phone
                  )}
                </td>
                {/* City */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="text"
                      name="city"
                      value={editData.city || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.city
                  )}
                </td>
                {/* Country */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="text"
                      name="country"
                      value={editData.country || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.country
                  )}
                </td>
                {/* Pincode */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="text"
                      name="pincode"
                      value={editData.pincode || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.pincode
                  )}
                </td>
                {/* Address */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="text"
                      name="address"
                      value={editData.address || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.address
                  )}
                </td>
                {/* Delegate Type */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <select
                      name="delegateType"
                      value={editData.delegateType || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                      required
                    >
                      {delegateTypes.map((type, idx) => (
                        <option key={idx} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    acc.delegateType
                  )}
                </td>
                {/* Room Type */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <select
                      name="roomType"
                      value={editData.roomType || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                      required
                    >
                      {roomTypes.map((type, idx) => (
                        <option key={idx} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    acc.roomType
                  )}
                </td>
                {/* Check-in Date */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="date"
                      name="checkInDate"
                      value={editData.checkInDate || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    new Date(acc.checkInDate).toLocaleDateString()
                  )}
                </td>
                {/* Check-out Date */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="date"
                      name="checkOutDate"
                      value={editData.checkOutDate || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    new Date(acc.checkOutDate).toLocaleDateString()
                  )}
                </td>
                {/* Special Requests */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <textarea
                      name="specialRequests"
                      value={editData.specialRequests || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.specialRequests || "N/A"
                  )}
                </td>
                {/* Amount Paid */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="number"
                      name="amountPaid"
                      value={editData.amountPaid || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : acc.amountPaid !== undefined ? (
                    `${acc.currency === "USD" ? "$" : "₹"}${acc.amountPaid}`
                  ) : (
                    "N/A"
                  )}
                </td>
                {/* Currency */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <select
                      name="currency"
                      value={editData.currency || "INR"}
                      onChange={handleEditChange}
                      className="border p-1"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  ) : (
                    acc.currency || "INR"
                  )}
                </td>
                {/* Payment Mode */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <select
                      name="paymentMode"
                      value={editData.paymentMode || "online"}
                      onChange={handleEditChange}
                      className="border p-1"
                    >
                      {paymentModes.map((mode, idx) => (
                        <option key={idx} value={mode}>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (acc.paymentMode && acc.paymentMode.charAt(0).toUpperCase() + acc.paymentMode.slice(1)) || "N/A"
                  )}
                </td>
                {/* Payment ID */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
                    <input
                      type="text"
                      name="paymentId"
                      value={editData.paymentId || ""}
                      onChange={handleEditChange}
                      className="border p-1"
                    />
                  ) : (
                    acc.paymentId || "N/A"
                  )}
                </td>
                {/* Actions */}
                <td className="px-4 py-2 border border-gray-300">
                  {editingId === acc._id ? (
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
                        onClick={() => handleEdit(acc)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(acc._id)}
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