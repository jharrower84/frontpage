"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Note {
  id: string;
  content: string;
  created_at: string;
  restack_of: string | null;
  author_id: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  post?: {
    title: string;
    slug: string;
    cover_image: string | null;
    profiles: {
      full_name: string;
      username: string;
    };
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => setUserProfile(data));
      }
    });
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*, profiles(full_name, username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    // Load restacked posts
    const withPosts = await Promise.all(
      data.map(async (note) => {
        if (note.restack_of) {
          const { data: post } = await supabase
            .from("posts")
            .select("title, slug, cover_image, profiles(full_name, username)")
            .eq("id", note.restack_of)
            .single();
          return { ...note, post };
        }
        return note;
      })
    );

    setNotes(withPosts as any);
    setLoading(false);
  };

  const postNote = async () => {
    if (!newNote.trim() || !userId) return;
    setPosting(true);

    await supabase.from("notes").insert({
      author_id: userId,
      content: newNote.trim(),
    });

    setNewNote("");
    loadNotes();
    setPosting(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-black mb-8">Notes</h1>

      {/* Compose */}
      {userId && (
        <div className="flex gap-3 mb-10">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0 mt-0.5">
              {userProfile?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Share a thought, observation, or link..."
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            {newNote.trim() && (
              <button onClick={postNote} disabled={posting}
                className="mt-2 text-sm px-5 py-2 rounded-full text-white font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#e8a0a0" }}>
                {posting ? "Posting..." : "Post note"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-50 rounded-2xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No notes yet. Be the first to post one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
              <div className="flex gap-3">
                {note.profiles?.avatar_url ? (
                  <img src={note.profiles.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center text-sm font-bold text-pink-700 shrink-0">
                    {note.profiles?.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${note.profiles?.username}`} className="text-sm font-semibold text-black hover:underline">
                        {note.profiles?.full_name}
                      </Link>
                      <span className="text-xs text-gray-400">{formatTime(note.created_at)}</span>
                    </div>
                    {userId === note.author_id && (
                      <button onClick={() => deleteNote(note.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{note.content}</p>

                  {/* Restacked post preview */}
                  {note.post && (
                    <Link href={`/p/${note.post.slug}`}
                      className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      {note.post.cover_image && (
                        <img src={note.post.cover_image} className="w-16 h-12 object-cover rounded-lg shrink-0" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">
                          Restacked from {note.post.profiles?.full_name}
                        </p>
                        <p className="text-sm font-semibold text-black line-clamp-2">{note.post.title}</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}