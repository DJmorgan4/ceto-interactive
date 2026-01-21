import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function isEmailValid(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let name = "";
    let email = "";
    let phone = "";
    let company = "";
    let projectType = "";
    let message = "";
    let file: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      name = body?.name || "";
      email = body?.email || "";
      phone = body?.phone || "";
      company = body?.company || "";
      projectType = body?.projectType || "";
      message = body?.message || "";
    } else {
      // multipart/form-data
      const fd = await request.formData();
      name = String(fd.get("name") || "");
      email = String(fd.get("email") || "");
      phone = String(fd.get("phone") || "");
      company = String(fd.get("company") || "");
      projectType = String(fd.get("projectType") || "");
      message = String(fd.get("message") || "");
      const maybeFile = fd.get("file");
      file = maybeFile instanceof File ? maybeFile : null;
    }

    if (!name || !email || !message) {
      return Response.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    if (!isEmailValid(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    console.log("[CONTACT FORM] New submission:", {
      name,
      email,
      phone,
      company,
      projectType,
      hasFile: Boolean(file),
      timestamp: new Date().toISOString(),
    });

    try {
      const resendClient = getResend();

      const attachments: { filename: string; content: Buffer }[] = [];
      if (file) {
        // Keep attachments reasonable
        const MAX_MB = 15;
        if (file.size > MAX_MB * 1024 * 1024) {
          return Response.json({ error: `File too large. Max ${MAX_MB}MB.` }, { status: 400 });
        }
        const bytes = Buffer.from(await file.arrayBuffer());
        attachments.push({ filename: file.name || "attachment", content: bytes });
      }

      await resendClient.emails.send({
        from: "Ceto Interactive <contact@cetointeractive.com>",
        to: "DJ@theblueduckllc.com",
        replyTo: email,
        subject: `New Contact Form: ${projectType || "General Inquiry"}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0A1929; border-bottom: 3px solid #2E5C42; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Phone:</strong> ${phone || "Not provided"}</p>
              <p style="margin: 10px 0;"><strong>Company:</strong> ${company || "Not provided"}</p>
              <p style="margin: 10px 0;"><strong>Project Type:</strong> ${projectType || "Not specified"}</p>
              <p style="margin: 10px 0;"><strong>Attachment:</strong> ${file ? file.name : "None"}</p>
            </div>
            <div style="margin: 20px 0;">
              <h3 style="color: #0A1929;">Message:</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              <p>Sent from cetointeractive.com contact form</p>
              <p>Timestamp: ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })} CST</p>
            </div>
          </div>
        `,
        attachments: attachments.length ? attachments : undefined,
      });

      console.log("[CONTACT FORM] Email sent successfully.");
    } catch (emailError) {
      console.error("[CONTACT FORM] Email send failed:", emailError);
      // You can choose to return 500 here. Keeping your current behavior:
      // still return success, but log the error.
    }

    return Response.json({ success: true, message: "Contact form submitted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[CONTACT FORM] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

