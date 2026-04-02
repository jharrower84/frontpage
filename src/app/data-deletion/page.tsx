import Link from "next/link";

export const metadata = {
  title: "Data Deletion — FrontPage",
  description: "How to request deletion of your FrontPage data.",
};

export default function DataDeletionPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Data Deletion
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Last updated: 31 March 2026</p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: "Your right to deletion",
            content: <p>You have the right to request deletion of your personal data held by FrontPage at any time. This includes all data associated with your account — your profile, content, and activity.</p>,
          },
          {
            title: "How to request deletion",
            content: (
              <>
                <p className="mb-4">To request deletion of your data, send an email to:</p>
                <div className="p-4 rounded-xl mb-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <p className="font-semibold" style={{ color: "#2979FF" }}>hello@frontpageapp.com</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Subject: Data Deletion Request</p>
                </div>
                <p className="mb-3">Please include the following in your email:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>The email address associated with your FrontPage account</li>
                  <li>Your FrontPage username (if known)</li>
                </ul>
              </>
            ),
          },
          {
            title: "What gets deleted",
            content: (
              <>
                <p className="mb-3">Upon a verified deletion request, we will permanently delete:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Your account and login credentials</li>
                  <li>Your profile information (name, username, bio, avatar, publication details)</li>
                  <li>All articles and drafts you have published</li>
                  <li>All comments you have posted</li>
                  <li>Your reading history, likes, bookmarks, and saves</li>
                  <li>Your subscriptions and subscriber relationships</li>
                  <li>Any messages sent through the platform</li>
                  <li>Your interest and preference settings</li>
                </ul>
              </>
            ),
          },
          {
            title: "Timeframe",
            content: <p>We will process your deletion request and confirm completion within <strong style={{ color: "var(--text-primary)" }}>30 days</strong> of receiving your request.</p>,
          },
          {
            title: "Data we may retain",
            content: (
              <>
                <p className="mb-3">In limited circumstances, we may be required to retain certain data after a deletion request:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong style={{ color: "var(--text-primary)" }}>Legal compliance</strong> — where we are required by law to retain records</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Fraud prevention</strong> — anonymised records used to prevent abuse of the platform</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Dispute resolution</strong> — where data is needed to resolve an active dispute or complaint</li>
                </ul>
                <p className="mt-3">Any retained data will be kept only as long as necessary and will not be used for any other purpose.</p>
              </>
            ),
          },
          {
            title: "Delete your account directly",
            content: (
              <>
                <p>If you are logged in, you can delete your account directly from within the app. Go to <Link href="/settings" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>Settings</Link> and scroll to the Danger Zone section.</p>
              </>
            ),
          },
          {
            title: "Questions",
            content: (
              <>
                <p>If you have any questions about data deletion, contact us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>
                <p className="mt-3">For more information about how we handle your data, see our <Link href="/privacy" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>Privacy Policy</Link>.</p>
              </>
            ),
          },
        ].map((section) => (
          <div
            key={section.title}
            className="p-6 rounded-2xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              {section.title}
            </h2>
            <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>© 2026 FrontPage</p>
        <Link href="/privacy" className="text-xs hover:underline" style={{ color: "var(--text-tertiary)" }}>
          Privacy policy →
        </Link>
      </div>
    </div>
  );
}