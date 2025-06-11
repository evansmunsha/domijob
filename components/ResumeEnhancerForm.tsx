"use client";

import { useState } from "react";

export default function ResumeEnhancerForm() {
  const [resumeText, setResumeText] = useState("");
  const [enhanced, setEnhanced] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnhance = async () => {
    setLoading(true);
    setEnhanced("");

    const response = await fetch("/api/resume-enhancer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: resumeText }),
    });

    const data = await response.json();
    setEnhanced(data.result);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        rows={10}
        placeholder="Paste your resume text here..."
        className="w-full p-4 border rounded-md"
      />
      <button
        onClick={handleEnhance}
        disabled={loading || !resumeText}
        className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {loading ? "Enhancing..." : "Enhance Resume with AI"}
      </button>

      {enhanced && (
        <div className="p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
          <h2 className="font-semibold mb-2">Enhanced Resume:</h2>
          {enhanced}
        </div>
      )}
    </div>
  );
}
