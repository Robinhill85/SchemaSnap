"use client";

import { useState, useEffect } from "react";

interface DiagnosisItem {
  schemaType: string;
  explanation: string;
  impact: "high" | "medium" | "low";
}

interface AuditResult {
  diagnosis: DiagnosisItem[];
  jsonLd: string;
}

const impactConfig = {
  high: {
    label: "High impact",
    bg: "bg-red-500/20",
    text: "text-red-200",
    dot: "bg-red-400",
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-500/20",
    text: "text-amber-200",
    dot: "bg-amber-400",
  },
  low: {
    label: "Low",
    bg: "bg-emerald-500/20",
    text: "text-emerald-200",
    dot: "bg-emerald-400",
  },
};

const loadingSteps = [
  "Crawling page...",
  "Extracting content...",
  "Analysing structured data...",
  "Generating schema markup...",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [auditedUrl, setAuditedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [googleCopied, setGoogleCopied] = useState(false);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < loadingSteps.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setCopied(false);
    setAuditedUrl(url.trim());

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const data: AuditResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.jsonLd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTestInGoogle() {
    if (!result) return;
    const html = `<!DOCTYPE html>\n<html>\n<head>\n${result.jsonLd}\n</head>\n<body></body>\n</html>`;
    await navigator.clipboard.writeText(html);
    setCopied(false);
    setGoogleCopied(true);
    setTimeout(() => setGoogleCopied(false), 4000);
    window.open(
      "https://search.google.com/test/rich-results",
      "_blank"
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="starfield" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="pt-16 pb-8 text-center px-4">
          <div className="inline-flex items-center gap-2.5 mb-5 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-sm">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/70 tracking-wide uppercase">
              Schema Audit Tool
            </span>
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-white">
            Schema
            <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
              Snap
            </span>
          </h1>
          <p className="mt-5 text-xl text-white/60 max-w-lg mx-auto leading-relaxed">
            Find missing structured data on any page and get ready-to-paste
            JSON-LD code for AI search visibility.
          </p>
        </header>

        {/* URL Input */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-2xl px-4 flex gap-3"
        >
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
              <svg
                className="h-5 w-5 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
            <input
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-white/15 bg-white/5 pl-13 pr-4 py-4 text-lg text-white placeholder:text-white/30 shadow-lg shadow-black/20 backdrop-blur-sm focus:border-accent-blue/50 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-60 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple px-8 py-4 text-base font-semibold text-white shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/30 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {loading ? "Auditing..." : "Audit my site"}
          </button>
        </form>

        <p className="mt-10 text-center text-xl font-semibold tracking-widest uppercase text-white/20">
          AI Native Marketing Tool
        </p>

        {/* Loading State */}
        {loading && (
          <div className="mt-16 flex flex-col items-center gap-6 px-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent-blue" />
            </div>
            <div className="flex flex-col items-center gap-3.5">
              {loadingSteps.map((step, i) => (
                <div
                  key={step}
                  className={`flex items-center gap-2.5 text-base transition-all duration-500 ${
                    i < loadingStep
                      ? "text-white/40"
                      : i === loadingStep
                        ? "text-white font-medium"
                        : "text-white/20"
                  }`}
                >
                  {i < loadingStep ? (
                    <svg
                      className="h-4 w-4 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  ) : i === loadingStep ? (
                    <div className="h-2 w-2 rounded-full bg-accent-blue animate-pulse-slow" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                  )}
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mx-auto mt-10 max-w-2xl px-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-base text-red-200 flex items-start gap-3 backdrop-blur-sm">
              <svg
                className="h-6 w-6 text-red-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <div>
                <p className="font-semibold text-red-100 text-lg">Audit failed</p>
                <p className="mt-1 text-red-200/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mx-auto mt-10 w-full max-w-6xl px-4 pb-8">
            {/* Audited URL badge */}
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2 text-base text-emerald-200 backdrop-blur-sm">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                Audit complete for{" "}
                <span className="font-semibold text-emerald-100">
                  {auditedUrl}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Diagnosis */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <svg
                    className="h-6 w-6 text-accent-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                  What&apos;s missing
                </h2>
                <p className="mt-1.5 text-base text-white/50">
                  {result.diagnosis.length} issue
                  {result.diagnosis.length !== 1 && "s"} found
                </p>
                <ol className="mt-6 space-y-5">
                  {result.diagnosis.map((item, i) => {
                    const impact = impactConfig[item.impact];
                    return (
                      <li
                        key={i}
                        className="border-b border-white/5 pb-5 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-lg font-semibold text-white">
                            {i + 1}. {item.schemaType}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${impact.bg} ${impact.text} shrink-0`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${impact.dot}`}
                            />
                            {impact.label}
                          </span>
                        </div>
                        <p className="mt-2 text-base text-white/60 leading-relaxed">
                          {item.explanation}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Right: Generated Code */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                      <svg
                        className="h-6 w-6 text-accent-purple"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                        />
                      </svg>
                      Your fix
                    </h2>
                    <p className="mt-1.5 text-base text-white/50">
                      Paste into your site{" "}
                      <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/70 font-mono">
                        &lt;head&gt;
                      </code>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleTestInGoogle}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      googleCopied
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:brightness-110"
                    }`}
                  >
                    {googleCopied ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                        Copied — paste in Code tab
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                        Test in Google
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      copied
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                          />
                        </svg>
                        Copy code
                      </>
                    )}
                  </button>
                  </div>
                </div>
                <pre className="mt-5 flex-1 overflow-x-auto rounded-xl bg-black/40 border border-white/5 p-6 text-sm leading-relaxed text-accent-cyan font-mono">
                  <code>{result.jsonLd}</code>
                </pre>
                <p className="mt-4 text-sm text-white/40 flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>
                  Generated by AI — validate before deploying
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto border-t border-white/5 py-6 text-center text-sm text-white/40">
          <p>
            Validate your markup with the{" "}
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/60 transition-colors"
            >
              Google Rich Results Test
            </a>
          </p>
          <p className="mt-1">Built live on AI Native Marketing with Claude</p>
        </footer>
      </div>
    </div>
  );
}
