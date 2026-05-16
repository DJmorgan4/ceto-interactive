import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ status: "degraded", subsystems: { STRATUM: false, LOCUS: false, ASTRA: false } });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(3000),
    });
    const stratumOnline = res.ok || res.status === 404;
    return NextResponse.json({
      status: "online",
      timestamp: new Date().toISOString(),
      subsystems: {
        STRATUM: stratumOnline,
        LOCUS: !!process.env.ANTHROPIC_API_KEY,
        ASTRA: !!process.env.ANTHROPIC_API_KEY && stratumOnline,
      },
    });
  } catch {
    return NextResponse.json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      subsystems: { STRATUM: false, LOCUS: !!process.env.ANTHROPIC_API_KEY, ASTRA: false },
    });
  }
}
