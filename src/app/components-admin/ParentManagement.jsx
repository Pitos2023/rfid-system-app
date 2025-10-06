"use client";

import React, { useState } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";

const ParentManagement = () => {
  const [parents, setParents] = useState([
    {
      id: "PAR001",
      name: "Robert Smith",
      email: "robert.smith@email.com",
      phone: "09123456789",
      address: "123 Main Street, Quezon City",
      status: "active",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newParent, setNewParent] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });

  const handleAddParent = (e) => {
    e.preventDefault();
    const newEntry = { ...newParent, id: `PAR${parents.length + 1}` };
    setParents([...parents, newEntry]);
    setNewParent({
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Parent Management</h1>
          <p className="text-gray-500 text-sm">
            Manage parent profiles, contact information, and account status
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <FaUserPlus /> Add Parent
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">Parent</th>
              <th className="px-6 py-3">Contact Info</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {parents.map((parent, index) => (
              <tr
                key={parent.id}
                className={`border-t ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition-colors`}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold">{parent.name}</div>
                  <div className="text-gray-500 text-xs">{parent.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{parent.email}</div>
                  <div className="text-gray-500 text-xs">{parent.phone}</div>
                </td>
                <td className="px-6 py-4">{parent.address}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      parent.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {parent.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <FaTimes size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
              Add New Parent
            </h2>

            <form onSubmit={handleAddParent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Smith"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.name}
                  onChange={(e) => setNewParent({ ...newParent, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. robert@email.com"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.email}
                  onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-700 text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 09123456789"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.phone}
                  onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-gray-700 text-sm font-medium mb-1">Address</label>
                <textarea
                  placeholder="e.g. 123 Main Street, Quezon City"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows="2"
                  value={newParent.address}
                  onChange={(e) => setNewParent({ ...newParent, address: e.target.value })}
                  required
                ></textarea>
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
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Add Parent
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
