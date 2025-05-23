"use client";

import React, { useEffect, useState } from "react";
import SignUpModal from "@/components/SignUpModal";
import { toast } from "@/components/ui/use-toast";

export default function ResumeParserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestCredits, setGuestCredits] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Read guest credits from cookie
  useEffect(() => {
    const match = document.cookie.match(/domijob_guest_credits=(\d+)/);
    if (match) {
      setGuestCredits(parseInt(match[1]));
    } else {
      setGuestCredits(50); // Default
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected ?? null);
    setParsedText("");
    setError("");
  };

  const handleParse = async () => {
    if (!file) {
      setError("Please upload a DOCX file.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Only DOCX files are supported.");
      return;
    }

    setLoading(true);
    setError("");
    setParsedText("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/ai/resume-parse", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();

      if (!uploadRes.ok) {
        if (uploadRes.status === 402 && data.requiresSignup) {
          setShowModal(true);
        }
        throw new Error(data.error || "Failed to parse resume.");
      }

      setParsedText(data.text || "");
      if (data.remainingCredits !== undefined) {
        setGuestCredits(data.remainingCredits);
      }

      toast({
        title: "Success",
        description: "Resume parsed successfully!",
      });
    } catch (err: any) {
      console.error("Parsing error:", err);
      setError(err.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">📄 AI Resume Parser</h1>

        {guestCredits !== null && (
          <div className="text-sm text-muted-foreground mb-3">
            You have <strong>{guestCredits}</strong>{" "}
            {guestCredits === 1 ? "credit" : "credits"} left.
          </div>
        )}

        <div className="mb-4">
          <label className="block font-medium mb-1">Upload DOCX File</label>
          <input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700"
          />
        </div>

        <button
          onClick={handleParse}
          disabled={loading || (guestCredits !== null && guestCredits <= 0)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md disabled:opacity-60"
        >
          {loading ? "Parsing..." : "Parse Resume"}
        </button>

        {error && <p className="text-red-500 mt-4">❌ {error}</p>}

        {parsedText && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Extracted Text</h2>
            <textarea
              readOnly
              value={parsedText}
              className="w-full h-96 p-4 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(parsedText)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([parsedText], { type: "text/plain;charset=utf-8" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "parsed-resume.txt";
                  link.click();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                ⬇️ Download as .txt
              </button>
            </div>
          </div>
        )}
      </div>

      <SignUpModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
