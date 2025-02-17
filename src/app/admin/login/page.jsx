"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Retrieve credentials from environment variables or fallback to defaults.
    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "iadrapr2025";
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "iadr241@1";

    if (username === adminUsername && password === adminPassword) {
      // Mark admin as logged in; note: localStorage is not secure.
      localStorage.setItem("adminLoggedIn", "true");
      router.push("/admin/registrations");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="flex justify-center items-center text-sm min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 w-full rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}
