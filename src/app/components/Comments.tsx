"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface Props {
  postId: string;
  authorId: string;
  postSlug: string;
  postTitle: string;
}

export default function Comments({ postId, authorId, postSlug, postTitle }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const roots: Comment[] = [];
    const map: Record<string, Comment> = {};

    data.forEach((c: Comment) => { map[c.id] = { ...c, replies: [] }; });
    data.forEach((c: Comment) => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    setComments(roots);
  };

  const submitComment = async (content: string, parentId: string | null = null) => {
    if (!content.trim() || !userId) return;
    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      author_id: authorId,
      content: content.trim(),
      parent_id: parentId,
    });

    if (!error) {
      // In-app notification
      if (userId !== authorId) {
        await supabase.from("notifications").insert({
          recipient_id: authorId,
          actor_id: userId,
          type: "comment",
          post_id: postId,
          read: false,
        });

        // Email notification
        try {
          const [commenterRes, authorRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", userId).single(),
            supabase.from("profiles").select("full_name").eq("id", authorId).single(),
          ]);

          const emailRes = await fetch(`/api/get-user-email?id=${authorId}`);
          const { email: authorEmail } = await emailRes.json();

          if (authorEmail) {
            await fetch("/api/send-comment-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                authorEmail,
                authorName: authorRes.data?.full_name,
                commenterName: commenterRes.data?.full_name,
                postTitle,
                postSlug,
                commentText: content.trim(),
              }),
            });
          }
        } catch (e) {
          console.error("Comment email failed:", e);
        }
      }

      setNewComment("");
      setReplyText("");
      setReplyingTo(null);
      loadComments();
    }

    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    loadComments();
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className={depth > 0 ? "ml-8 mt-3" : ""}>
      <div className="flex gap-3">
        {comment.profiles?.avatar_url ? (
          <img src={comment.profiles.avatar_url} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" alt="" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold text-pink-700 shrink-0 mt-0.5">
            {comment.profiles?.full_name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{comment.profiles?.full_name}</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatTime(comment.created_at)}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{comment.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {userId && depth === 0 && (
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
                Reply
              </button>
            )}
            {userId === comment.user_id && (
              <button onClick={() => deleteComment(comment.id)} className="text-xs text-red-300 hover:text-red-500 transition-colors">
                Delete
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.profiles?.full_name}...`}
                className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid var(--border-strong)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                onKeyDown={(e) => e.key === "Enter" && submitComment(replyText, comment.id)}
                autoFocus />
              <button onClick={() => submitComment(replyText, comment.id)} disabled={!replyText.trim() || submitting}
                className="text-xs px-3 py-2 rounded-xl text-white font-medium disabled:opacity-40"
                style={{ backgroundColor: "#2979FF" }}>
                Reply
              </button>
              <button onClick={() => setReplyingTo(null)} className="text-xs px-2 py-2" style={{ color: "var(--text-tertiary)" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 pl-3" style={{ borderLeft: "2px solid var(--border)" }}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="mt-12">
      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "24px" }} />
      <h3 className="text-base font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        {totalCount > 0 ? `${totalCount} comment${totalCount !== 1 ? "s" : ""}` : "Comments"}
      </h3>

      {userId ? (
        <div className="flex gap-3 mb-8">
          <div className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold text-pink-700 shrink-0 mt-0.5">U</div>
          <div className="flex-1">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ border: "1px solid var(--border-strong)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              onKeyDown={(e) => e.key === "Enter" && submitComment(newComment)} />
            {newComment.trim() && (
              <button onClick={() => submitComment(newComment)} disabled={submitting}
                className="mt-2 text-xs px-4 py-2 rounded-xl text-white font-medium disabled:opacity-40"
                style={{ backgroundColor: "#2979FF" }}>
                {submitting ? "Posting..." : "Post comment"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
          <a href="/signin" className="font-medium hover:underline" style={{ color: "var(--text-primary)" }}>Sign in</a> to leave a comment.
        </p>
      )}

      <div className="space-y-5">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}