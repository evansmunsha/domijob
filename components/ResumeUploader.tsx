'use client';
import { useState } from 'react';

export default function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/resume-enhancer', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResult(data.result || data.error);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded max-w-md mx-auto mt-10">
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? 'Processing...' : 'Enhance Resume'}
      </button>

      {result && (
        <div className="mt-6 whitespace-pre-wrap p-4 border rounded bg-gray-50">
          <strong>Improved Resume:</strong>
          <div>{result}</div>
        </div>
      )}
    </form>
  );
}
