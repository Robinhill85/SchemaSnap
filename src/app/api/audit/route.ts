import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";
import { auditPage } from "@/lib/audit";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Crawl the page
    const firecrawl = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY!,
    });

    const doc = await firecrawl.scrape(url, {
      formats: ["markdown", "rawHtml"],
    });

    if (!doc.markdown && !doc.rawHtml) {
      return NextResponse.json(
        { error: "Could not extract content from this page." },
        { status: 422 }
      );
    }

    // Step 2: Audit with Claude (rawHtml preserves <script> JSON-LD tags)
    const result = await auditPage(doc.markdown ?? "", doc.rawHtml ?? "");

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Audit API error:", err);

    const status =
      err instanceof Error && "status" in err
        ? (err as { status: number }).status
        : 500;

    if (status === 401) {
      return NextResponse.json(
        { error: "API key is invalid. Check your .env.local file." },
        { status: 401 }
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to audit the page: ${message}` },
      { status: 500 }
    );
  }
}
