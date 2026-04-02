import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { authorEmail, authorName, commenterName, postTitle, postSlug, commentText } = await req.json();

  await resend.emails.send({
    from: "FrontPage <hello@frontpageapp.com>",
    to: authorEmail,
    subject: `${commenterName} commented on "${postTitle}"`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
        <p style="font-size: 20px; font-weight: 700; color: #0f0f0f; margin-bottom: 16px;">New comment on your post</p>
        <p style="font-size: 14px; color: #555; margin-bottom: 4px;"><strong>${commenterName}</strong> commented on <strong>${postTitle}</strong>:</p>
        <div style="border-left: 3px solid #2979FF; padding: 12px 16px; margin: 16px 0; background: var(--blue-bg); border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; color: #333; margin: 0;">${commentText}</p>
        </div>
        <a href="https://frontpageapp.com/p/${postSlug}"
          style="display: inline-block; background: #2979FF; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
          View comment →
        </a>
        <p style="font-size: 12px; color: #aaa; margin-top: 40px;">
          You're receiving this because someone commented on your FrontPage post.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}