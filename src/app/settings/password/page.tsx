"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSocialLogin, setIsSocialLogin] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      const p = user.app_metadata?.provider;
      setProvider(p || null);
      setIsSocialLogin(!!p && p !== "email");
    });
  }, []);

  const handleChange = async () => {
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields."); return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match."); return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/settings"), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/settings")}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Change password
        </h1>
      </div>

      {isSocialLogin ? (
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--text-faint)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Password managed by {provider === "google" ? "Google" : "Apple"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Your account is linked to {provider === "google" ? "Google" : "Apple"}. To change your password, update it in your {provider === "google" ? "Google" : "Apple"} account settings.
          </p>
        </div>
      ) : success ? (
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#f0fdf4" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Password updated</p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Redirecting to settings...</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Choose a strong password that you don't use anywhere else.
          </p>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              New password
            </label>
            <div
              className="flex items-center rounded-xl px-4 py-3 focus-within:ring-1"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="flex-1 text-sm bg-transparent focus:outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                onClick={() => setShowNew((v) => !v)}
                style={{ color: "var(--text-faint)" }}
                className="ml-2 hover:opacity-70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
                  {showNew
                    ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-faint)" }}>
              Confirm new password
            </label>
            <div
              className="flex items-center rounded-xl px-4 py-3"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="flex-1 text-sm bg-transparent focus:outline-none"
                style={{ color: "var(--text-primary)" }}
                onKeyDown={(e) => { if (e.key === "Enter") handleChange(); }}
              />
              <button
                onClick={() => setShowConfirm((v) => !v)}
                style={{ color: "var(--text-faint)" }}
                className="ml-2 hover:opacity-70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
                  {showConfirm
                    ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#e05555" }}>{error}</p>
          )}

          <div className="p-4 rounded-xl text-xs space-y-1" style={{ background: "var(--bg-secondary)", color: "var(--text-faint)" }}>
            <p>· At least 6 characters</p>
            <p>· Mix of letters and numbers</p>
            <p>· Include special characters for extra security</p>
            <p>· Don't reuse passwords from other sites</p>
          </div>

          <button
            onClick={handleChange}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2979FF" }}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </div>
      )}
    </div>
  );
}