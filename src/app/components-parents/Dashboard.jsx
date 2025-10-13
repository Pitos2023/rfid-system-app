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

      // ✅ Fetch only existing columns from the `student` table
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
            {/* HEADER */}
            <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow overflow-hidden">
                <Image
                  src={"/inoske.jpg"} // Placeholder
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
                onClick={() => setView("activity")}
                className="w-full bg-[#58181F] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#6d2029] transition-colors"
              >
                View Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
