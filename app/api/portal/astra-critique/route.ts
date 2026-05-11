// ── ASTRA ESA Critique — v2 ───────────────────────────────────────────────────
// Routes through Astarte Works ASTRA CORE instead of calling Claude directly.
// ASTRA pulls from 266-chunk STRATUM knowledge base (regulatory, remediation,
// wetlands, hydrology, soils domains) before generating the critique — giving
// ASTM E1527-21 section citations and TCEQ chapter references grounded in
// actual indexed knowledge rather than training data alone.

import { NextRequest, NextResponse } from 'next/server'

const ASTRA_CRITIQUE_URL = 'https://www.astarteworks.com/api/astra/critique'

export async function POST(req: NextRequest) {
  try {
    const { report_text, site_address, site_lat, site_lng } = await req.json()

    if (!report_text || report_text.length < 50) {
      return NextResponse.json({ error: 'Report text required' }, { status: 400 })
    }

    // Forward to ASTRA CORE critique endpoint on Astarte Works
    // ASTRA pulls STRATUM context (regulatory/remediation/wetlands/hydrology/soils)
    // before generating the structured JSON critique
    const astraRes = await fetch(ASTRA_CRITIQUE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_text, site_address, site_lat, site_lng }),
      signal: AbortSignal.timeout(60000),
    })

    if (!astraRes.ok) {
      const errText = await astraRes.text()
      console.error('ASTRA critique upstream error:', errText)
      return NextResponse.json(
        { error: `ASTRA upstream error: ${astraRes.status}` },
        { status: 502 }
      )
    }

    const data = await astraRes.json()

    if (!data.ok || !data.critique) {
      return NextResponse.json(
        { error: data.error || 'ASTRA returned no critique' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      critique: data.critique,
      tokens_used: data.tokens_used,
      source: 'ASTRA CORE — STRATUM-grounded critique',
    })

  } catch (e) {
    console.error('ASTRA critique proxy error:', e)
    // Fallback: if Astarte is unreachable, call Claude directly
    try {
      const { report_text: rt, site_address: sa } = await req.clone().json()
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const system = `You are ASTRA CORE — the AI reasoning engine powering Ceto Interactive, built on ASTM E1527-21, Texas TCEQ regulations, and USACE wetland guidance.
You are reviewing a Phase I ESA draft and returning a structured JSON critique. Be rigorous, specific, and cite exact ASTM E1527-21 sections.
Return ONLY valid JSON — no markdown, no preamble:
{
  "overall_defensibility_score": <0-100>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence executive summary>",
  "missing_sections": ["<section name>"],
  "rec_tier_errors": [{"finding": "", "current_tier": "", "correct_tier": "", "reason": ""}],
  "data_gap_flags": ["<specific data gap per ASTM E1527-21 Section 12>"],
  "overstatements": ["<language that overstates conclusions>"],
  "language_audit": ["<non-standard or legally problematic phrasing>"],
  "regulatory_flags": ["<TCEQ, EPA, or USACE issues not addressed>"],
  "strengths": ["<what the report does well>"],
  "recommended_actions": ["<specific improvement>"]
}`
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: `Critique this Phase I ESA draft:\n\nSite: ${sa || 'Not provided'}\n\n---\n${rt}\n---\n\nReturn JSON only.` }],
      })
      const raw = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { text: string }).text)
        .join('')
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const critique = JSON.parse(clean)
      return NextResponse.json({ ok: true, critique, tokens_used: response.usage.input_tokens + response.usage.output_tokens, source: 'Claude direct (ASTRA fallback)' })
    } catch (fallbackErr) {
      return NextResponse.json({ error: String(fallbackErr) }, { status: 500 })
    }
  }
}
