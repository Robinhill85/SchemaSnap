import Anthropic from "@anthropic-ai/sdk";

export interface DiagnosisItem {
  schemaType: string;
  explanation: string;
  impact: "high" | "medium" | "low";
}

export interface AuditResult {
  diagnosis: DiagnosisItem[];
  jsonLd: string;
}

const SYSTEM_PROMPT = `You are a structured data expert specialising in schema.org markup for AI search visibility.

I will give you the HTML and markdown content of a webpage. Your job is to:

1. Identify which schema.org types are missing or incomplete
2. For each gap, write a 1-2 sentence plain English explanation of why it matters for AI search (ChatGPT, Perplexity, Claude)
3. Generate a single, complete, valid JSON-LD script block that adds all missing schema

Rules:
- Be specific to the actual content of the page — do not use placeholder values
- Prioritise: Organization, FAQPage, WebPage, Service/Product, Person
- JSON-LD must be valid and ready to paste into the site <head>

You MUST respond with ONLY raw JSON — no markdown fences, no explanation, no text before or after. Exactly this format:
{"diagnosis":[{"schemaType":"Organization","explanation":"Your site is missing Organization markup...","impact":"high"}],"jsonLd":"<script type=\\"application/ld+json\\">\\n{...}\\n</script>"}

Impact levels:
- "high": Organization, FAQPage, WebPage/Article — critical for AI discovery
- "medium": Service, Product, BreadcrumbList — important for commercial visibility
- "low": Person, secondary types — helpful but not urgent

The "jsonLd" field must contain the complete <script type="application/ld+json"> block ready to paste into <head>.`;

// Rough char-to-token ratio ~4:1. Keep well under 200K token limit.
const MAX_CHARS = 120_000;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "\n\n[Content truncated for analysis]";
}

export async function auditPage(
  markdown: string,
  html: string
): Promise<AuditResult> {
  // Prioritise markdown (more signal per token), give remaining budget to HTML
  const md = truncate(markdown, MAX_CHARS * 0.4);
  const ht = truncate(html, MAX_CHARS * 0.6);

  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Here is the page content to audit:\n\n--- MARKDOWN ---\n${md}\n\n--- HTML ---\n${ht}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  // Extract the outermost JSON object by tracking brace depth + string context
  const start = cleaned.indexOf("{");
  if (start === -1) {
    throw new Error("Could not find JSON in Claude response");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error("Could not find matching closing brace in Claude response");
  }

  const parsed: AuditResult = JSON.parse(cleaned.slice(start, end + 1));
  return parsed;
}
