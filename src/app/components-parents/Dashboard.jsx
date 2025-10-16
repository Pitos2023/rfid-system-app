"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "../supabaseClient";

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [studentLogs, setStudentLogs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef(null);

  // ✅ Fetch all students for this user (parent)
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      setLoadingStudents(true);

      const { data, error } = await supabase
        .from("student")
        .select("id, first_name, last_name, school_id, grade_level, section, birthdate")
        .eq("users_id", user.id);

      if (error) {
        console.error("Error fetching students:", error.message);
        setStudents([]);
      } else {
        setStudents(data || []);
      }

      setLoadingStudents(false);
    };

    fetchStudents();
  }, [user]);

  // ✅ Fetch logs for selected student
  const fetchStudentLogs = async (studentId) => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/rfid-logs");
      const { logs, error } = await res.json();

      if (error) {
        console.error("Error fetching logs:", error);
        setStudentLogs([]);
      } else {
        // Filter logs belonging to this student
        const filtered = logs.filter(
          (log) => log.student && log.student.id === studentId
        );
        setStudentLogs(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch student logs:", err);
      setStudentLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // ✅ When user clicks “View Activity Log”
  const handleViewLogs = async (student) => {
    setSelectedStudent(student);
    await fetchStudentLogs(student.id);
    setShowModal(true);

    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchStudentLogs(student.id);
    }, 5000);
  };

  // ✅ Close modal and stop polling
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    clearInterval(intervalRef.current);
  };

  if (loadingStudents)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-gray-600 text-lg">Loading your students...</p>
      </div>
    );

  if (students.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <p className="text-gray-500 text-lg">
          No students assigned to your account yet.
        </p>
      </div>
    );

  return (
    <div id="studentsView" className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            {/* HEADER */}
            <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow overflow-hidden">
                <Image
                  src={"/inoske.jpg"}
                  alt={s.first_name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {s.first_name} {s.last_name}
              </h3>
              <p className="text-gray-600">
                Grade {s.grade_level} - {s.section}
              </p>
            </div>

            {/* DETAILS */}
            <div className="p-7">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Student ID
                  </label>
                  <p className="text-gray-800 font-semibold">{s.school_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Birthdate
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {s.birthdate
                      ? new Date(s.birthdate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewLogs(s)}
                className="w-full bg-[#58181F] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#6d2029] transition-colors"
              >
                View Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ MODAL for Logs */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-lg overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedStudent?.first_name} {selectedStudent?.last_name} — Activity Log
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>

            {loadingLogs ? (
              <p className="text-center text-gray-500 py-6">Loading logs...</p>
            ) : studentLogs.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Student
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Date & Time
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Grade & Section
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Action
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Consent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentLogs.map((log) => (
                      <tr key={log.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-semibold text-gray-800">
                          {log.student?.first_name} {log.student?.last_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {new Date(log.time_stamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          Grade {log.student?.grade_level} - {log.student?.section}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm font-semibold ${
                            log.action?.toLowerCase() === "time-in"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {log.action?.toLowerCase()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {log.consent ? (
                            <span className="text-green-600 font-medium">✔ Yes</span>
                          ) : (
                            <span className="text-red-600 font-medium">✖ No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 mt-4 text-center">No logs found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
