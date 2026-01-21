"use client";

import React, { useMemo, useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const THEME = {
    bg: "#F6F7F8",
    surface: "rgba(255,255,255,0.62)",
    border: "rgba(20, 35, 55, 0.14)",
    ink: "#142337",
    leviBlue: "#2F5D8C",
    leviBlueDark: "#234B74",
  } as const;

  const CONTACT = useMemo(
    () => ({
      email: "dj@theblueduckllc.com",
      phoneDisplay: "(325) 244-4350",
      phoneHref: "tel:+13252444350", // href only, not displayed as E.164
      location: "McKinney, Texas — serving all of Texas",
    }),
    []
  );

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });

  // Upload UI (not sent yet with JSON endpoint)
  const [file, setFile] = useState<File | null>(null);

  function validate(): string {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.email.trim()) return "Please enter your email.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Please enter a valid email address.";
    if (!form.message.trim()) return "Please share a short message so we can route this correctly.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    const v = validate();
    if (v) {
      setStatus("error");
      setErrorMsg(v);
      return;
    }

    setStatus("sending");

    try {
      // Your API expects JSON with these keys:
      // { name, email, phone, company, projectType, message }
      // We'll map Organization -> company. Phone/projectType optional.
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: "", // optional (you can add a phone input later if you want)
        company: form.organization.trim(),
        projectType: "General Inquiry",
        message:
          form.message.trim() +
          (file ? `\n\nAttachment selected (not yet uploaded): ${file.name}` : ""),
      };

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "We couldn’t send your message. Please try again.");
      }

      setStatus("success");
      setForm({ name: "", email: "", organization: "", message: "" });
      setFile(null);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "We couldn’t send your message. Please try again.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: THEME.ink }}>
          Let’s Start a <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Conversation</span>
        </h1>
        <p className="text-lg font-light" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
          Share a brief overview and we’ll respond with clarity on next steps, timing, and scope.
        </p>
      </div>

      <div
        className="rounded-3xl p-8 md:p-12"
        style={{
          backgroundColor: THEME.surface,
          border: `1px solid ${THEME.border}`,
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Status */}
        {status === "success" && (
          <div
            className="mb-8 rounded-2xl px-5 py-4"
            style={{
              border: `1px solid ${THEME.border}`,
              backgroundColor: "rgba(255,255,255,0.75)",
            }}
          >
            <p className="text-sm font-light" style={{ color: THEME.ink }}>
              <strong style={{ fontWeight: 500 }}>Message sent.</strong> Your email has been delivered. We’ll respond
              shortly.
            </p>
          </div>
        )}

        {status === "error" && errorMsg && (
          <div
            className="mb-8 rounded-2xl px-5 py-4"
            style={{
              border: `1px solid ${THEME.border}`,
              backgroundColor: "rgba(255,255,255,0.75)",
            }}
          >
            <p className="text-sm font-light" style={{ color: THEME.ink }}>
              <strong style={{ fontWeight: 500 }}>Unable to send.</strong> {errorMsg}
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
                Name <span style={{ color: "rgba(20, 35, 55, 0.55)" }}>(required)</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border font-light"
                style={{
                  borderColor: THEME.border,
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
                placeholder="Your name"
                value={form.name}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, name: ev.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
                Email <span style={{ color: "rgba(20, 35, 55, 0.55)" }}>(required)</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border font-light"
                style={{
                  borderColor: THEME.border,
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
                placeholder="your@email.com"
                value={form.email}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((p) => ({ ...p, email: ev.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
              Organization <span style={{ color: "rgba(20, 35, 55, 0.55)" }}>(optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border font-light"
              style={{
                borderColor: THEME.border,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
              placeholder="Company or agency name"
              value={form.organization}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                setForm((p) => ({ ...p, organization: ev.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
              How can we help? <span style={{ color: "rgba(20, 35, 55, 0.55)" }}>(required)</span>
            </label>
            <textarea
              rows={6}
              className="w-full px-4 py-3 rounded-lg border font-light"
              style={{
                borderColor: THEME.border,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
              placeholder="Tell us about your project, timelines, constraints, and what success looks like..."
              value={form.message}
              onChange={(ev: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((p) => ({ ...p, message: ev.target.value }))
              }
            />
          </div>

          {/* Upload (UI only for now, doesn’t break your JSON API) */}
          <div>
            <label className="block text-sm font-light mb-2" style={{ color: THEME.ink }}>
              Attach a file <span style={{ color: "rgba(20, 35, 55, 0.55)" }}>(optional)</span>
            </label>

            <div
              className="rounded-2xl p-5 border"
              style={{
                borderColor: THEME.border,
                backgroundColor: "rgba(255,255,255,0.75)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm font-light" style={{ color: "rgba(20, 35, 55, 0.75)" }}>
                  <div style={{ color: THEME.ink }}>
                    <strong style={{ fontWeight: 500 }}>Upload drawings, plans, images, or PDFs</strong>
                  </div>
                  <div>Choose a file to include with your request.</div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff"
                    onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                      const picked = ev.target.files?.[0] || null;
                      setFile(picked);
                    }}
                  />
                  <label
                    htmlFor="file"
                    className="px-5 py-2 rounded-full text-white font-light cursor-pointer shadow-sm transition-colors duration-200"
                    style={{ backgroundColor: THEME.leviBlue }}
                    onMouseEnter={(ev: React.MouseEvent<HTMLLabelElement>) => {
                      ev.currentTarget.style.backgroundColor = THEME.leviBlueDark;
                    }}
                    onMouseLeave={(ev: React.MouseEvent<HTMLLabelElement>) => {
                      ev.currentTarget.style.backgroundColor = THEME.leviBlue;
                    }}
                  >
                    Choose File
                  </label>

                  {file && (
                    <button
                      type="button"
                      className="text-sm font-light underline underline-offset-4"
                      style={{ color: THEME.leviBlue }}
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {file && (
                <div className="mt-4 text-sm font-light" style={{ color: "rgba(20, 35, 55, 0.75)" }}>
                  <strong style={{ color: THEME.ink, fontWeight: 500 }}>Selected:</strong> {file.name}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full md:w-auto px-8 py-3 rounded-full text-white font-light shadow-sm transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: THEME.leviBlue }}
            onMouseEnter={(ev: React.MouseEvent<HTMLButtonElement>) => {
              if (status !== "sending") ev.currentTarget.style.backgroundColor = THEME.leviBlueDark;
            }}
            onMouseLeave={(ev: React.MouseEvent<HTMLButtonElement>) => {
              if (status !== "sending") ev.currentTarget.style.backgroundColor = THEME.leviBlue;
            }}
          >
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>
        </form>

        {/* Other ways */}
        <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${THEME.border}` }}>
          <h3 className="text-lg font-light mb-4" style={{ color: THEME.ink }}>
            Other Ways to Reach Us
          </h3>
          <div className="space-y-3 text-sm font-light" style={{ color: "rgba(20, 35, 55, 0.70)" }}>
            <p>
              <strong style={{ color: THEME.ink }}>Email:</strong>{" "}
              <a href={`mailto:${CONTACT.email}`} style={{ color: THEME.leviBlue }} className="underline underline-offset-4">
                {CONTACT.email}
              </a>
            </p>
            <p>
              <strong style={{ color: THEME.ink }}>Phone:</strong>{" "}
              <a href={CONTACT.phoneHref} style={{ color: THEME.leviBlue }} className="underline underline-offset-4">
                {CONTACT.phoneDisplay}
              </a>
            </p>
            <p>
              <strong style={{ color: THEME.ink }}>Location:</strong> {CONTACT.location}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

