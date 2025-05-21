'use client';

import React from 'react';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-6 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">🚀 Out of Free Credits</h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          You’ve used all your free credits. Sign up to continue using the AI Resume Enhancer and unlock more powerful tools.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600"
          >
            Maybe Later
          </button>
          <a
            href="/login"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
