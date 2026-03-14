import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, fullName } = await req.json();

  await resend.emails.send({
    from: "FrontPage <hello@frontpageapp.com>",
    to: email,
    subject: "Welcome to FrontPage",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
        <p style="font-size: 24px; font-weight: 700; color: #0f0f0f; margin-bottom: 16px;">Welcome to FrontPage, ${fullName}! 👋</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 24px;">
          You've just joined the home for independent fashion writing. Here's what you can do:
        </p>
        <div style="background: #fdf2f2; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #333;">✍️ <strong>Write</strong> — publish your fashion perspective to the world</p>
          <p style="margin: 0 0 12px; font-size: 14px; color: #333;">📖 <strong>Read</strong> — discover writers who actually know fashion</p>
          <p style="margin: 0; font-size: 14px; color: #333;">🔔 <strong>Subscribe</strong> — follow your favourites and never miss a post</p>
        </div>
        <a href="https://frontpageapp.com/explore"
          style="display: inline-block; background: #e8a0a0; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 32px;">
          Explore FrontPage →
        </a>
        <p style="font-size: 12px; color: #aaa; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 24px;">
          You're receiving this because you created an account on FrontPage.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}