"use client";

import React from "react";
import StudentManagement from "../../components-admin/StudentManagement";
import AdminLayout from "../../components-admin/AdminLayout";

export default function StudentManagementPage() {
  return (
    <AdminLayout>
      <StudentManagement />
    </AdminLayout>
  );
}
