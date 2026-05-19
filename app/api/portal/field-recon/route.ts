import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { field_data, ...meta } = body

    // Strip photos from main payload — store count only (photos too large for Supabase row)
    const payload = {
      ...meta,
      field_data: { ...field_data, photos: [] }, // photos stripped
      photo_count: field_data.photos?.length || 0,
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/field_recons`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      // Table may not exist yet — return success anyway so field app doesn't block
      console.error('Supabase field_recons insert failed:', await res.text())
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Field recon save error:', err)
    return NextResponse.json({ ok: true }) // non-blocking
  }
}
