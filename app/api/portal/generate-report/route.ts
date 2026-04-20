import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { reportType, projectName, location, surveyDate, notes } = await req.json();

  const prompt = `You are a professional environmental consultant at Ceto Interactive, McKinney, Texas. You specialize in Phase I ESAs (ASTM E1527-21), SWPPP, wetland delineation, SAR vegetation analysis, and TCEQ/TPDES compliance.

Generate a formal, complete ${reportType} report. Use ALL CAPS section headers followed by colons (e.g. EXECUTIVE SUMMARY:). Use [PLACEHOLDER] brackets where specific data is missing. Be thorough and technically accurate.

Project: ${projectName}
Location: ${location || 'Not specified'}
Survey Date: ${surveyDate || 'Not specified'}

Field Data & Observations:
${notes}

Write the complete professional report:`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || 'Report generation failed.';
    return NextResponse.json({ report });
  } catch (err) {
    console.error('Groq error:', err);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
