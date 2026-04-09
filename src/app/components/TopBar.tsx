"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import SearchModal from "./SearchModal";

interface Profile {
  username: string;
  avatar_url: string | null;
  full_name: string;
  approved_creator: boolean;
}

export default function TopBar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fetchUnread = useCallback(async (userId: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    setUnread(count || 0);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      supabase.from("profiles").select("username, avatar_url, full_name, approved_creator")
        .eq("id", user.id).single()
        .then(({ data }) => setProfile(data));

      fetchUnread(user.id);

      channel = supabase
        .channel("topbar-notifications")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, () => fetchUnread(user.id))
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, () => fetchUnread(user.id))
        .on("postgres_changes", {
          event: "DELETE",
          schema: "public",
          table: "notifications",
        }, () => fetchUnread(user.id))
        .subscribe();
    });

    const handleRead = () => setUnread(0);
    window.addEventListener("notifications-read", handleRead);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("notifications-read", handleRead);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => setMobileNavOpen(e.detail.open);
    window.addEventListener("sidebarToggle" as any, handler);
    return () => window.removeEventListener("sidebarToggle" as any, handler);
  }, []);

  const toggleMobileNav = () => {
    const next = !mobileNavOpen;
    setMobileNavOpen(next);
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { open: next } }));
  };

  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile";
  const createHref = profile?.approved_creator ? "/dashboard/new" : "/apply";

  return (
    <>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 lg:px-6"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 -ml-1"
            style={{ color: "var(--text-secondary)" }}
            onClick={toggleMobileNav}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              {mobileNavOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>

          <Link
            href="/"
            className="text-lg font-bold shrink-0"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            FrontPage
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-faint)",
              width: "220px",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <span className="flex-1 text-left text-xs">Search...</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-faint)", fontSize: "10px" }}
            >
              ⌘K
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="lg:hidden p-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          <Link
            href={createHref}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2979FF", color: "white" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {profile?.approved_creator ? "Create" : "Apply"}
          </Link>

          <Link
            href={createHref}
            className="sm:hidden p-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>

          <Link
            href="/notifications"
            className="relative p-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-semibold"
                style={{ backgroundColor: "#e03535", fontSize: "9px" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <Link href={profileHref} className="shrink-0 ml-1">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
              >
                {profile?.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}