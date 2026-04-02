import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId, fullName, username } = await req.json();

  const { error } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    full_name: fullName,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
    bio: "",
    interests: [],
    onboarded: false,
  });

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}