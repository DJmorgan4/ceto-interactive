import { NextRequest, NextResponse } from 'next/server'

const ASTRA_CORE = 'https://astarte-works.vercel.app/api/astra/core'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(ASTRA_CORE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, source: 'ceto' }),
      signal: AbortSignal.timeout(25000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: 'ASTRA Core unavailable', detail: err.message }, { status: 503 })
  }
}
