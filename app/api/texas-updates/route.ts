import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ items: [
    { title: 'TCEQ Proposed Amendments to 30 TAC Chapter 305 — Water Quality Permits Comment Period Open', source: 'TCEQ', url: 'https://www.tceq.texas.gov/agency/decisions/rad/notices.html', tag: 'TCEQ', date: 'Apr 2026' },
    { title: 'EPA ECHO Updated Enforcement & Compliance Data Release — Q1 2026 Facilities Update', source: 'EPA ECHO', url: 'https://echo.epa.gov', tag: 'EPA', date: 'Apr 2026' },
    { title: 'USACE SWF District — Nationwide Permit Program 2026 Reissuance Public Notice', source: 'Army Corps', url: 'https://www.swf.usace.army.mil/Missions/Regulatory/Permits/', tag: 'USACE', date: 'Mar 2026' },
    { title: 'FEMA Collin County FIRM Revision Effective — Zone AE Boundary Updates', source: 'FEMA', url: 'https://msc.fema.gov', tag: 'FEMA', date: 'Mar 2026' },
    { title: 'TPWD Updated Threatened & Endangered Species List — 2026 Annual Revision', source: 'TPWD', url: 'https://tpwd.texas.gov/huntwild/wild/wildlife_diversity/nongame/listed-species/', tag: 'TPWD', date: 'Feb 2026' },
  ]});
}
