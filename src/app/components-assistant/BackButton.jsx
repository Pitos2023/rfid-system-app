"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <div className="mt-5 mb-6 ml-5"> {/* Adds spacing above and below */}
      <button
        onClick={() => router.back()}
        className="flex items-center px-2 py-1 bg-maroon text-white rounded-lg shadow-md hover:bg-[#660000] transition"
        style={{ backgroundColor: "#800000" }}
      >
        <ArrowLeft className="w-5 h-5 mr-2" color="white" />
        Back
      </button>
    </div>
  );
}
