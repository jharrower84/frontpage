"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppearanceModal from "./AppearanceModal";

const NAV = [
  { href: "/", label: "Home", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  { href: "/messages", label: "Messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { href: "/explore", label: "Explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/reading-list", label: "Reading list", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
  { href: "/dashboard", label: "Dashboard", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
];

const DASHBOARD_SUB = [
  { tab: "live", label: "Live posts" },
  { tab: "drafts", label: "Drafts" },
  { tab: "subscribers", label: "Subscribers" },
  { tab: "stats", label: "Stats" },
];

interface FollowedWriter {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  post_count: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [following, setFollowing] = useState<FollowedWriter[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUnreadMessages = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", uid)
      .eq("read", false);
    setUnreadMessages(count || 0);
  }, []);

  const fetchPendingAdminCount = useCallback(async () => {
    const [reports, pubRequests] = await Promise.all([
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("publisher_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const total = (reports.count || 0) + (pubRequests.count || 0);
    console.log("Admin badge count:", total, "reports:", reports.count, "pubRequests:", pubRequests.count, "errors:", reports.error, pubRequests.error);
    setPendingAdminCount(total);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      supabase.from("profiles").select("username").eq("id", user.id).single()
        .then(async ({ data }) => {
          const uname = data?.username || null;
          setUsername(uname);
          if (uname === "jharrower") {
            const [reports, pubRequests] = await Promise.all([
              supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
              supabase.from("publisher_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
            ]);
            const total = (reports.count || 0) + (pubRequests.count || 0);
            console.log("Admin badge:", total);
            setPendingAdminCount(total);
          }
        });

      fetchUnreadMessages(user.id);
      loadFollowing(user.id);

      channel = supabase
        .channel("sidebar-messages")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        }, () => fetchUnreadMessages(user.id))
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        }, () => fetchUnreadMessages(user.id))
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "reports",
        }, () => fetchPendingAdminCount())
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "reports",
        }, () => fetchPendingAdminCount())
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "publisher_requests",
        }, () => fetchPendingAdminCount())
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "publisher_requests",
        }, () => fetchPendingAdminCount())
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const loadFollowing = async (uid: string) => {
    const { data: subs } = await supabase
      .from("subscriptions").select("author_id").eq("subscriber_id", uid);
    if (!subs || subs.length === 0) return;
    const authorIds = subs.map((s) => s.author_id);
    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name, username, avatar_url").in("id", authorIds);
    if (!profiles) return;
    const withCounts = await Promise.all(
      profiles.map(async (p) => {
        const { count } = await supabase.from("posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", p.id).eq("published", true);
        return { ...p, post_count: count || 0 };
      })
    );
    withCounts.sort((a, b) => b.post_count - a.post_count);
    setFollowing(withCounts.slice(0, 8));
  };

  useEffect(() => {
    const handler = (e: CustomEvent) => setMobileOpen(e.detail.open);
    window.addEventListener("sidebarToggle" as any, handler);
    return () => window.removeEventListener("sidebarToggle" as any, handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isDashboardActive = pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/admin");
  const isCreateActive = pathname === "/dashboard/new";

  const getSubActive = (tab: string) =>
    searchParams.get("tab") === tab ||
    (tab === "live" && pathname === "/dashboard" && !searchParams.get("tab"));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const closeMobile = () => {
    setMobileOpen(false);
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { open: false } }));
  };

  const renderNav = (onClose?: () => void) => (
    <nav className="flex-1 px-3 py-2 space-y-px overflow-y-auto">
      {NAV.map(({ href, label, icon }) => {
        const active = href === "/dashboard"
          ? isDashboardActive
          : href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group"
            style={{
              color: active ? "#2979FF" : "var(--text-secondary)",
              fontWeight: active ? 600 : 400,
              background: active ? "var(--bg-secondary)" : "transparent",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? 2 : 1.6}
              className="w-4 h-4 shrink-0"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            <span className={active ? "" : "group-hover:text-blue-500 transition-colors"}>
              {label}
            </span>
            {href === "/messages" && unreadMessages > 0 && (
              <span
                className="ml-auto text-xs rounded-full px-1.5 py-0.5 text-white font-semibold"
                style={{ backgroundColor: "#2979FF", fontSize: "10px" }}
              >
                {unreadMessages}
              </span>
            )}
          </Link>
        );
      })}

      {isDashboardActive && (
        <div style={{ marginLeft: "14px", borderLeft: "2px solid var(--border)", paddingLeft: "10px", paddingTop: "2px", paddingBottom: "2px" }}>
          <Link
            href="/dashboard/new"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors group"
            style={{
              color: isCreateActive ? "#2979FF" : "var(--text-secondary)",
              fontWeight: isCreateActive ? 600 : 400,
              background: isCreateActive ? "var(--bg-secondary)" : "transparent",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3.5 h-3.5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className={isCreateActive ? "" : "group-hover:text-blue-500 transition-colors"}>
              New post
            </span>
          </Link>

          <div style={{ height: "1px", background: "var(--border)", margin: "4px 0 4px 0" }} />

          {DASHBOARD_SUB.map(({ tab, label }) => {
            const subActive = getSubActive(tab);
            return (
              <Link
                key={tab}
                href={`/dashboard?tab=${tab}`}
                onClick={onClose}
                className="flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors group"
                style={{
                  color: subActive ? "#2979FF" : "var(--text-secondary)",
                  fontWeight: subActive ? 600 : 400,
                  background: subActive ? "var(--bg-secondary)" : "transparent",
                }}
              >
                <span className={subActive ? "" : "group-hover:text-blue-500 transition-colors"}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {username === "jharrower" && (
        <Link
          href="/dashboard/admin"
          onClick={() => { onClose?.(); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group"
          style={{
            color: isActive("/dashboard/admin") ? "#2979FF" : "var(--text-secondary)",
            fontWeight: isActive("/dashboard/admin") ? 600 : 400,
            background: isActive("/dashboard/admin") ? "var(--bg-secondary)" : "transparent",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="group-hover:text-blue-500 transition-colors">Admin</span>
          {pendingAdminCount > 0 && (
            <span
              className="ml-auto text-xs rounded-full px-1.5 py-0.5 text-white font-semibold"
              style={{ backgroundColor: "#2979FF", fontSize: "10px" }}
            >
              {pendingAdminCount}
            </span>
          )}
        </Link>
      )}

      {following.length > 0 && (
        <div className="pt-0">
          <div className="px-3 pb-2 pt-5" style={{ borderTop: "1px solid var(--border)", marginTop: "5px", marginBottom: "5px" }}>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: "#2979FF" }}>Following</p>
            </div>
          </div>
          {following.map((writer) => (
            <Link
              key={writer.id}
              href={`/${writer.username}`}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors group"
              style={{ color: "var(--text-secondary)" }}
            >
              {writer.avatar_url ? (
                <img src={writer.avatar_url} alt={writer.full_name} className="rounded-full object-cover shrink-0" style={{ width: 22, height: 22 }} />
              ) : (
                <div className="rounded-full shrink-0 flex items-center justify-center font-semibold"
                  style={{ width: 22, height: 22, background: "var(--bg-tertiary)", color: "var(--text-faint)", fontSize: 9 }}>
                  {writer.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs truncate group-hover:text-blue-500 transition-colors">
                {writer.full_name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );

  const renderBottomMenu = () => (
    <div className="px-3 py-4 relative" style={{ borderTop: "1px solid var(--border)" }} ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span>More</span>
      </button>

      {menuOpen && (
        <div
          className="absolute bottom-full left-3 right-3 mb-2 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="py-1">
            <button
              onClick={() => { setMenuOpen(false); setShowAppearance(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Appearance
            </button>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <Link
              href="/help"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleSignOut(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}

      {showAppearance && <AppearanceModal onClose={() => setShowAppearance(false)} />}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={closeMobile} />
      )}

      <div className={`lg:hidden fixed top-14 left-0 z-50 h-[calc(100vh-56px)] w-48 transform transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }} className="h-full flex flex-col">
          {renderNav(closeMobile)}
          {renderBottomMenu()}
        </div>
      </div>

      <div className="hidden lg:block fixed top-14 left-0 h-[calc(100vh-56px)] w-48 z-40">
        <div style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }} className="h-full flex flex-col">
          {renderNav()}
          {renderBottomMenu()}
        </div>
      </div>
    </>
  );
}