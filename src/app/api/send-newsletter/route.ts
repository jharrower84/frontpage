import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { subscribers, subject, body, authorName, authorUsername, publicationName } = await req.json();

  const publication = publicationName || authorName;

  const results = await Promise.allSettled(
    subscribers.map(({ email, name }: { email: string; name: string }) =>
      resend.emails.send({
        from: `${publication} <hello@frontpageapp.com>`,
        to: email,
        subject,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
            <p style="font-size: 13px; color: #aaa; margin-bottom: 32px;">${publication} · FrontPage Newsletter</p>
            <div style="font-size: 15px; color: #333; line-height: 1.7; white-space: pre-wrap;">${body}</div>
            <div style="border-top: 1px solid #f3f4f6; margin-top: 40px; padding-top: 24px;">
              <a href="https://frontpageapp.com/profile/${authorUsername}"
                style="font-size: 13px; color: #e8a0a0; text-decoration: none; font-weight: 600;">
                Read more from ${publication} →
              </a>
            </div>
            <p style="font-size: 12px; color: #aaa; margin-top: 24px;">
              You're receiving this because you subscribed to ${publication} on FrontPage.<br/>
              <a href="https://frontpageapp.com/unsubscribe?author=${authorUsername}&email=${encodeURIComponent(email)}" style="color: #aaa;">Unsubscribe</a>
            </p>
          </div>
        `,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed });
}