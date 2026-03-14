"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  authorId: string;
  subscriberCount: number;
  loading?: boolean;
}

export default function NewsletterComposer({ authorId, subscriberCount, loading }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [preview, setPreview] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("profiles!subscriptions_subscriber_id_fkey(id, full_name)")
      .eq("author_id", authorId);

    const { data: author } = await supabase
      .from("profiles")
      .select("full_name, username, publication_name")
      .eq("id", authorId)
      .single();

    // Get subscriber emails via auth — fetch each user's email
    const subscriberIds = subs?.map((s: any) => s.profiles.id) || [];

    // Create in-app notifications
    if (subs && subs.length > 0) {
      await supabase.from("notifications").insert(
        subs.map((s: any) => ({
          recipient_id: s.profiles.id,
          actor_id: authorId,
          type: "newsletter",
          message: `${author?.full_name} sent a newsletter: "${subject}"`,
          read: false,
          created_at: new Date().toISOString(),
        }))
      );
    }

    // Get emails for each subscriber
    const emailPromises = subscriberIds.map(async (id: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", id)
        .single();

      // Get auth email
      const res = await fetch(`/api/get-user-email?id=${id}`);
      const { email } = await res.json();

      return { email, name: profile?.full_name || "" };
    });

    const subscribers = (await Promise.all(emailPromises)).filter((s) => s.email);

    if (subscribers.length > 0) {
      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribers,
          subject,
          body,
          authorName: author?.full_name,
          authorUsername: author?.username,
          publicationName: author?.publication_name,
        }),
      });
      const { sent } = await res.json();
      setSentCount(sent);
    }

    setSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSubject("");
      setBody("");
    }, 4000);
  };

  if (loading) return <div className="text-center py-16"><p className="text-gray-400 text-sm">Loading...</p></div>;

  if (subscriberCount === 0) return (
    <div className="text-center py-16">
      <p className="text-3xl mb-3">✉️</p>
      <p className="text-gray-500 font-medium mb-1">No subscribers yet</p>
      <p className="text-gray-400 text-sm">Once you have subscribers, you can send them newsletters directly from here.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-black">Send newsletter</h2>
          <p className="text-sm text-gray-400 mt-0.5">Will notify {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setPreview(!preview)} className="text-sm text-gray-400 hover:text-black transition-colors">
          {preview ? "← Edit" : "Preview →"}
        </button>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest block mb-1.5">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
              placeholder="Write your message..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none leading-relaxed" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-300">{body.length} characters</p>
            <button onClick={handleSend} disabled={!subject.trim() || !body.trim() || sending || sent}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ backgroundColor: sent ? "#86efac" : "#e8a0a0" }}>
              {sent ? `✓ Sent to ${sentCount} readers` : sending ? "Sending..." : `Send to ${subscriberCount} readers`}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Preview</p>
            <p className="font-semibold text-black">{subject || "No subject"}</p>
          </div>
          <div className="p-6">
            <div className="max-w-sm mx-auto">
              <p className="text-xs text-gray-400 mb-4 text-center">FrontPage Newsletter</p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{body || <span className="text-gray-300">No content yet</span>}</div>
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">Sent via FrontPage</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}