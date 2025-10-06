"use client";

import React, { useState, useEffect } from "react";
import { FaUserPlus, FaTrash, FaTimes } from "react-icons/fa";
import { supabase } from "../supabaseClient"; // Adjust path to your supabaseClient

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    school_id: "",
    grade_level: "",
    section: "",
    birthdate: "",
  });

  // Fetch students from Supabase
  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("student") // lowercase table name
      .select("*")
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", JSON.stringify(error, null, 2));
    } else {
      setStudents(data || []);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Add student to Supabase
  const handleAddStudent = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("student")
      .insert([
        {
          first_name: newStudent.first_name,
          last_name: newStudent.last_name,
          school_id: newStudent.school_id,
          grade_level: newStudent.grade_level,
          section: newStudent.section,
          birthdate: newStudent.birthdate,
        },
      ])
      .select(); // Important to return inserted rows

    if (error) {
      console.error("Error adding student:", JSON.stringify(error, null, 2));
      alert("Failed to add student!");
    } else if (data && data.length > 0) {
      setStudents([data[0], ...students]); // prepend new student safely
      setNewStudent({
        first_name: "",
        last_name: "",
        school_id: "",
        grade_level: "",
        section: "",
        birthdate: "",
      });
      setIsModalOpen(false);
    } else {
      console.error("Insert returned no data:", data);
      alert("Failed to add student! No data returned.");
    }
  };

  // Delete student
  const handleDeleteStudent = async (id) => {
    const { error } = await supabase.from("student").delete().eq("id", id);
    if (error) {
      console.error("Error deleting student:", JSON.stringify(error, null, 2));
    } else {
      setStudents(students.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Student Management</h1>
          <p className="text-gray-500 text-sm">Manage student information</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <FaUserPlus /> Add Student
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">School ID</th>
              <th className="px-6 py-3">Grade & Section</th>
              <th className="px-6 py-3">Birthdate</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {students.map((student) => (
              <tr key={student.id} className="border-t hover:bg-gray-100 transition-colors">
                <td className="px-6 py-4">{student.first_name} {student.last_name}</td>
                <td className="px-6 py-4">{student.school_id}</td>
                <td className="px-6 py-4">
                  {student.grade_level} <br />
                  <span className="text-gray-500 text-xs">{student.section}</span>
                </td>
                <td className="px-6 py-4">{student.birthdate}</td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteStudent(student.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-100">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
              <FaTimes size={20} />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="First Name"
                value={newStudent.first_name}
                onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newStudent.last_name}
                onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="School ID"
                value={newStudent.school_id}
                onChange={(e) => setNewStudent({ ...newStudent, school_id: e.target.value })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
              {/* Grade Level Dropdown */}
              <select
                value={newStudent.grade_level}
                onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Grade</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
              <input
                type="text"
                placeholder="Section"
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="Birthdate"
                value={newStudent.birthdate}
                onChange={(e) => setNewStudent({ ...newStudent, birthdate: e.target.value })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <div className="md:col-span-2 flex justify-end mt-4 gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
