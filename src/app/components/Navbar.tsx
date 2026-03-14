"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUsername(session.user.id);
          await loadUnread(session.user.id);
        } else {
          setUser(null);
          setUsername(null);
          setUnread(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await loadUsername(user.id);
      await loadUnread(user.id);
    }
  };

  const loadUsername = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (data) setUsername(data.username);
  };

  const loadUnread = async (userId: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    setUnread(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link href="/" className="text-xl font-bold tracking-tight text-black">
            FrontPage
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/explore" className="text-sm text-gray-600 hover:text-black transition-colors">
              Explore
            </Link>

            {user ? (
              <>
                <Link href={`/profile/${username}`} className="text-sm text-gray-600 hover:text-black transition-colors">
                  Profile
                </Link>
                <Link href="/notifications" className="text-sm text-gray-600 hover:text-black transition-colors relative">
                  Notifications
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-3 w-4 h-4 bg-black text-white text-xs rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </Link>
                <Link href="/reading-list" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Reading list
                </Link>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Settings
                </Link>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/new" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  Write
                </Link>
                <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-black transition-colors">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Sign in
                </Link>
                <Link href="/signup" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  Get started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}