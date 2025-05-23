'use client';

import SignUpModal from '@/components/SignUpModal';
import React, { useEffect, useState } from 'react';

export default function ResumeEnhancerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [enhancedText, setEnhancedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestCredits, setGuestCredits] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Read guest credits from cookie
  useEffect(() => {
    const match = document.cookie.match(/domijob_guest_credits=(\d+)/);
    if (match) {
      setGuestCredits(parseInt(match[1]));
    } else {
      setGuestCredits(50); // Default if not found
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setEnhancedText('');
    setError('');
  };

  const handleEnhance = async () => {
    if (!file) {
      setError('Please upload a DOCX file.');
      return;
    }

    setLoading(true);
    setError('');
    setEnhancedText('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ai/resume-parse', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 403) {
        setShowModal(true);
        return;
      }
      

      if (!res.body) throw new Error('No response body.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setEnhancedText(prev => prev + chunk);
      }

      // ✅ Update guest credits UI
      const updatedMatch = document.cookie.match(/domijob_guest_credits=(\d+)/);
      if (updatedMatch) {
        setGuestCredits(parseInt(updatedMatch[1]));
      }

    } catch (err: any) {
      console.error('Error enhancing resume:', err.message);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl font-bold mb-6">🎯 AI Resume Enhancer</h1>

          {guestCredits !== null && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              You have <span className="font-bold">{guestCredits}</span> free {guestCredits === 1 ? 'credit' : 'credits'} left.
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 font-medium">Upload DOCX Resume</label>
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700"
            />
          </div>

          <button
            onClick={handleEnhance}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition disabled:opacity-60"
            disabled={loading || (guestCredits !== null && guestCredits <= 0)}
          >
            {loading ? 'Enhancing...' : 'Enhance Resume'}
          </button>

          {error && (
            <div className="mt-4 text-red-500 font-medium">
              ❌ {error}
            </div>
          )}

          {enhancedText && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Your Enhanced Resume</h2>
              <textarea
                value={enhancedText}
                readOnly
                className="w-full h-96 p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(enhancedText)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([enhancedText], { type: 'text/plain;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'enhanced-resume.txt';
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
      </div>
      <SignUpModal isOpen={showModal} onClose={() => setShowModal(false)} />

    </div>
  );
}