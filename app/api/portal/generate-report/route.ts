import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPTS: Record<string, string> = {
  'Phase I ESA': `You are a licensed Environmental Professional (EP) at Ceto Interactive, McKinney, Texas, preparing a Phase I Environmental Site Assessment per ASTM E1527-21. Your reports must include all standard ASTM sections: Executive Summary, Introduction, Site Description, User Provided Information, Records Review (federal/state/local databases), Site Reconnaissance, Interviews, Findings, Opinions, and Conclusions. Use professional environmental consulting language. Flag any Recognized Environmental Conditions (RECs), Controlled RECs (CRECs), or Historical RECs (HRECs). Include DISCLAIMER language that this is a preliminary assessment. Use [DATA NEEDED] for any required information not provided.`,
  'SWPPP Inspection': `You are a certified SWPPP inspector at Ceto Interactive, McKinney, Texas, preparing a Stormwater Pollution Prevention Plan Inspection Report per TPDES General Permit TXR150000 and EPA CGP requirements. Your report must include: Project Information, Permit Information, Weather Conditions at Inspection, BMP Inspection Checklist (silt fence, rock check dams, inlet protection, stabilization, concrete washout, waste management), Non-Conformances Identified, Corrective Actions Required with deadlines, Inspector Certification Statement. Note any TCEQ reporting triggers.`,
  'Wetland Delineation': `You are a wetland scientist at Ceto Interactive, McKinney, Texas, preparing a Jurisdictional Wetland Delineation Report per the 1987 Corps of Engineers Wetland Delineation Manual and applicable Regional Supplement. Your report must include: Executive Summary, Introduction and Purpose, Regulatory Framework (Section 404 CWA, Section 10 RHA), Methods (three-parameter approach), Site Description, Data Form Analysis, Wetland/Non-Wetland Boundary Determination, Acreage Estimates, Conclusions and Recommendations.`,
  'SAR Analysis': `You are a remote sensing analyst at Ceto Interactive, McKinney, Texas, preparing a Synthetic Aperture Radar (SAR) Vegetation and Land Cover Analysis Report. Your report must include: Executive Summary, Data Sources and Acquisition Parameters, Processing Methodology, Area of Interest Description, Land Cover Classification Results, Backscatter Analysis, Change Detection Results, Accuracy Assessment, Limitations, and Recommendations.`,
  'Field Survey': `You are an environmental field scientist at Ceto Interactive, McKinney, Texas, preparing a General Environmental Field Survey Report. Your report must include: Executive Summary, Project Background, Survey Objectives, Methods and Equipment Used, Field Conditions, Biological Observations, Physical Conditions, Data Summary, Findings, and Recommendations.`,
  'Custom Report': `You are a senior environmental consultant at Ceto Interactive, McKinney, Texas. Prepare a professional environmental report based on the provided notes and data. Structure it appropriately for the content provided, using professional consulting language and standard section formatting.`,
};

export async function POST(req: NextRequest) {
  const { reportType, projectName, location, surveyDate, notes, clientName } = await req.json();

  if (!reportType || !projectName || !notes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPTS[reportType] || SYSTEM_PROMPTS['Custom Report'];

  const userPrompt = `Generate a complete, professionally structured ${reportType} report for the following project.

PROJECT DETAILS:
- Project/Site Name: ${projectName}
- Client: ${clientName || 'Ceto Interactive (Internal)'}
- Location: ${location || 'Not specified'}
- Survey/Assessment Date: ${surveyDate || 'Not specified'}
- Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
- Prepared By: Ceto Interactive | McKinney, Texas | cetointeractive.com

FIELD DATA AND OBSERVATIONS:
${notes}

FORMAT REQUIREMENTS:
- Use ALL CAPS for main section headers followed by a colon (e.g., EXECUTIVE SUMMARY:)
- Use numbered subsections (e.g., 1.1, 1.2)
- Use [DATA NEEDED: description] for missing required information
- Include a signature block at the end
- Be thorough and complete all sections fully`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || 'Report generation failed.';
    return NextResponse.json({ report });
  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
