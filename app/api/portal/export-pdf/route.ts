import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import { Phase1PDF } from '@/lib/pdfTemplates/phase1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'phase1', ...data } = body;

    if (type !== 'phase1') {
      return NextResponse.json({ error: 'Only phase1 type supported currently' }, { status: 400 });
    }

    const reportId = data.reportId || `CET-ENV-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const element = React.createElement(Phase1PDF, {
      ...data,
      reportId,
    });

    const stream = await ReactPDF.renderToStream(element);

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CetoESA_${data.projectName?.replace(/\s+/g, '_') || 'Report'}_${reportId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('PDF export error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
