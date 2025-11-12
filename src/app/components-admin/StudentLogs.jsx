"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Correct default import

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StudentLogsPage() {
  const [logs, setLogs] = useState([]);

  const formatTime = (ts) =>
    new Date(ts).toLocaleString("en-PH", { hour12: true });

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: logsData, error } = await supabase
        .from("log")
        .select(
          "id, action, consent, time_stamp, rfid_card(card_number), student(first_name, last_name)"
        )
        .order("time_stamp", { ascending: false })
        .limit(10);

      if (!error && logsData) setLogs(logsData);
    };

    fetchLogs();

    // ✅ Real-time subscription
    const subscription = supabase
      .channel("public:log")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log" },
        async (payload) => {
          const { data: newLog } = await supabase
            .from("log")
            .select(
              "id, action, consent, time_stamp, rfid_card(card_number), student(first_name, last_name)"
            )
            .eq("id", payload.new.id)
            .maybeSingle();

          if (newLog) setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // ✅ FIXED PDF GENERATOR
  const generatePDFReport = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: monthlyLogs, error } = await supabase
        .from("log")
        .select(
          "id, action, consent, time_stamp, rfid_card(card_number), student(first_name, last_name)"
        )
        .gte("time_stamp", firstDay.toISOString())
        .lte("time_stamp", lastDay.toISOString())
        .order("time_stamp", { ascending: false });

      if (error) {
        console.error("Failed to fetch monthly logs:", error);
        return;
      }

      // ✅ Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;

      // Header
      doc.setFontSize(16);
      doc.text("Student Entry/Exits Logs Report", margin, 15);
      doc.setFontSize(10);
      doc.text(
        `${firstDay.toLocaleDateString("en-PH")} - ${lastDay.toLocaleDateString(
          "en-PH"
        )}`,
        margin,
        22
      );

      // Prepare data for table
      const tableData = monthlyLogs.map((log) => {
        const actionNormalized =
          log.action?.toLowerCase().replace("_", "-") || "";
        const displayAction =
          actionNormalized === "time-in"
            ? "Time In"
            : actionNormalized === "time-out"
            ? "Time Out"
            : log.action || "N/A";

        return [
          formatTime(log.time_stamp),
          `${log.student?.first_name || "N/A"} ${log.student?.last_name || ""}`,
          log.rfid_card?.card_number || "N/A",
          displayAction,
          log.consent ? "Yes" : "No",
        ];
      });

      // ✅ FIXED: Use autoTable function directly
      autoTable(doc, {
        head: [["Timestamp", "Student Name", "RFID Card", "Action", "Consent"]],
        body: tableData,
        startY: 28,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [128, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 230, 230] },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: "center" }
        );
      }

      doc.save(`Student_Attendance_${now.getFullYear()}_${now.getMonth() + 1}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    }
  };

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#800000]">View Student Logs</h1>
        <button
          onClick={generatePDFReport}
          className="px-4 py-2 bg-[#800000] text-white rounded hover:bg-[#600000] transition-colors font-semibold"
        >
          📄 Create Report
        </button>
      </div>

      <table className="w-full border border-[#800000] text-left text-black">
        <thead>
          <tr className="bg-[#f5e6e6] text-[#800000]">
            <th className="p-2 border border-[#800000]">Timestamp</th>
            <th className="p-2 border border-[#800000]">Student Name</th>
            <th className="p-2 border border-[#800000]">RFID Card</th>
            <th className="p-2 border border-[#800000]">Action</th>
            <th className="p-2 border border-[#800000]">Consent</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center p-3 text-gray-500">
                No scans yet
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const actionNormalized =
                log.action?.toLowerCase().replace("_", "-") || "";

              return (
                <tr key={log.id} className="hover:bg-[#fbe6e6] transition-colors">
                  <td className="p-2 border border-[#800000]">
                    {formatTime(log.time_stamp)}
                  </td>
                  <td className="p-2 border border-[#800000]">
                    {log.student?.first_name && log.student?.last_name
                      ? `${log.student.first_name} ${log.student.last_name}`
                      : "N/A"}
                  </td>
                  <td className="p-2 border border-[#800000]">
                    {log.rfid_card?.card_number || "N/A"}
                  </td>
                  <td
                    className={`p-2 border border-[#800000] font-semibold ${
                      actionNormalized === "time-in"
                        ? "text-green-600"
                        : actionNormalized === "time-out"
                        ? "text-[#800000]"
                        : "text-gray-700"
                    }`}
                  >
                    {actionNormalized === "time-in"
                      ? "Time In"
                      : actionNormalized === "time-out"
                      ? "Time Out"
                      : log.action}
                  </td>
                  <td className="p-2 border border-[#800000]">
                    {log.consent ? "✅ Yes" : "❌ No"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
