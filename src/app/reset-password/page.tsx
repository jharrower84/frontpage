"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#fff" }}>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12" style={{ background: "#0a0a0a" }}>
        <Link href="/" className="text-base font-bold" style={{ letterSpacing: "-0.03em", color: "#ffffff" }}>
          FrontPage
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#2979FF" }}>
            Account recovery
          </p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-0.03em" }}>
            Let's get you<br />back in.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
        <p className="text-xs" style={{ color: "#333" }}>© 2026 FrontPage</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">

          <Link href="/" className="text-base font-bold block mb-10 lg:hidden" style={{ color: "#111", letterSpacing: "-0.03em" }}>
            FrontPage
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#f0fdf4" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "#111", letterSpacing: "-0.02em" }}>
                Check your inbox
              </h1>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: "#888" }}>
                We've sent a password reset link to <strong style={{ color: "#111" }}>{email}</strong>. Click the link in the email to set a new password.
              </p>
              <Link
                href="/signin"
                className="text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "#2979FF" }}
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#111", letterSpacing: "-0.02em" }}>
                Reset your password
              </h1>
              <p className="text-sm mb-8" style={{ color: "#888" }}>
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="text-sm px-4 py-3 rounded-lg mb-6" style={{ background: "#fff5f5", color: "#e05555", border: "1px solid #fecaca" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#999" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 text-sm focus:outline-none rounded-lg"
                    style={{ border: "1px solid #e8e8e8", color: "#111" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "#2979FF" }}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm mt-8" style={{ color: "#aaa" }}>
                Remember your password?{" "}
                <Link href="/signin" className="font-semibold hover:opacity-70 transition-opacity" style={{ color: "#111" }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}