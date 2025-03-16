"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// Predefined options
const titles = ["Mr.", "Mrs.", "Ms.", "Dr."];
const categories = [
  "ISDR Member",
  "Non-Member (Delegate)",
  "Student: UG/PG/PhD (ISDR Member)",
  "Student: UG/PG/PhD (Non-Member)",
  "International Delegate (IADR Member)",
  "International Delegate (Non-IADR Member)",
];
const eventTypes = ["WWW9 Meeting", "IADR-APR", "Combo (WWW9 & IADR-APR)", "None"];
const accompanyingOptions = ["No", "Yes"];

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [accompanyingText, setAccompanyingText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  
  // New entry states
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryData, setNewEntryData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    pincode: "",
    address: "",
    category: categories[0] || "",
    eventType: eventTypes[0] || "",
    paymentId: "",
    accompanying: "No",
    numberOfAccompanying: 0, // default value added
    accompanyingPersons: [],
    amountPaid: "",
  currency: "INR", 
  });
  const [newAccompanyingText, setNewAccompanyingText] = useState("");

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
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
  XLSX.writeFile(workbook, "Registrations.xlsx");
  };

  // Fetch registrations from API
  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/registrations");
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        // Sort registrations by createdAt in descending order
        const sortedRegistrations = data.registrations.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
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
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      const res = await fetch(`/api/registrations?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) => prev.filter((reg) => reg._id !== id));
      } else {
        toast.error("Delete failed: " + data.error);
      }
    } catch (err) {
      toast.error("Error deleting: " + err.message);
    }
  };

  // Start editing a registration
  const handleEdit = (registration) => {
    setEditingId(registration._id);
    setEditData(registration);
    if (registration.accompanyingPersons && registration.accompanyingPersons.length > 0) {
      setAccompanyingText(registration.accompanyingPersons.map((p) => p.name).join(", "));
    } else {
      setAccompanyingText("");
    }
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

  // For accompanying persons editing (edit mode)
  const handleAccompanyingTextChange = (e) => {
    setAccompanyingText(e.target.value);
  };

  // On blur, update editData with parsed accompanying persons
  const handleBlurAccompanying = () => {
    const names = accompanyingText
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setEditData((prev) => ({ ...prev, accompanyingPersons: names.map((name) => ({ name })) }));
  };

  // Save updated registration data
  const handleSaveEdit = async () => {
    try {
      const updatedData = { 
        ...editData, 
        amountPaid: parseFloat(editData.amountPaid) || 0, // Ensure it's a number
        currency: editData.currency || "INR" // Ensure currency is set
      };
  
      const res = await fetch("/api/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
  
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((reg) => (reg._id === editingId ? data.registration : reg))
        );
        setEditingId(null);
        setEditData({});
      } else {
        toast.error("Update failed: " + data.error);
      }
    } catch (err) {
      toast.error("Error updating: " + err.message);
    }
  };
  
  

  // New entry handlers
  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntryData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewAccompanyingTextChange = (e) => {
    setNewAccompanyingText(e.target.value);
  };

  const handleNewBlurAccompanying = () => {
    const names = newAccompanyingText
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    // Update accompanyingPersons and also set numberOfAccompanying based on the length
    setNewEntryData((prev) => ({
      ...prev,
      accompanyingPersons: names.map((name) => ({ name })),
      numberOfAccompanying: names.length, // update count here
    }));
  };
  

  const handleAddNewEntry = async () => {
    setIsSaving(true);
  
    const names = newAccompanyingText
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  
    const updatedData = {
      ...newEntryData,
      accompanyingPersons: names.map((name) => ({ name })),
      numberOfAccompanying: names.length,
      amountPaid: parseFloat(newEntryData.amountPaid) || 0, // Ensure it's a number
      currency: newEntryData.currency,
    };
  
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
  
      const data = await res.json();
      if (data.success) {
        await fetchRegistrations(); // ✅ Fetch all registrations again
        setIsAdding(false);
        setNewEntryData({
          fullName: "",
          email: "",
          phone: "",
          city: "",
          country: "",
          pincode: "",
          address: "",
          category: categories[0] || "",
          eventType: eventTypes[0] || "",
          paymentId: "",
          accompanying: "No",
          numberOfAccompanying: 0,
          accompanyingPersons: [],
          amountPaid: "",
          currency: "INR",
        });
        setNewAccompanyingText("");
      } else {
        alert("Add entry failed: " + data.error);
      }
    } catch (err) {
      alert("Error adding entry: " + err.message);
    } finally {
      setIsSaving(false); // Hide loader
    }
  };
  
  
  
  

  // Filter registrations by search query (fullName, email, or phone)
  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    return (
      reg.fullName.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.phone.toLowerCase().includes(query) ||
      (reg.paymentId && reg.paymentId.toLowerCase().includes(query)) // Include payment ID
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
    {isSaving?  <div className="min-h-screen flex justify-center items-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
      </div>
    :
    <div className="p-4 pt-14 md:mx-auto text-[13px]">
      <div className="flex md:flex-row flex-col md:justify-between md:items-center mb-6 gap-y-4">
        <h1 className="text-3xl font-bold">Registrations</h1>
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
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 font-semibold rounded"
          >
            Logout
          </button>
        </div>
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
          <h2 className="text-xl font-bold mb-4">Add New Registration</h2>
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
            {/* Select for Category */}
            <select
              name="category"
              value={newEntryData.category}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {/* Select for Event Type */}
            <select
              name="eventType"
              value={newEntryData.eventType}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              {eventTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
            {/* Payment ID */}
            <input
              type="text"
              name="paymentId"
              placeholder="Payment ID"
              value={newEntryData.paymentId}
              onChange={handleNewEntryChange}
              className="border p-2"
            />
            {/* Accompanying Option */}
            <select
              name="accompanying"
              value={newEntryData.accompanying}
              onChange={handleNewEntryChange}
              className="border p-2"
              required
            >
              {accompanyingOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {/* Accompanying Persons (as comma-separated list) */}
            <input
              type="text"
              name="accompanyingPersons"
              placeholder="Accompanying Persons (comma separated)"
              value={newAccompanyingText}
              onChange={handleNewAccompanyingTextChange}
              onBlur={handleNewBlurAccompanying}
              className="border p-2"
            />
          </div>
          <div className="mt-4 flex gap-x-4">
          <button
            onClick={handleAddNewEntry}
            className="bg-green-600 text-white px-4 py-2 font-semibold rounded flex items-center"
            disabled={isSaving} // Disable button while saving
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
              disabled={isSaving} // Prevent cancel while saving
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
            <th className="px-4 py-2 border border-gray-300">Email</th>
            <th className="px-4 py-2 border border-gray-300">Phone</th>
            <th className="px-4 py-2 border border-gray-300">City</th>
            <th className="px-4 py-2 border border-gray-300">Nationality</th>
            <th className="px-4 py-2 border border-gray-300">Pincode</th>
            <th className="px-4 py-2 border border-gray-300">Address</th>
            <th className="px-4 py-2 border border-gray-300">Category</th>
            <th className="px-4 py-2 border border-gray-300">Event Type</th>
            <th className="px-4 py-2 border border-gray-300">Amount Paid</th>
            <th className="px-4 py-2 border border-gray-300">Currency</th>
            <th className="px-4 py-2 border border-gray-300">Payment ID</th>
            <th className="px-4 py-2 border border-gray-300">
              Accompanying Persons
            </th>
            <th className="px-4 py-2 border border-gray-300">Submitted At</th>
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
              {/* City */}
              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
                  <input
                    type="text"
                    name="city"
                    value={editData.city || ""}
                    onChange={handleEditChange}
                    className="border p-1"
                  />
                ) : (
                  reg.city
                )}
              </td>
              {/* Country */}
              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
                  <input
                    type="text"
                    name="country"
                    value={editData.country || ""}
                    onChange={handleEditChange}
                    className="border p-1"
                  />
                ) : (
                  reg.country
                )}
              </td>
              <td className="px-4 py-2 border border-gray-300">
  {editingId === reg._id ? (
    <input
      type="text"
      name="pincode"
      value={editData.pincode || ""}
      onChange={handleEditChange}
      className="border p-1"
    />
  ) : (
    reg.pincode
  )}
</td>
<td className="px-4 py-2 border border-gray-300">
  {editingId === reg._id ? (
    <input
      type="text"
      name="address"
      value={editData.address || ""}
      onChange={handleEditChange}
      className="border p-1"
    />
  ) : (
    reg.address
  )}
</td>
              {/* Category (select dropdown) */}
              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
                  <select
                    name="category"
                    value={editData.category || ""}
                    onChange={handleEditChange}
                    className="border p-1"
                    required
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  reg.category
                )}
              </td>
              {/* Event Type (select dropdown) */}
              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
                  <select
                    name="eventType"
                    value={editData.eventType || ""}
                    onChange={handleEditChange}
                    className="border p-1"
                    required
                  >
                    {eventTypes.map((type, idx) => (
                      <option key={idx} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  reg.eventType
                )}
              </td>
              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
                  <input
                    type="number"
                    name="amountPaid"
                    value={editData.amountPaid || ""}
                    onChange={handleEditChange}
                    className="border p-1"
                  />
                ) : reg.amountPaid !== undefined ? (
                  `${reg.currency === "USD" ? "$" : "₹"}${reg.amountPaid}`
                ) : (
                  "N/A"
                )}
              </td>

              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
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
                  reg.currency || "INR"
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
                  />
                ) : (
                  reg.paymentId || "N/A"
                )}
              </td>
              {/* Accompanying Persons */}
              <td className="px-4 py-2 border border-gray-300">
                {editingId === reg._id ? (
                  <input
                    type="text"
                    name="accompanyingPersons"
                    value={accompanyingText}
                    onChange={handleAccompanyingTextChange}
                    onBlur={handleBlurAccompanying}
                    className="border p-1"
                  />
                ) : reg.accompanyingPersons &&
                  Array.isArray(reg.accompanyingPersons) &&
                  reg.accompanyingPersons.length > 0 ? (
                  `${reg.accompanyingPersons.length} (${reg.accompanyingPersons
                    .map((person) => person.name)
                    .join(", ")})`
                ) : (
                  "N/A"
                )}
              </td>
              {/* Submitted At */}
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
    </div>}
    </>
  );
}
