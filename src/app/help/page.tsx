"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    question: "How do I publish an article?",
    answer: "Click Create in the top bar. Add your title, content and cover image, then click Publish. Your article will be live immediately.",
  },
  {
    question: "How do I follow a writer?",
    answer: "Click on any writer's name or avatar to visit their profile, then click the Follow button. Their articles will appear in your Following feed.",
  },
  {
    question: "How do I save an article to read later?",
    answer: "Click the bookmark icon on any article in the feed, or use the Save button inside the article. Find your saved articles in Reading List.",
  },
  {
    question: "How do I change my profile photo?",
    answer: "Go to your profile page and click Edit Profile. You can upload a new photo from there.",
  },
  {
    question: "How do I delete a comment?",
    answer: "Open the article, find your comment and click the bin icon next to it. You can only delete your own comments.",
  },
  {
    question: "Why is my Tailored feed empty?",
    answer: "Your Tailored feed is based on your interests. Go to Settings to set your interests and the feed will populate with relevant articles.",
  },
  {
    question: "How do I report an article?",
    answer: "Click the Report button on any article page. Our team will review it shortly.",
  },
  {
    question: "How do I change my password?",
    answer: "Go to Settings, then click Change under the Password section. A reset link will be sent to your email.",
  },
  {
    question: "How do I cancel my subscription to a writer?",
    answer: "Go to the writer's profile page and click the Subscribed button to unsubscribe.",
  },
  {
    question: "How do I delete my account?",
    answer: "Go to Settings and scroll to the Danger Zone at the bottom. Click Delete account and follow the confirmation steps.",
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Help Centre
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Find answers to common questions about FrontPage.
        </p>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl mb-8"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0" style={{ color: "var(--text-faint)" }}>
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for help..."
          className="flex-1 text-sm bg-transparent focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ color: "var(--text-faint)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* FAQ section label */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-faint)" }}>
        Frequently asked questions
      </p>

      {/* FAQ list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No results found for "{query}"
            </p>
          </div>
        ) : (
          filtered.map((faq, index) => (
            <div key={index} style={{ borderBottom: index < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:opacity-80"
                style={{ background: "var(--bg-secondary)" }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {faq.question}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{
                    color: "var(--text-tertiary)",
                    transform: expanded === index ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded === index && (
                <div
                  className="px-6 py-4"
                  style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact card */}
      <div
        className="mt-6 p-6 rounded-2xl"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Still need help?
        </p>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          Email us and we'll get back to you as soon as possible.
        </p>
        
          <a href="mailto:hello@frontpageapp.com"
          className="text-sm font-semibold"
          style={{ color: "#2979FF" }}
        >
          hello@frontpageapp.com
        </a>
      </div>
    </div>
  );
}