/**
 * /app/api/contacts/route.ts
 * 
 * Contact form handler with Resend email to DJ@theblueduckllc.com
 */

import { Resend } from 'resend';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Initialize Resend lazily to avoid build-time errors
let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, email, phone, company, projectType, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Log the submission
    console.log("[CONTACT FORM] New submission:", {
      name,
      email,
      phone,
      company,
      projectType,
      timestamp: new Date().toISOString(),
    });

    // Send email to DJ
    try {
      const resendClient = getResend();
      await resendClient.emails.send({
        from: 'Ceto Interactive <contact@cetointeractive.com>',
        to: 'DJ@theblueduckllc.com',
        replyTo: email,
        subject: `New Contact Form: ${projectType || 'General Inquiry'}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0A1929; border-bottom: 3px solid #2E5C42; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p style="margin: 10px 0;"><strong>Company:</strong> ${company || 'Not provided'}</p>
              <p style="margin: 10px 0;"><strong>Project Type:</strong> ${projectType || 'Not specified'}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #0A1929;">Message:</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              <p>Sent from cetointeractive.com contact form</p>
              <p>Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST</p>
            </div>
          </div>
        `,
      });

      console.log("[CONTACT FORM] Email sent successfully to DJ@theblueduckllc.com");

    } catch (emailError) {
      console.error("[CONTACT FORM] Email send failed:", emailError);
      // Still return success to user, but log the error
    }

    return Response.json(
      { 
        success: true, 
        message: "Contact form submitted successfully" 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[CONTACT FORM] Error:", error);
    
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}