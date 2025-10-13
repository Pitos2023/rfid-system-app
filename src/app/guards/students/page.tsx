"use client";
import Layout from "../../components-parents/Layout";
import Students from "../../components-parents/Students";

export default function StudentsPage() {
  return (
    <Layout>
      <Students setView={undefined} user={undefined} />
    </Layout>
  );
}
