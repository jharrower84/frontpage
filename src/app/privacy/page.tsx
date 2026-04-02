import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — FrontPage",
  description: "How FrontPage collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Privacy Policy
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Last updated: 31 March 2026</p>
      </div>

      <div className="space-y-8">
        {[
          {
            title: "1. Who we are",
            content: (
              <>
                <p>FrontPage is an independent fashion publishing platform available at frontpageapp.com and via our mobile app. We connect fashion writers with readers who care about independent fashion writing.</p>
                <p className="mt-3">If you have any questions about this policy, contact us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>
              </>
            ),
          },
          {
            title: "2. What data we collect",
            content: (
              <>
                <p className="mb-3">We collect the following information when you use FrontPage:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong style={{ color: "var(--text-primary)" }}>Account information</strong> — your name, email address, username, and password when you create an account</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Profile information</strong> — your bio, profile photo, publication name, and any other information you add to your profile</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Content</strong> — articles, notes, and comments you publish or post on the platform</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Reading activity</strong> — articles you read, like, bookmark, and subscribe to</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Interests</strong> — the topics you select during onboarding and in settings, used to personalise your feed</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Communications</strong> — messages and newsletters sent through the platform</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Technical data</strong> — IP address, device type, browser type, and usage data collected automatically when you use the platform</li>
                </ul>
              </>
            ),
          },
          {
            title: "3. How we use your data",
            content: (
              <>
                <p className="mb-3">We use your data to:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Create and manage your account</li>
                  <li>Personalise your reading feed based on your interests and activity</li>
                  <li>Connect you with writers and readers on the platform</li>
                  <li>Send notifications about activity relevant to you</li>
                  <li>Send newsletters from writers you subscribe to</li>
                  <li>Improve the platform and develop new features</li>
                  <li>Prevent fraud and ensure the security of the platform</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </>
            ),
          },
          {
            title: "4. Third party services",
            content: (
              <>
                <p className="mb-3">We use the following third party services to operate FrontPage:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong style={{ color: "var(--text-primary)" }}>Supabase</strong> — database, authentication, and file storage. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>supabase.com/privacy</a></li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Vercel</strong> — web hosting and deployment. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>vercel.com/legal/privacy-policy</a></li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Resend</strong> — email delivery for notifications and newsletters. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>resend.com/legal/privacy-policy</a></li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Expo</strong> — mobile app development and distribution. <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>expo.dev/privacy</a></li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Google Sign-In</strong> — optional sign-in method. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>policies.google.com/privacy</a></li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Apple Sign-In</strong> — optional sign-in method. <a href="https://www.apple.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>apple.com/legal/privacy</a></li>
                </ul>
              </>
            ),
          },
          {
            title: "5. We do not sell your data",
            content: <p>We do not sell, rent, or trade your personal data to third parties for marketing or advertising purposes. We do not use your data for targeted advertising. FrontPage is ad-free.</p>,
          },
          {
            title: "6. Cookies and analytics",
            content: (
              <>
                <p>FrontPage uses minimal cookies, limited to those necessary for the platform to function — specifically for authentication and your preferences such as dark mode.</p>
                <p className="mt-3">We do not use advertising cookies, third-party tracking cookies, or behavioural advertising tools.</p>
              </>
            ),
          },
          {
            title: "7. Your rights",
            content: (
              <>
                <p className="mb-3">You have the following rights regarding your personal data:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong style={{ color: "var(--text-primary)" }}>Access</strong> — you can request a copy of the data we hold about you</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Correction</strong> — you can update your profile information at any time via Settings</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Deletion</strong> — see our <Link href="/data-deletion" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>Data Deletion page</Link> for instructions</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Portability</strong> — you can request an export of your data</li>
                  <li><strong style={{ color: "var(--text-primary)" }}>Objection</strong> — you can object to certain types of processing of your data</li>
                </ul>
                <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>
              </>
            ),
          },
          {
            title: "8. Data retention",
            content: <p>We retain your data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or fraud prevention purposes.</p>,
          },
          {
            title: "9. Children",
            content: <p>FrontPage is not directed at children under the age of 13. We do not knowingly collect personal data from children under 13. If you believe we have collected data from a child under 13, please contact us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>,
          },
          {
            title: "10. Changes to this policy",
            content: <p>We may update this privacy policy from time to time. We will notify you of significant changes by email or via a notice on the platform.</p>,
          },
          {
            title: "11. Contact",
            content: <p>For any questions about this privacy policy or how we handle your data, contact us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>,
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
        <Link href="/data-deletion" className="text-xs hover:underline" style={{ color: "var(--text-tertiary)" }}>
          Data deletion →
        </Link>
      </div>
    </div>
  );
}