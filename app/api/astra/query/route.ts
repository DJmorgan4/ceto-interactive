import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { query, history = [], system: userSystem } = await req.json();
    if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const SYSTEM = userSystem || `You are ASTRA CORE — the environmental intelligence layer of Ceto Interactive, an EP-credentialed environmental consulting firm in McKinney, Texas. You have access to STRATUM (18-domain knowledge base: hydrology, geology, wetlands, soils, contamination, TCEQ, EPA, ASTM standards, FEMA flood, NWI, SSURGO, SAR), LOCUS (AI cognition), and NEXUS (satellite telemetry). Answer with authority. Cite regulatory sources. Flag RECs, HRECs, CRECs. Be precise and EP-grade. At the end add: DOMAIN:regulatory`;

    const messages: Anthropic.MessageParam[] = [
      ...history.filter((m: any) => m.role && m.content),
      { role: "user", content: query },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM,
      messages,
    });

    const rawContent = response.content
      .filter(b => b.type === "text")
      .map(b => (b as any).text)
      .join("\n");

    const domainMatch = rawContent.match(/DOMAIN:(\w+)/);
    const domain = domainMatch ? domainMatch[1] : "general";
    const cleanContent = rawContent.replace(/DOMAIN:\w+/g, "").trim();

    return NextResponse.json({ response: cleanContent, domain, subsystem: "ASTRA", engine: "LOCUS" });
  } catch (err: any) {
    return NextResponse.json({ error: "ASTRA query failed", detail: err.message }, { status: 500 });
  }
}
