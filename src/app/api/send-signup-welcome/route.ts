import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email, fullName, interests, userId } = await req.json();

  // Get recommended writers based on interests
  let recommendedWriters: any[] = [];

  if (interests && interests.length > 0) {
    const { data } = await supabaseAdmin.rpc("get_recommended_writers", {
      interest_tags: interests,
      exclude_id: userId,
    });
    recommendedWriters = data || [];
  }

  // Fall back to most prolific writers if no interest matches
  if (recommendedWriters.length < 3) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio")
      .neq("id", userId)
      .limit(4);
    recommendedWriters = data || [];
  }

  const interestTags = interests && interests.length > 0
    ? interests.map((i: string) => `<span style="display:inline-block;background:var(--blue-bg);color:#2979FF;padding:3px 10px;border-radius:999px;font-size:12px;margin:2px;">${i}</span>`).join(" ")
    : "";

  const writerCards = recommendedWriters.slice(0, 3).map((w: any) => `
    <a href="https://frontpageapp.com/profile/${w.username}" style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #f3f4f6;border-radius:12px;margin-bottom:8px;text-decoration:none;">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--blue-bg);display:flex;align-items:center;justify-content:center;font-weight:700;color:#2979FF;font-size:16px;flex-shrink:0;">
        ${w.avatar_url
          ? `<img src="${w.avatar_url}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />`
          : w.full_name?.[0]?.toUpperCase()
        }
      </div>
      <div>
        <p style="margin:0;font-weight:600;color:#0f0f0f;font-size:14px;">${w.full_name}</p>
        <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.4;">${w.bio || ""}</p>
      </div>
    </a>
  `).join("");

  await resend.emails.send({
    from: "FrontPage <hello@frontpageapp.com>",
    to: email,
    subject: `Welcome to FrontPage, ${fullName} 👋`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#ffffff;">

        <p style="font-size:28px;font-weight:700;color:#0f0f0f;margin:0 0 8px;">Welcome to FrontPage</p>
        <p style="font-size:15px;color:#6b7280;margin:0 0 32px;line-height:1.6;">
          Hi ${fullName}, your account is ready. You're now part of the home for independent fashion writing.
        </p>

        ${interestTags ? `
        <div style="margin-bottom:32px;">
          <p style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Your interests</p>
          <div>${interestTags}</div>
          <p style="font-size:13px;color:#9ca3af;margin:10px 0 0;">Your For You feed is already personalised around these topics.</p>
        </div>
        ` : ""}

        ${writerCards ? `
        <div style="margin-bottom:32px;">
          <p style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Writers you might like</p>
          ${writerCards}
        </div>
        ` : ""}

        <a href="https://frontpageapp.com/explore"
          style="display:inline-block;background:#2979FF;color:white;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:40px;">
          Start reading →
        </a>

        <div style="border-top:1px solid #f3f4f6;padding-top:24px;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            You're receiving this because you created an account on FrontPage.<br/>
            <a href="https://frontpageapp.com" style="color:#9ca3af;">frontpageapp.com</a>
          </p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}