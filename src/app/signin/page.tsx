"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) router.replace("/");
  });
}, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    if (error) setError(error.message);
  };

  const handleAppleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-12" style={{ backgroundColor: "#eef3ff" }}>
        <div className="max-w-sm">
          <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
            Fashion writing for the next generation.
          </h1>
          <p className="text-gray-500">
            Join thousands of fashion writers and readers on FrontPage.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-xl font-bold text-black block mb-10">
            FrontPage
          </Link>

          <h2 className="text-2xl font-bold text-black mb-2">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Email form */}
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                    Password
                  </label>
                  <Link href="/reset-password" className="text-xs text-gray-400 hover:text-black transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: "#2979FF" }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </button>

            {/* Facebook — coming soon */}
            <button
              onClick={() => alert("Facebook sign in is coming soon.")}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-400 flex items-center justify-center gap-3 cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
              <span className="ml-1 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Coming soon</span>
            </button>

            {/* Apple */}
            <button
              onClick={handleAppleSignIn}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 411.6 48.5 292.8 82.2 224.2c23.3-48.5 63-89.6 112.2-114.3 45.1-22.9 96.1-33.8 146.2-33.8 54.7 0 105.1 20.7 140.9 20.7 34 0 98.1-26.5 160.1-26.5 27.1 0 108.9 2.6 168.9 80.3zm-234.5-161.8c28.4-35.8 48.5-85.2 48.5-134.6 0-6.8-.5-13.7-1.7-19.2-45.9 1.7-100.8 30.6-133.8 71.3-25.8 30.3-50.9 79.7-50.9 130.2 0 7.3 1.1 14.6 1.7 16.9 3.1.5 8.1 1.1 13.1 1.1 41 0 91.7-27.1 123.1-65.7z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-black font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}