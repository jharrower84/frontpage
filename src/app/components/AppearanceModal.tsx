"use client";

import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

type Mode = "light" | "dark" | "system";

export default function AppearanceModal({ onClose }: Props) {
  const [appearance, setAppearance] = useState<Mode>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") setAppearance(saved);
    else setAppearance("system");
  }, []);

  const handleSelect = (mode: Mode) => {
    setAppearance(mode);
    if (mode === "system") {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      localStorage.setItem("theme", mode);
      document.documentElement.setAttribute("data-theme", mode);
    }
  };

  const options: { mode: Mode; label: string; preview: React.ReactNode }[] = [
    {
      mode: "light",
      label: "Light",
      preview: (
        <div className="w-full h-36 rounded-xl overflow-hidden border-2 border-gray-200 bg-white flex flex-col p-3 gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-gray-800" />
          <div className="w-full h-1 rounded-full bg-gray-200" />
          <div className="w-4/5 h-1 rounded-full bg-gray-200" />
          <div className="w-full h-1 rounded-full bg-gray-200" />
          <div className="w-3/5 h-1 rounded-full bg-gray-200" />
        </div>
      ),
    },
    {
      mode: "dark",
      label: "Dark",
      preview: (
        <div className="w-full h-36 rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900 flex flex-col p-3 gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-gray-100" />
          <div className="w-full h-1 rounded-full bg-gray-700" />
          <div className="w-4/5 h-1 rounded-full bg-gray-700" />
          <div className="w-full h-1 rounded-full bg-gray-700" />
          <div className="w-3/5 h-1 rounded-full bg-gray-700" />
        </div>
      ),
    },
    {
      mode: "system",
      label: "System",
      preview: (
        <div className="w-full h-36 rounded-xl overflow-hidden border-2 border-gray-300 flex">
          <div className="w-1/2 bg-white flex flex-col p-3 gap-1.5">
            <div className="w-4 h-1.5 rounded-full bg-gray-800" />
            <div className="w-full h-1 rounded-full bg-gray-200" />
            <div className="w-4/5 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="w-1/2 bg-gray-900 flex flex-col p-3 gap-1.5">
            <div className="w-4 h-1.5 rounded-full bg-gray-100" />
            <div className="w-full h-1 rounded-full bg-gray-700" />
            <div className="w-4/5 h-1 rounded-full bg-gray-700" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl p-8"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Change appearance
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-3 gap-4">
          {options.map(({ mode, label, preview }) => {
            const selected = appearance === mode;
            return (
              <button
                key={mode}
                onClick={() => handleSelect(mode)}
                className="flex flex-col gap-2 transition-opacity hover:opacity-80"
              >
                <div
                  className="w-full rounded-xl overflow-hidden transition-all"
                  style={{
                    border: selected ? "2px solid #2979FF" : "2px solid var(--border)",
                    boxShadow: selected ? "0 0 0 3px rgba(41,121,255,0.15)" : "none",
                  }}
                >
                  {preview}
                </div>
                <span
                  className="text-xs font-medium text-center w-full"
                  style={{ color: selected ? "#2979FF" : "var(--text-tertiary)", fontWeight: selected ? 600 : 400 }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}