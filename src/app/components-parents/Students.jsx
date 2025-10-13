"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../supabaseClient";

export default function Students({ setView, user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("student")
        .select("*")
        .eq("parent_id", user.id);

      if (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
      } else {
        setStudents(data || []);
      }

      setLoading(false);
    };

    fetchStudents();
  }, [user]);

  if (loading)
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
            <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div
                className={`w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow overflow-hidden`}
              >
                <Image
                  src={s.img || "/default-student.png"}
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
                {s.grade_level
                  ? `Grade ${s.grade_level} - ${s.section}`
                  : s.section}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Student ID
                  </label>
                  <p className="text-gray-800 font-semibold">{s.school_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    RFID Tag
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {s.rfid_id || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {s.birthdate || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {s.email || "—"}
                  </p>
                </div>
              </div>

              <div className="mb-6 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-500">
                  Emergency Contact
                </label>
                <p className="text-gray-800 font-semibold">
                  {s.emergency_contact || "Not provided"}
                </p>
              </div>

              <button
                onClick={() => setView("activity")}
                className="w-full bg-[#58181F] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#6d2029] transition-colors"
              >
                View Full Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
