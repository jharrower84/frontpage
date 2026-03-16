"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
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

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const res = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          fullName,
          username,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to create profile");
        setLoading(false);
        return;
      }
    }

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex w-1/2 items-center justify-center p-12" style={{ backgroundColor: "#fdf2f2" }}>
        <div className="max-w-sm">
          <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
            Your voice in fashion starts here.
          </h1>
          <p className="text-gray-500">
            Write, publish and grow your audience on FrontPage — built for fashion.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-xl font-bold text-black block mb-10">
            FrontPage
          </Link>

          <h2 className="text-2xl font-bold text-black mb-2">Create your account</h2>
          <p className="text-gray-400 text-sm mb-8">Free forever. No credit card needed.</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
                placeholder="janesmith" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: "#e8a0a0" }}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/signin" className="text-black font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}