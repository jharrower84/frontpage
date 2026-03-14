import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { subscriberEmail, subscriberName, authorName, authorUsername, publicationName } = await req.json();

  const publication = publicationName || authorName;

  await resend.emails.send({
    from: "FrontPage <hello@frontpageapp.com>",
    to: subscriberEmail,
    subject: `You're now subscribed to ${publication}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
        <p style="font-size: 24px; font-weight: 700; color: #0f0f0f; margin-bottom: 8px;">Welcome to ${publication}</p>
        <p style="font-size: 16px; color: #555; margin-bottom: 24px;">
          Hi ${subscriberName || "there"},<br/><br/>
          You're now subscribed to <strong>${publication}</strong> by ${authorName} on FrontPage.
          You'll receive their latest posts and newsletters directly here.
        </p>
        <a href="https://frontpageapp.com/profile/${authorUsername}"
          style="display: inline-block; background: #e8a0a0; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Visit ${publication}
        </a>
        <p style="font-size: 12px; color: #aaa; margin-top: 40px;">
          You're receiving this because you subscribed on FrontPage.<br/>
          <a href="https://frontpageapp.com/unsubscribe?author=${authorUsername}&email=${subscriberEmail}" style="color: #aaa;">Unsubscribe</a>
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}