import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend("re_WbCHj9NW_MVKf5tYSWw3sC2hGHbje596g");

export async function POST(req: Request) {
  const { applicationId, action, rejectionReason, adminId } = await req.json();

  if (adminId !== "cd7ec406-45d0-4026-9566-f20a833fe392") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: application } = await supabaseAdmin
    .from("creator_applications")
    .select("*, profiles!creator_applications_user_id_fkey(full_name, username)")
    .eq("id", applicationId)
    .single();

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userEmail = await supabaseAdmin.auth.admin.getUserById(application.user_id);
  const email = userEmail.data.user?.email;
  const fullName = application.full_name;

  if (action === "approve") {
    await supabaseAdmin.from("profiles").update({ approved_creator: true }).eq("id", application.user_id);
    await supabaseAdmin.from("creator_applications").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    }).eq("id", applicationId);

    await supabaseAdmin.from("notifications").insert({
      user_id: application.user_id,
      actor_id: adminId,
      type: "creator_approved",
      message: "Your creator application has been approved! You can now publish on FrontPage.",
    });

    if (email) {
      await resend.emails.send({
        from: "FrontPage <hello@frontpageapp.com>",
        to: email,
        subject: "Your FrontPage Creator Application has been Approved! 🎉",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.02em;">Welcome to FrontPage, ${fullName}! 🎉</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 24px;">Your creator application has been approved. You can now publish articles on FrontPage and start building your audience.</p>
            <a href="https://frontpageapp.com/dashboard/new" style="display: inline-block; background: #2979FF; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">Start writing</a>
            <p style="font-size: 13px; color: #999; margin-top: 32px;">The FrontPage team</p>
          </div>
        `,
      });
    }
  }

  if (action === "reject") {
    await supabaseAdmin.from("creator_applications").update({
      status: "rejected",
      rejection_reason: rejectionReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    }).eq("id", applicationId);

    await supabaseAdmin.from("notifications").insert({
      user_id: application.user_id,
      actor_id: adminId,
      type: "creator_rejected",
      message: `Your creator application was not approved. Feedback: ${rejectionReason}`,
    });

    if (email) {
      await resend.emails.send({
        from: "FrontPage <hello@frontpageapp.com>",
        to: email,
        subject: "Update on your FrontPage Creator Application",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.02em;">Update on your application</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">Thank you for applying to become a creator on FrontPage. After reviewing your application, we're not able to approve it at this time.</p>
            <div style="background: #f5f5f5; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
              <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 8px;">Feedback</p>
              <p style="font-size: 14px; color: #444; margin: 0;">${rejectionReason}</p>
            </div>
            <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 24px;">You're welcome to reapply at any time addressing the feedback above.</p>
            <a href="https://frontpageapp.com/apply" style="display: inline-block; background: #2979FF; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">Reapply now</a>
            <p style="font-size: 13px; color: #999; margin-top: 32px;">The FrontPage team</p>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ ok: true });
}