'use client';

import React, { useState } from 'react';

export default function ResumeEnhancerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [enhancedText, setEnhancedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setEnhancedText('');
    setError('');
  };

  const handleEnhance = async () => {
    if (!file) {
      setError('Please upload a resume file.');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
  
    setLoading(true);
    setError('');
    setEnhancedText('');
  
    try {
      const res = await fetch('/api/resume-enhancer', {
        method: 'POST',
        body: formData,
      });
  
      if (!res.body) throw new Error('No response body.');
  
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let resultText = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        resultText += chunk;
        setEnhancedText(prev => prev + chunk); // Update UI live
      }
    } catch (err: any) {
      console.error('Error enhancing resume:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-medium">Enhancing your resume…</p>
          <div className="mt-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Resume Enhancer</h1>

      <input
  type="file"
  accept=".docx"
  onChange={handleFileChange}
  className="mb-4 block"
/>


      <button
        onClick={handleEnhance}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Enhance Resume
      </button>

      {error && (
        <div className="mt-4 text-red-600 font-medium">
          ❌ Error: {error}
        </div>
      )}

      {enhancedText && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Your Enhanced Resume:</h2>
          <textarea
            value={enhancedText}
            readOnly
            className="w-full p-4 border rounded-md h-96 bg-gray-50 text-sm"
          />
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => navigator.clipboard.writeText(enhancedText)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              ⬇️ Download as .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
