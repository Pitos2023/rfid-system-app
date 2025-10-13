"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../supabaseClient";

export default function Dashboard({ parentId, user }) {
  const [students, setStudents] = useState([]); // lightweight list
  const [selectedStudent, setSelectedStudent] = useState(null); // detailed student object
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false); // when fetching details

  // 🟢 Fetch basic student list (lightweight)
  useEffect(() => {
    if (!parentId) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("student")
          .select("id, first_name, last_name, grade_level, section, users_id")
          .eq("users_id", parentId);

        if (error) {
          console.error("❌ Error fetching students:", error);
          setStudents([]);
        } else {
          const mappedStudents = (data || []).map((s) => ({
            id: s.id,
            name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),
            grade_level: s.grade_level,
            sectionShort: s.section,
            section: `Grade ${s.grade_level || ""} - ${s.section || ""}`.trim(),
            img: "/inoske.jpg",
          }));
          setStudents(mappedStudents);
        }
      } catch (err) {
        console.error("🚨 Unexpected error fetching students:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [parentId]);

  // 🟢 Fetch full details only when "View Details" is clicked
  const fetchStudentDetails = async (studentId) => {
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from("student")
        .select(`
          id,
          first_name,
          last_name,
          school_id,
          grade_level,
          section,
          birthdate
        `)
        .eq("id", studentId)
        .single();

      if (error) {
        console.error("❌ Error fetching student details:", error);
        setSelectedStudent(null);
        return;
      }

      const detailedStudent = {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        school_id: data.school_id || "N/A",
        grade_level: data.grade_level || "",
        section: `Grade ${data.grade_level || ""} - ${data.section || ""}`.trim(),
        dob: data.birthdate || "N/A",
        img: "/inoske.jpg",
        rfid: "N/A",
        email: "",
        contact: "",
      };

      setSelectedStudent(detailedStudent);
    } catch (err) {
      console.error("🚨 Unexpected error fetching student details:", err);
      setSelectedStudent(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <p>Loading students...</p>;
  if (students.length === 0) return <p>No students assigned to your account.</p>;

  return (
    <div id="dashboardView" className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Total Children</p>
          <p className="text-3xl font-bold text-gray-800">{students.length}</p>
        </div>
      </div>

      {/* Student Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
                  <Image
                    src={s.img}
                    alt={s.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{s.name}</h3>
                  <p className="text-gray-600">{s.section}</p>
                </div>
              </div>
              <button
                onClick={() => fetchStudentDetails(s.id)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {detailLoading && selectedStudent && selectedStudent.id === s.id
                  ? "Loading..."
                  : "View Details"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative text-gray-800">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            {detailLoading ? (
              <p className="text-center py-8">Loading student details...</p>
            ) : (
              <>
                <div className="text-center border-b border-gray-100 pb-6">
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-100">
                    <Image
                      src={selectedStudent.img}
                      alt={selectedStudent.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-gray-600">{selectedStudent.section}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Student ID
                    </label>
                    <p className="text-gray-800 font-semibold">
                      {selectedStudent.school_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </label>
                    <p className="text-gray-800 font-semibold">
                      {selectedStudent.dob}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
