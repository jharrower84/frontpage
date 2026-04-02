import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log("=== POST /api/posts/update called ===");
  console.log("SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const cookieStore = await cookies();
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    console.log("Auth user:", user?.id, "Auth error:", authError?.message);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { postId, ...updates } = body;
    console.log("postId:", postId, "update keys:", Object.keys(updates));

    const { data: post, error: fetchError } = await serviceSupabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    console.log("Post fetch:", post, "Fetch error:", fetchError?.message);

    if (!post || post.author_id !== user.id) {
      console.log("Forbidden - post.author_id:", post?.author_id, "user.id:", user.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await serviceSupabase
      .from("posts")
      .update(updates)
      .eq("id", postId);

    console.log("Update error:", updateError?.message);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error("Unexpected error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}