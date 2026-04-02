"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Link from "next/link";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  const noChrome = ["/signin", "/signup"].includes(pathname) || pathname.startsWith("/onboarding") || (pathname === "/" && !loggedIn);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!checked) return null;

  if (noChrome) {
    return <main>{children}</main>;
  }

  if (!loggedIn) {
    return (
      <>
        <div
          className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
          style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/" className="text-base font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            FrontPage
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm" style={{ color: "var(--text-tertiary)" }}>Sign in</Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: "#2979FF" }}
            >
              Get started
            </Link>
          </div>
        </div>
        <main className="pt-14">{children}</main> 
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Sidebar />
      <main style={{ marginLeft: "192px", paddingTop: "56px" }}>
        {children}
      </main>
    </>
  );
}