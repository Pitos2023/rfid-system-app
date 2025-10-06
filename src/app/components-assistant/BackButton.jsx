"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <div className="mt-4 mb-6"> {/* 🔹 Adds spacing above and below */}
      <button
        onClick={() => router.back()}
        className="flex items-center px-4 py-2 bg-[#58181F] text-white rounded-lg shadow-md hover:bg-[#6e2028] transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>
    </div>
  );
}
