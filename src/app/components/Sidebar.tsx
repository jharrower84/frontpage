"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import SearchModal from "./SearchModal";

interface Profile {
  full_name: string;
  username: string;
  avatar_url: string | null;
}

const NAV = [
  { href: "/", label: "Home", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  { href: "/subscriptions", label: "Subscriptions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/notifications", label: "Activity", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { href: "/notes", label: "Notes", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { href: "/explore", label: "Explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/reading-list", label: "Reading list", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
];

const NAV2 = [
  { href: "/dashboard", label: "Dashboard", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
  { href: "/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).single()
        .then(({ data }) => setProfile(data));
      supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id).eq("read", false)
        .then(({ count }) => setUnread(count || 0));
    });
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile";

  const NavContent = () => (
    <div style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }} className="h-full flex flex-col">
      <div className="px-4 py-5">
        <Link href="/" className="text-lg font-bold" style={{ color: "var(--text-primary)" }} onClick={() => setMobileOpen(false)}>
          FrontPage
        </Link>
      </div>

      {/* Search button */}
      <div className="px-2 mb-2">
        <button
          onClick={() => { setSearchOpen(true); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
          style={{ background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <span className="flex-1 text-left text-sm">Search...</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-faint)" }}>⌘K</span>
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={isActive(href)
              ? { color: "var(--pink-active)", backgroundColor: "var(--pink-bg)", fontWeight: 600 }
              : { color: "var(--text-secondary)" }
            }>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            <span>{label}</span>
            {href === "/notifications" && unread > 0 && (
              <span className="ml-auto text-xs rounded-full px-1.5 py-0.5 text-white font-semibold" style={{ backgroundColor: "var(--pink)" }}>
                {unread}
              </span>
            )}
          </Link>
        ))}

        <div className="my-2" style={{ borderTop: "1px solid var(--border)" }} />

        {NAV2.map(({ href, label, icon }) => {
          const resolvedHref = label === "Profile" ? profileHref : href;
          return (
            <Link key={href} href={resolvedHref} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={isActive(href)
                ? { color: "var(--pink-active)", backgroundColor: "var(--pink-bg)", fontWeight: 600 }
                : { color: "var(--text-secondary)" }
              }>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {label}
            </Link>
          );
        })}

        {/* Admin link — only visible to jharrower */}
        {profile?.username === "jharrower" && (
          <Link href="/dashboard/admin" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={isActive("/dashboard/admin")
              ? { color: "var(--pink-active)", backgroundColor: "var(--pink-bg)", fontWeight: 600 }
              : { color: "var(--text-secondary)" }
            }>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin
          </Link>
        )}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/dashboard/new" onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold mb-4 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--pink)" }}>
          ✏️ Write
        </Link>
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0" style={{ backgroundColor: "var(--pink)" }}>
              {profile?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{profile?.full_name}</p>
            <button onClick={handleSignOut} className="text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
              Sign out
            </button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>FrontPage</Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="p-2" style={{ color: "var(--text-secondary)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2" style={{ color: "var(--text-secondary)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-56 z-50">
        <NavContent />
      </div>
    </>
  );
}