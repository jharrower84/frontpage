import Link from "next/link";

export const metadata = {
  title: "Terms of Service — FrontPage",
  description: "The terms and conditions for using FrontPage.",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Terms of Service
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Last updated: 2 April 2026</p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: "1. Acceptance of terms",
            content: (
              <p>By creating an account or using FrontPage, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. These terms apply to all users of FrontPage, including readers, writers, and anyone who browses the platform.</p>
            ),
          },
          {
            title: "2. Who we are",
            content: (
              <p>FrontPage is an independent fashion publishing platform available at frontpageapp.com and via our mobile app. We connect fashion writers with readers who care about independent fashion writing. If you have any questions about these terms, contact us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>
            ),
          },
          {
            title: "3. Your account",
            content: (
              <>
                <p className="mb-3">When you create an account on FrontPage, you are responsible for:</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Keeping your password secure and not sharing it with others</li>
                  <li>All activity that occurs under your account</li>
                  <li>Ensuring the information you provide is accurate and up to date</li>
                  <li>Notifying us immediately if you believe your account has been compromised</li>
                </ul>
                <p className="mt-3">You must be at least 13 years old to create an account. By creating an account, you confirm that you meet this requirement.</p>
              </>
            ),
          },
          {
            title: "4. Content you post",
            content: (
              <>
                <p className="mb-3">You retain ownership of any content you publish on FrontPage, including articles, comments, and profile information. By posting content, you grant FrontPage a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote your content on the platform.</p>
                <p>You are solely responsible for the content you post. You must not post content that:</p>
                <ul className="space-y-2 list-disc pl-5 mt-3">
                  <li>Is unlawful, defamatory, abusive, threatening, or harassing</li>
                  <li>Infringes the intellectual property rights of others</li>
                  <li>Contains spam, misleading information, or coordinated inauthentic behaviour</li>
                  <li>Includes personal or private information about others without their consent</li>
                  <li>Is sexually explicit or contains gratuitous violence</li>
                  <li>Promotes discrimination, hatred, or harm against any individual or group</li>
                </ul>
              </>
            ),
          },
          {
            title: "5. Subscriptions and following",
            content: (
              <p>FrontPage allows you to follow writers and subscribe to their content. Subscribing to a writer gives you access to their published articles on the platform. FrontPage is currently free to use. Where paid subscription features are introduced in future, additional terms will apply and you will be notified in advance.</p>
            ),
          },
          {
            title: "6. Messaging",
            content: (
              <p>FrontPage includes a direct messaging feature. Messages are private between the sender and recipient. You must not use the messaging feature to send unsolicited messages, spam, or harassing content. Writers can disable messages in their privacy settings at any time.</p>
            ),
          },
          {
            title: "7. Intellectual property",
            content: (
              <p>The FrontPage name, logo, design, and platform code are the intellectual property of FrontPage. You may not copy, reproduce, or distribute any part of the platform without our prior written consent. Content published by other writers on FrontPage remains their intellectual property — you may not reproduce or distribute it without their permission.</p>
            ),
          },
          {
            title: "8. Platform rules and moderation",
            content: (
              <>
                <p className="mb-3">FrontPage reserves the right to remove any content that violates these terms or that we deem harmful to the community, without prior notice. We may also suspend or terminate accounts that repeatedly violate these terms or engage in behaviour that harms other users.</p>
                <p>If you believe content on FrontPage violates these terms, you can report it using the report button on any article, or by contacting us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>
              </>
            ),
          },
          {
            title: "9. Disclaimers and limitation of liability",
            content: (
              <>
                <p className="mb-3">FrontPage is provided on an "as is" basis. We make no warranties, express or implied, about the reliability, accuracy, or availability of the platform.</p>
                <p>To the fullest extent permitted by law, FrontPage shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of data, loss of revenue, or reputational harm.</p>
              </>
            ),
          },
          {
            title: "10. Third party services",
            content: (
              <p>FrontPage uses third party services to operate, including Supabase, Vercel, Resend, and Expo. Your use of the platform is also subject to the terms of these providers where applicable. We are not responsible for the actions or content of third party services.</p>
            ),
          },
          {
            title: "11. Account termination",
            content: (
              <p>You may delete your account at any time via <Link href="/settings" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>Settings</Link>. FrontPage reserves the right to suspend or terminate your account at any time if you violate these terms. Upon termination, your content may be removed from the platform in accordance with our <Link href="/data-deletion" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>Data Deletion policy</Link>.</p>
            ),
          },
          {
            title: "12. Changes to these terms",
            content: (
              <p>We may update these terms from time to time. We will notify you of significant changes by email or via a notice on the platform. Continued use of FrontPage after changes are posted constitutes your acceptance of the updated terms.</p>
            ),
          },
          {
            title: "13. Governing law",
            content: (
              <p>These terms are governed by the laws of England and Wales. Any disputes arising from these terms or your use of FrontPage shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
            ),
          },
          {
            title: "14. Contact",
            content: (
              <p>For any questions about these terms, contact us at <a href="mailto:hello@frontpageapp.com" className="underline hover:opacity-70" style={{ color: "#2979FF" }}>hello@frontpageapp.com</a>.</p>
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