"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  const noSidebar = pathname === "/signin" || pathname === "/signup" || pathname === "/onboarding" || pathname.startsWith("/[");

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

  const showSidebar = loggedIn && !noSidebar;

  return (
    <>
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? "lg:ml-56 pt-14 lg:pt-0" : ""}>
        {children}
      </main>
    </>
  );
}