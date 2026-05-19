import { NextRequest, NextResponse } from 'next/server'

const ASTRA_CORE = 'https://astarte-works.vercel.app/api/astra/core'

export async function POST(req: NextRequest) {
  try {
    const { report_text, site_address } = await req.json()
    if (!report_text || report_text.length < 50) {
      return NextResponse.json({ error: 'Report text required' }, { status: 400 })
    }

    const query = `You are conducting an ASTM E1527-21 defensibility critique of the following Phase I ESA draft.
Site Address: ${site_address || 'Not provided'}

REPORT TEXT:
${report_text.slice(0, 6000)}

Return ONLY valid JSON in this exact structure (no markdown, no preamble):
{
  "grade": "A|B|C|D|F",
  "overall_defensibility_score": 0-100,
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "critical_deficiencies": ["deficiency 1", "deficiency 2"],
  "rec_analysis": ["REC finding 1", "REC finding 2"],
  "missing_sections": ["missing section 1"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "astm_compliance": "COMPLIANT|PARTIAL|NON-COMPLIANT",
  "ep_statement_present": true|false,
  "regulatory_databases_cited": ["TCEQ LPST", "EPA ECHO"]
}`

    const res = await fetch(ASTRA_CORE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, source: 'ceto-critique', domain: 'regulatory' }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `ASTRA error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const text = data.response || ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'ASTRA returned invalid critique format' }, { status: 500 })
    }

    const critique = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ok: true, critique })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
