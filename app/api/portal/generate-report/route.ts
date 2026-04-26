import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Handle both call formats
  const systemPrompt = body.systemPrompt || `You are a credentialed Environmental Professional (EP) at Ceto Interactive. Generate professional, ASTM E1527-21 compliant environmental reports.`;
  
  const userPrompt = body.userPrompt || `Generate a complete ${body.reportType || 'Phase I ESA'} report for:
Project: ${body.projectName}
Client: ${body.clientName || 'Confidential'}
Location: ${body.location}
Survey Date: ${body.surveyDate}
Field Observations: ${body.notes}`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const report = message.content.map(b => b.type === 'text' ? b.text : '').join('');
    return NextResponse.json({ report });
  } catch (e: unknown) {
    console.error('Generation error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 500 });
  }
}
