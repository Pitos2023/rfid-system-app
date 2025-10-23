"use client";

import React, { useState, useEffect } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { supabase } from "../supabaseClient";

const ParentManagement = () => {
  const [parents, setParents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newParent, setNewParent] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    address: "",
    password: "",
    role: "parent",
  });

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("role", ["parent", "assistant_principal", "critique"])
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching users:", error);
    else setParents(data || []);
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newParent.email,
        password: newParent.password,
      });

      if (authError) {
        alert(authError.message);
        setLoading(false);
        return;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        alert("User ID not returned from Supabase Auth.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          first_name: newParent.first_name,
          last_name: newParent.last_name,
          email: newParent.email,
          contact_number: newParent.contact_number,
          address: newParent.address,
          role: newParent.role,
        },
      ]);

      if (insertError) {
        alert(insertError.message);
        setLoading(false);
        return;
      }

      alert("User added successfully!");
      setNewParent({
        first_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        address: "",
        password: "",
        role: "parent",
      });
      setIsModalOpen(false);
      fetchParents();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm">
            Manage user profiles, roles, and contact information
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#800000] text-white px-4 py-2 rounded-xl shadow-md hover:bg-[#9c1c1c] transition-all"
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Contact Info</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {parents.map((parent, index) => (
              <tr
                key={parent.id}
                className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors`}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold">
                    {parent.first_name} {parent.last_name}
                  </div>
                  <div className="text-gray-500 text-xs">{parent.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{parent.email}</div>
                  <div className="text-gray-500 text-xs">{parent.contact_number}</div>
                </td>
                <td className="px-6 py-4">{parent.address}</td>
                <td className="px-6 py-4 capitalize">{parent.role}</td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button className="text-[#800000] hover:text-[#9c1c1c]">
                    <FaEdit />
                  </button>
                  <button className="text-[#800000] hover:text-[#9c1c1c]">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}

            {parents.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-100 animate-fadeIn">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <FaTimes size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
              Add New User
            </h2>

            <form onSubmit={handleAddParent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robert"
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  value={newParent.first_name}
                  onChange={(e) => setNewParent({ ...newParent, first_name: e.target.value })}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Smith"
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  value={newParent.last_name}
                  onChange={(e) => setNewParent({ ...newParent, last_name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="e.g. robert@email.com"
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  value={newParent.email}
                  onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                  required
                />
              </div>

              {/* Contact Number */}
              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. 09123456789"
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  value={newParent.contact_number}
                  onChange={(e) => setNewParent({ ...newParent, contact_number: e.target.value })}
                  required
                />
              </div>

              {/* Address */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-gray-700 text-sm font-medium mb-1">Address</label>
                <textarea
                  placeholder="e.g. 123 Main Street, Quezon City"
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none resize-none"
                  rows="2"
                  value={newParent.address}
                  onChange={(e) => setNewParent({ ...newParent, address: e.target.value })}
                  required
                ></textarea>
              </div>

              {/* Password */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-gray-700 text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  value={newParent.password}
                  onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                  required
                />
              </div>

              {/* Role */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-gray-700 text-sm font-medium mb-1">Role</label>
                <select
                  value={newParent.role}
                  onChange={(e) => setNewParent({ ...newParent, role: e.target.value })}
                  className="border border-gray-300 text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  required
                >
                  <option value="parent">Parent</option>
                  <option value="assistant_principal">Assistant Principal</option>
                  <option value="critique">Critique</option>
                  <option value="guard">Guard</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end mt-4 gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#800000] text-white rounded-lg shadow-md hover:bg-[#9c1c1c] transition-all"
                >
                  {loading ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentManagement;
