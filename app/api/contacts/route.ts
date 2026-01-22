import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

    name = name.trim();
    email = email.trim();
    phone = phone.trim();
    company = company.trim();
    projectType = projectType.trim();
    message = message.trim();

    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
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

    const resend = getResend();

    const attachments: { filename: string; content: Buffer }[] = [];
    if (file) {
      const MAX_MB = 15;
      if (file.size > MAX_MB * 1024 * 1024) {
        return Response.json(
          { error: `File too large. Max ${MAX_MB}MB.` },
          { status: 400 }
        );
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      attachments.push({ filename: file.name || "attachment", content: bytes });
    }

    const DESTINATION = "dj@theblueduckllc.com";
    const FROM = "The Blue Duck <no-reply@theblueduckllc.com>";

    const subject = `New Contact Form: ${projectType || "General Inquiry"}`;

    const text = [
      "New Contact Form Submission",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Company: ${company || "Not provided"}`,
      `Project Type: ${projectType || "Not specified"}`,
      `Attachment: ${file ? file.name : "None"}`,
      "",
      "Message:",
      message,
      "",
      `Timestamp: ${new Date().toISOString()}`,
    ].join("\n");

    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0A1929; border-bottom: 3px solid #2E5C42; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
          <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
          <p><strong>Project Type:</strong> ${escapeHtml(projectType || "Not specified")}</p>
          <p><strong>Attachment:</strong> ${escapeHtml(file ? file.name : "None")}</p>
        </div>
        <div>
          <h3 style="color:#0A1929;">Message:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM,
      to: [DESTINATION],
      replyTo: email, // ✅ correct for resend@6.8.0 typings
      subject,
      text,
      html,
      attachments: attachments.length ? attachments : undefined,
    });

    if (result.error) {
      console.error("[CONTACT FORM] Resend error:", result.error);
      return Response.json(
        { error: "Email could not be sent", details: result.error },
        { status: 502 }
      );
    }

    console.log("[CONTACT FORM] Email sent:", result.data?.id);

    return Response.json({ success: true, id: result.data?.id }, { status: 200 });
  } catch (err) {
    console.error("[CONTACT FORM] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

