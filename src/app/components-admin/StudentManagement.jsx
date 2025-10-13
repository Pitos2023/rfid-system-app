"use client";
import React, { useState, useEffect } from "react";
import { FaUserPlus, FaTrash, FaIdCard } from "react-icons/fa";
import { supabase } from "../supabaseClient";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    school_id: "",
    grade_level: "",
    section: "",
    birthdate: "",
  });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [newCard, setNewCard] = useState("");
  const [rfidCards, setRfidCards] = useState([]);

  // Assign Parent
  const [isAssignParentModalOpen, setIsAssignParentModalOpen] = useState(false);
  const [selectedStudentForParent, setSelectedStudentForParent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [parentResults, setParentResults] = useState([]);

  // Fetch students
  const fetchStudents = async () => {
    const { data, error } = await supabase.from("student").select("*");
    if (error) console.error("Error fetching students:", error);
    else setStudents(data);
  };

  // Fetch RFID cards
  const fetchRFIDCards = async () => {
    const { data, error } = await supabase.from("rfid_card").select("card_number, student_id");
    if (error) console.error("Error fetching RFID cards:", error);
    else setRfidCards(data);
  };

  useEffect(() => {
    fetchStudents();
    fetchRFIDCards();
  }, []);

  // Add student
  const handleAddStudent = async () => {
    const { error } = await supabase.from("student").insert([newStudent]);
    if (error) alert("Failed to add student.");
    else {
      alert("Student added successfully!");
      setIsModalOpen(false);
      setNewStudent({ first_name: "", last_name: "", school_id: "", grade_level: "", section: "", birthdate: "" });
      fetchStudents();
    }
  };

  // Delete student
  const handleDeleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const { error } = await supabase.from("student").delete().eq("id", id);
    if (error) alert("Failed to delete student.");
    else {
      alert("Student deleted successfully!");
      fetchStudents();
    }
  };

  // Register RFID
  const handleRegisterCard = async () => {
    if (!newCard || !selectedStudentId) {
      alert("Please select a student and enter a card number!");
      return;
    }
    const { error } = await supabase.from("rfid_card").insert([{ student_id: selectedStudentId, card_number: newCard }]);
    if (error) alert("Failed to register RFID card!");
    else {
      alert(`Card ${newCard} registered successfully!`);
      setNewCard("");
      setSelectedStudentId("");
      setIsCardModalOpen(false);
      fetchRFIDCards();
    }
  };

  // Search parent
  const handleSearchParent = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .not("role", "in", '("admin","assistant_principal","critique")')
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    if (error) console.error("Error searching parents:", error);
    else setParentResults(data);
  };

  // Assign parent
  const handleAssignParent = async (usersId) => {
    if (!selectedStudentForParent) return;
    const { error } = await supabase.from("student").update({ users_id: usersId }).eq("id", selectedStudentForParent.id);
    if (error) alert("Failed to assign parent!");
    else {
      alert("Parent assigned successfully!");
      setIsAssignParentModalOpen(false);
      setParentResults([]);
      setSearchQuery("");
      fetchStudents();
    }
  };

  const gradeLevels = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];

  return (
    <section className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Student Management</h1>

        {/* Buttons */}
        <div className="flex justify-start gap-4 mb-6">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <FaUserPlus /> Add Student
          </button>

          <button onClick={() => setIsCardModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <FaIdCard /> Register RFID
          </button>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm text-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-black">#</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Full Name</th>
                <th className="border border-gray-300 px-4 py-2 text-black">School ID</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Grade Level</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Section</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Birthdate</th>
                <th className="border border-gray-300 px-4 py-2 text-black">RFID Card</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Parent ID</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-500 italic">No students found</td>
                </tr>
              ) : (
                students.map((student, index) => {
                  const card = rfidCards.find((rfid) => rfid.student_id === student.id);
                  return (
                    <tr key={student.id} className="text-center text-black">
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{student.first_name} {student.last_name}</td>
                      <td className="border border-gray-300 px-4 py-2">{student.school_id}</td>
                      <td className="border border-gray-300 px-4 py-2">{student.grade_level}</td>
                      <td className="border border-gray-300 px-4 py-2">{student.section}</td>
                      <td className="border border-gray-300 px-4 py-2">{student.birthdate}</td>
                      <td className="border border-gray-300 px-4 py-2">{card ? card.card_number : "—"}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {student.users_id ? (
                          <span>{student.users_id}</span>
                        ) : (
                          <button onClick={() => { setSelectedStudentForParent(student); setIsAssignParentModalOpen(true); }} className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm">
                            Assign Parent
                          </button>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-800">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add Student Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-black mb-6 border-b pb-3">Add New Student</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
              <input type="text" placeholder="First Name" value={newStudent.first_name} onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"/>
              <input type="text" placeholder="Last Name" value={newStudent.last_name} onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"/>
              <input type="text" placeholder="School ID" value={newStudent.school_id} onChange={(e) => setNewStudent({ ...newStudent, school_id: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"/>
              
              <select value={newStudent.grade_level} onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black">
                <option value="">Select Grade Level</option>
                {gradeLevels.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>

              <input type="text" placeholder="Section" value={newStudent.section} onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"/>
              <input type="date" placeholder="Birthdate" value={newStudent.birthdate} onChange={(e) => setNewStudent({ ...newStudent, birthdate: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"/>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button onClick={handleAddStudent} className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Register RFID Modal --- */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-black mb-6 border-b pb-3">Register RFID Card</h2>
            <div className="flex flex-col gap-4">
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
              <input type="text" placeholder="RFID Card Number" value={newCard} onChange={(e) => setNewCard(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"/>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCardModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button onClick={handleRegisterCard} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all">Register</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Assign Parent Modal --- */}
      {isAssignParentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg border border-gray-200 text-black">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Assign Parent to {selectedStudentForParent?.first_name} {selectedStudentForParent?.last_name}
            </h2>

            {/* Search Input */}
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Search parent by name or email" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border px-3 py-2 rounded-md w-full text-sm text-black"/>
              <button onClick={handleSearchParent} className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">Search</button>
            </div>

            {/* Search Results */}
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {parentResults.length === 0 ? (
                <p className="text-center text-gray-500 text-sm italic">No parents found</p>
              ) : (
                parentResults.map((users) => (
                  <div key={users.id} className="flex justify-between items-center bg-white border rounded-md p-2 mb-2 shadow-sm text-black">
                    <div>
                      <p className="font-medium text-black">{users.first_name} {users.last_name}</p>
                      <p className="text-sm text-black">{users.email}</p>
                    </div>
                    <button onClick={() => handleAssignParent(users.id)} className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm">Assign</button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => setIsAssignParentModalOpen(false)} className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StudentManagement;
