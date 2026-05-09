import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { report_text, site_address } = await req.json()

    if (!report_text || report_text.length < 50) {
      return NextResponse.json({ error: 'Report text required' }, { status: 400 })
    }

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
      messages: [{
        role: 'user',
        content: `Critique this Phase I ESA draft:\n\nSite: ${site_address || 'Not provided'}\n\n---\n${report_text}\n---\n\nReturn JSON only.`
      }]
    })

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text).join('')

    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let critique
    try {
      critique = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Parse error', raw: clean.slice(0, 300) }, { status: 500 })
    }

    return NextResponse.json({ ok: true, critique, tokens_used: response.usage.input_tokens + response.usage.output_tokens })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
