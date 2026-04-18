"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteAccountButton from "@/app/components/DeleteAccountButton";
import AppearanceModal from "@/app/components/AppearanceModal";

export const metadata = {
  title: "Settings",
};

interface BlockedUser {
  blocked_id: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

const FASHION_TAGS = [
  "Trends", "Runway", "Street Style", "Sustainability",
  "Business of Fashion", "Beauty", "Accessories", "Menswear",
  "Womenswear", "Vintage", "Luxury", "High Street"
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [showAppearance, setShowAppearance] = useState(false);

  // Account
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState("");

  // Notifications
  const [notifPush, setNotifPush] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // Privacy
  const [privacyPublicProfile, setPrivacyPublicProfile] = useState(true);
  const [privacyShowActivity, setPrivacyShowActivity] = useState(true);
  const [privacyAllowMessages, setPrivacyAllowMessages] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Interests
  const [interests, setInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [savedInterests, setSavedInterests] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/signin"); return; }
      setUserId(user.id);
      setProvider(user.app_metadata?.provider || null);

      supabase.from("profiles").select("*").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setInterests(data.interests || []);
            setPrivacyPublicProfile(data.privacy_public_profile !== false);
            setPrivacyShowActivity(data.privacy_show_activity !== false);
            setPrivacyAllowMessages(data.privacy_allow_messages !== false);
            setNotifPush(data.notification_push !== false);
            setNotifLikes(data.notification_likes !== false);
            setNotifComments(data.notification_comments !== false);
            setNotifFollows(data.notification_follows !== false);
            setNotifEmail(data.notification_email !== false);
          }
          setLoading(false);
        });

      supabase
        .from("blocked_users")
        .select("blocked_id, profiles!blocked_users_blocked_id_fkey(full_name, username, avatar_url)")
        .eq("blocker_id", user.id)
        .then(({ data }) => {
          if (data) setBlockedUsers(data as any);
        });
    });
  }, []);

  const isSocialLogin = provider && provider !== "email";

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setEmailChangeLoading(true);
    setEmailChangeError("");
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailChangeError(error.message);
    } else {
      setEmailChangeSent(true);
      setNewEmail("");
    }
    setEmailChangeLoading(false);
  };

  const handleNotifToggle = async (field: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    setSavingNotif(true);
    if (!userId) return;
    await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
    setSavingNotif(false);
  };

  const handlePrivacyToggle = async (field: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    setSavingPrivacy(true);
    if (!userId) return;
    await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
    setSavingPrivacy(false);
  };

  const handleSaveInterests = async () => {
    if (!userId) return;
    setSavingInterests(true);
    await supabase.from("profiles").update({ interests }).eq("id", userId);
    setSavingInterests(false);
    setSavedInterests(true);
    setTimeout(() => setSavedInterests(false), 3000);
  };

  const handleUnblock = async (blockedId: string) => {
    setUnblocking(blockedId);
    await supabase.from("blocked_users").delete().eq("blocker_id", userId).eq("blocked_id", blockedId);
    setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    setUnblocking(null);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ backgroundColor: value ? "#2979FF" : "var(--border-strong)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-t pt-10 mb-10" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-faint)" }}>
        {title}
      </h2>
      {children}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {showAppearance && <AppearanceModal onClose={() => setShowAppearance(false)} />}

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Settings</h1>
      <p className="text-sm mb-10" style={{ color: "var(--text-tertiary)" }}>Manage your account and preferences.</p>

      {/* Account */}
      <Section title="Account">
        {isSocialLogin ? (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Signed in with {provider === "google" ? "Google" : "Apple"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Your password and email are managed by {provider === "google" ? "Google" : "Apple"}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Password</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Change your account password</p>
              </div>
              <Link href="/settings/password" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                Change
              </Link>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Email address</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>A confirmation link will be sent to your new address.</p>
              {emailChangeSent ? (
                <p className="text-xs font-medium" style={{ color: "#22c55e" }}>✓ Confirmation email sent. Check your inbox.</p>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={handleEmailChange}
                    disabled={!newEmail.trim() || emailChangeLoading}
                    className="text-xs font-medium px-4 py-2 rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90 shrink-0"
                    style={{ backgroundColor: "#2979FF" }}
                  >
                    {emailChangeLoading ? "Sending..." : "Update"}
                  </button>
                </div>
              )}
              {emailChangeError && <p className="text-xs mt-2" style={{ color: "#e05555" }}>{emailChangeError}</p>}
            </div>
          </div>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {[
            { label: "Push notifications", description: "Enable all push notifications", field: "notification_push", value: notifPush, setter: setNotifPush },
            { label: "Likes", description: "When someone likes your article", field: "notification_likes", value: notifLikes, setter: setNotifLikes },
            { label: "Comments", description: "When someone comments on your article", field: "notification_comments", value: notifComments, setter: setNotifComments },
            { label: "New followers", description: "When someone subscribes to you", field: "notification_follows", value: notifFollows, setter: setNotifFollows },
            { label: "Email notifications", description: "Receive updates by email", field: "notification_email", value: notifEmail, setter: setNotifEmail },
          ].map((item, i, arr) => (
            <div key={item.field} className="flex items-center justify-between px-4 py-3.5" style={{ background: "var(--bg-secondary)", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.description}</p>
              </div>
              <Toggle value={item.value} onChange={(v) => handleNotifToggle(item.field, v, item.setter)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {[
            { label: "Public profile", description: "Allow anyone to view your profile", field: "privacy_public_profile", value: privacyPublicProfile, setter: setPrivacyPublicProfile },
            { label: "Show activity", description: "Show your likes and comments on your profile", field: "privacy_show_activity", value: privacyShowActivity, setter: setPrivacyShowActivity },
            { label: "Allow messages", description: "Let other users send you direct messages", field: "privacy_allow_messages", value: privacyAllowMessages, setter: setPrivacyAllowMessages },
          ].map((item, i, arr) => (
            <div key={item.field} className="flex items-center justify-between px-4 py-3.5" style={{ background: "var(--bg-secondary)", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.description}</p>
              </div>
              <Toggle value={item.value} onChange={(v) => handlePrivacyToggle(item.field, v, item.setter)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Appearance</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Light, dark or system theme</p>
            </div>
            <button
              onClick={() => setShowAppearance(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              Change
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Publications</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Follow publications to see their articles in your feed</p>
            </div>
            <Link href="/settings/publishers" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              Manage
            </Link>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Your interests</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Personalise your For You feed</p>
              </div>
              <button
                onClick={handleSaveInterests}
                disabled={savingInterests}
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ backgroundColor: savedInterests ? "#22c55e" : "#2979FF" }}
              >
                {savedInterests ? "✓ Saved" : savingInterests ? "Saving..." : "Save"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {FASHION_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInterests((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                  className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                  style={interests.includes(tag)
                    ? { backgroundColor: "#2979FF", borderColor: "#2979FF", color: "white" }
                    : { borderColor: "var(--border)", color: "var(--text-secondary)" }
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
            {interests.length > 0 && (
              <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>{interests.length} selected</p>
            )}
          </div>
        </div>
      </Section>

      {/* Blocked users */}
      <Section title="Blocked users">
        {blockedUsers.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>You haven't blocked anyone.</p>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((b) => (
              <div key={b.blocked_id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  {b.profiles.avatar_url ? (
                    <img src={b.profiles.avatar_url} alt={b.profiles.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                      {b.profiles.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{b.profiles.full_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>@{b.profiles.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(b.blocked_id)}
                  disabled={unblocking === b.blocked_id}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  {unblocking === b.blocked_id ? "Unblocking..." : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Support */}
      <Section title="Support">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Help Centre</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>FAQs and support</p>
            </div>
            <Link href="/help" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              View
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Terms of service</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Rules and conditions for using FrontPage</p>
            </div>
            <Link href="/terms" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              View
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Privacy policy</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>How we handle your data</p>
            </div>
            <Link href="/privacy" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              View
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Data deletion</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Request deletion of your data</p>
            </div>
            <Link href="/data-deletion" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              View
            </Link>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="border-t pt-10" style={{ borderColor: "#fecaca" }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#e05555" }}>Danger zone</h2>
        <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>Permanent actions that cannot be undone.</p>
        <div className="p-4 rounded-xl" style={{ border: "1px solid #fecaca", background: "#fff5f5" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-700">Delete account</p>
              <p className="text-xs text-red-400 mt-0.5">Permanently delete your account and all your data.</p>
            </div>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  );
}