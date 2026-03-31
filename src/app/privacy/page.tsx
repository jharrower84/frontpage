import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — FrontPage",
  description: "How FrontPage collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-8 block">
        ← FrontPage
      </Link>

      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Privacy Policy</h1>
      <p className="text-sm mb-12" style={{ color: "var(--text-tertiary)" }}>Last updated: 31 March 2026</p>

      <div className="space-y-10" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>1. Who we are</h2>
          <p>FrontPage is an independent fashion publishing platform available at frontpageapp.com and via our mobile app. We connect fashion writers with readers who care about independent fashion writing.</p>
          <p className="mt-3">If you have any questions about this policy, contact us at <a href="mailto:hello@frontpageapp.com" className="underline" style={{ color: "var(--text-primary)" }}>hello@frontpageapp.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>2. What data we collect</h2>
          <p>We collect the following information when you use FrontPage:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong style={{ color: "var(--text-primary)" }}>Account information</strong> — your name, email address, username, and password when you create an account</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Profile information</strong> — your bio, profile photo, publication name, and any other information you add to your profile</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Content</strong> — articles, notes, and comments you publish or post on the platform</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Reading activity</strong> — articles you read, like, bookmark, restack, and subscribe to</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Interests</strong> — the topics you select during onboarding and in settings, used to personalise your feed</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Communications</strong> — messages and newsletters sent through the platform</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Technical data</strong> — IP address, device type, browser type, and usage data collected automatically when you use the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>3. How we use your data</h2>
          <p>We use your data to:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Create and manage your account</li>
            <li>Personalise your reading feed based on your interests and activity</li>
            <li>Connect you with writers and readers on the platform</li>
            <li>Send notifications about activity relevant to you (likes, comments, new posts from writers you follow)</li>
            <li>Send newsletters from writers you subscribe to</li>
            <li>Improve the platform and develop new features</li>
            <li>Prevent fraud and ensure the security of the platform</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>4. Third party services</h2>
          <p>We use the following third party services to operate FrontPage. Each has their own privacy policy governing how they handle data:</p>
          <ul className="mt-3 space-y-3 list-disc pl-5">
            <li><strong style={{ color: "var(--text-primary)" }}>Supabase</strong> — database, authentication, and file storage. Your account data and content is stored on Supabase infrastructure. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/privacy</a></li>
            <li><strong style={{ color: "var(--text-primary)" }}>Vercel</strong> — web hosting and deployment. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">vercel.com/legal/privacy-policy</a></li>
            <li><strong style={{ color: "var(--text-primary)" }}>Resend</strong> — email delivery for notifications, welcome emails, and newsletters. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">resend.com/legal/privacy-policy</a></li>
            <li><strong style={{ color: "var(--text-primary)" }}>Expo</strong> — mobile app development and distribution. <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline">expo.dev/privacy</a></li>
            <li><strong style={{ color: "var(--text-primary)" }}>Google Sign-In</strong> — optional sign-in method. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">policies.google.com/privacy</a></li>
            <li><strong style={{ color: "var(--text-primary)" }}>Apple Sign-In</strong> — optional sign-in method. <a href="https://www.apple.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">apple.com/legal/privacy</a></li>
            <li><strong style={{ color: "var(--text-primary)" }}>Facebook Login</strong> — optional sign-in method. <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="underline">facebook.com/privacy/policy</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>5. We do not sell your data</h2>
          <p>We do not sell, rent, or trade your personal data to third parties for marketing or advertising purposes. We do not use your data for targeted advertising. FrontPage is ad-free.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>6. Cookies and analytics</h2>
          <p>FrontPage uses minimal cookies, limited to those necessary for the platform to function — specifically for authentication (keeping you logged in) and your preferences (such as dark mode).</p>
          <p className="mt-3">We do not use advertising cookies, third-party tracking cookies, or behavioural advertising. We do not use Google Analytics or similar ad-tracking tools.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>7. Your rights</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong style={{ color: "var(--text-primary)" }}>Access</strong> — you can request a copy of the data we hold about you</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Correction</strong> — you can update your profile information at any time via Settings</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Deletion</strong> — you can request deletion of your account and all associated data. See our <Link href="/data-deletion" className="underline" style={{ color: "var(--text-primary)" }}>Data Deletion page</Link> for instructions</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Portability</strong> — you can request an export of your data</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Objection</strong> — you can object to certain types of processing of your data</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:hello@frontpageapp.com" className="underline" style={{ color: "var(--text-primary)" }}>hello@frontpageapp.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>8. Data retention</h2>
          <p>We retain your data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or fraud prevention purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>9. Children</h2>
          <p>FrontPage is not directed at children under the age of 13. We do not knowingly collect personal data from children under 13. If you believe we have collected data from a child under 13, please contact us at <a href="mailto:hello@frontpageapp.com" className="underline" style={{ color: "var(--text-primary)" }}>hello@frontpageapp.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>10. Changes to this policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of significant changes by email or via a notice on the platform. The date at the top of this page reflects when the policy was last updated.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>11. Contact</h2>
          <p>For any questions about this privacy policy or how we handle your data, contact us at <a href="mailto:hello@frontpageapp.com" className="underline" style={{ color: "var(--text-primary)" }}>hello@frontpageapp.com</a>.</p>
        </section>

      </div>
    </div>
  );
}