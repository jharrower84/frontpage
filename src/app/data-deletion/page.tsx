import Link from "next/link";

export const metadata = {
  title: "Data Deletion — FrontPage",
  description: "How to request deletion of your FrontPage data.",
};

export default function DataDeletionPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-8 block">
        ← FrontPage
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Data Deletion</h1>
      <p className="text-sm mb-12" style={{ color: "var(--text-tertiary)" }}>Last updated: 31 March 2026</p>

      <div className="space-y-10" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Your right to deletion</h2>
          <p>You have the right to request deletion of your personal data held by FrontPage at any time. This includes all data associated with your account — your profile, content, and activity.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>How to request deletion</h2>
          <p>To request deletion of your data, send an email to:</p>
          <div className="my-4 p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>hello@frontpageapp.com</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Subject: Data Deletion Request</p>
          </div>
          <p>Please include the following in your email:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>The email address associated with your FrontPage account</li>
            <li>Your FrontPage username (if known)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>What gets deleted</h2>
          <p>Upon a verified deletion request, we will permanently delete:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Your account and login credentials</li>
            <li>Your profile information (name, username, bio, avatar, publication details)</li>
            <li>All articles and drafts you have published</li>
            <li>All comments you have posted</li>
            <li>Your reading history, likes, bookmarks, and restacks</li>
            <li>Your subscriptions and subscriber relationships</li>
            <li>Any notes or messages sent through the platform</li>
            <li>Your interest and preference settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Timeframe</h2>
          <p>We will process your deletion request and confirm completion within <strong style={{ color: "var(--text-primary)" }}>30 days</strong> of receiving your request.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Data we may retain</h2>
          <p>In limited circumstances, we may be required to retain certain data after a deletion request:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong style={{ color: "var(--text-primary)" }}>Legal compliance</strong> — where we are required by law to retain records</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Fraud prevention</strong> — anonymised records used to prevent abuse of the platform</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Dispute resolution</strong> — where data is needed to resolve an active dispute or complaint</li>
          </ul>
          <p className="mt-3">Any retained data will be kept only as long as necessary for the above purposes and will not be used for any other purpose.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Delete your account directly</h2>
          <p>If you are logged in, you can also delete your account directly from within the app. Go to <strong style={{ color: "var(--text-primary)" }}>Settings</strong> and look for the account deletion option. This will immediately begin the deletion process.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Questions</h2>
          <p>If you have any questions about data deletion, contact us at <a href="mailto:hello@frontpageapp.com" className="underline" style={{ color: "var(--text-primary)" }}>hello@frontpageapp.com</a>.</p>
          <p className="mt-3">For more information about how we handle your data, see our <Link href="/privacy" className="underline" style={{ color: "var(--text-primary)" }}>Privacy Policy</Link>.</p>
        </section>

      </div>
    </div>
  );
}