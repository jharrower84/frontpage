"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, []);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (data.user) {
      const res = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, fullName, username }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Failed to create profile"); setLoading(false); return; }
    }

    router.push("/onboarding");
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) setError(error.message);
  };

  const handleAppleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) setError(error.message);
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
            Independent fashion writing
          </p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-0.03em" }}>
            Your voice in<br />fashion starts<br />here.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
            Write, publish and grow your audience on FrontPage — built for fashion writers and the readers who love them.
          </p>
        </div>
        <p className="text-xs" style={{ color: "#333" }}>© 2026 FrontPage</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="text-base font-bold block mb-10 lg:hidden" style={{ color: "#111", letterSpacing: "-0.03em" }}>
            FrontPage
          </Link>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111", letterSpacing: "-0.02em" }}>
            Create your account
          </h1>
          <p className="text-sm mb-8" style={{ color: "#888" }}>Free forever. No credit card needed.</p>

          {error && (
            <div className="text-sm px-4 py-3 rounded-lg mb-6" style={{ background: "#fff5f5", color: "#e05555", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => setShowEmailForm((v) => !v)}
              className="w-full py-3 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#111" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Sign up with Email
            </button>

            {showEmailForm && (
              <form onSubmit={handleSignUp} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#999" }}>Full name</label>
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 text-sm focus:outline-none rounded-lg"
                    style={{ border: "1px solid #e8e8e8", color: "#111" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#999" }}>Username</label>
                  <input
                    type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                    placeholder="janesmith"
                    className="w-full px-4 py-3 text-sm focus:outline-none rounded-lg"
                    style={{ border: "1px solid #e8e8e8", color: "#111" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#999" }}>Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 text-sm focus:outline-none rounded-lg"
                    style={{ border: "1px solid #e8e8e8", color: "#111" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#999" }}>Password</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-sm focus:outline-none rounded-lg"
                    style={{ border: "1px solid #e8e8e8", color: "#111" }}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "#2979FF" }}
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ background: "#f0f0f0" }} />
              <span className="text-xs" style={{ color: "#bbb" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#f0f0f0" }} />
            </div>

            <button
              onClick={handleGoogleSignUp}
              className="w-full py-3 text-sm font-medium flex items-center justify-center gap-3 rounded-lg transition-opacity hover:opacity-80"
              style={{ border: "1px solid #e8e8e8", color: "#333" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => alert("Facebook sign up is coming soon.")}
              className="w-full py-3 text-sm font-medium flex items-center justify-center gap-3 rounded-lg cursor-not-allowed"
              style={{ border: "1px solid #f0f0f0", color: "#ccc" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#d1d5db">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f5f5f5", color: "#bbb" }}>Soon</span>
            </button>

            <button
              onClick={handleAppleSignUp}
              className="w-full py-3 text-sm font-medium flex items-center justify-center gap-3 rounded-lg transition-opacity hover:opacity-80"
              style={{ border: "1px solid #e8e8e8", color: "#333" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 411.6 48.5 292.8 82.2 224.2c23.3-48.5 63-89.6 112.2-114.3 45.1-22.9 96.1-33.8 146.2-33.8 54.7 0 105.1 20.7 140.9 20.7 34 0 98.1-26.5 160.1-26.5 27.1 0 108.9 2.6 168.9 80.3zm-234.5-161.8c28.4-35.8 48.5-85.2 48.5-134.6 0-6.8-.5-13.7-1.7-19.2-45.9 1.7-100.8 30.6-133.8 71.3-25.8 30.3-50.9 79.7-50.9 130.2 0 7.3 1.1 14.6 1.7 16.9 3.1.5 8.1 1.1 13.1 1.1 41 0 91.7-27.1 123.1-65.7z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <p className="text-center text-sm mt-8" style={{ color: "#aaa" }}>
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold hover:opacity-70 transition-opacity" style={{ color: "#111" }}>
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs mt-4" style={{ color: "#ccc" }}>
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:opacity-60" style={{ color: "#aaa" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:opacity-60" style={{ color: "#aaa" }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}