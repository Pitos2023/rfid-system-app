"use client";

import React from "react";
import StudentLogsPage from "../../components-admin/StudentLogs";
import AdminLayout from "../../components-admin/AdminLayout";

export default function StudentLogs() {
  return (
    <AdminLayout>
      <StudentLogsPage />
    </AdminLayout>
  );
}
