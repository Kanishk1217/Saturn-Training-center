// Supabase Edge Function: emails the institute whenever a new row lands in
// `public.enquiries`. Triggered by a Database Webhook (see ../../SETUP.md).
// Delivery goes through Resend — Supabase itself has no generic outbound
// mailer, so this function is the piece that actually sends the email.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "saturnservices2015@gmail.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Saturn Enquiries <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return new Response("Server not configured", { status: 500 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const row = payload.record ?? payload.new ?? payload;
  const name = row.name ?? "Unknown";
  const phone = row.phone ?? "Not provided";
  const email = row.email || "Not provided";
  const location = row.location || "Not specified";
  const message = row.message || "(no message)";
  const createdAt = row.created_at ?? new Date().toISOString();

  const html = `
    <h2 style="font-family: sans-serif;">New enquiry — Ancient India course</h2>
    <table style="font-family: sans-serif; font-size: 14px; border-collapse: collapse;">
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Name</td><td><strong>${name}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Phone</td><td><a href="tel:${phone}">${phone}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Email</td><td>${email}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Preferred centre</td><td>${location}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Message</td><td>${message}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#666;">Submitted</td><td>${createdAt}</td></tr>
    </table>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      subject: `New enquiry from ${name}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend error:", errText);
    return new Response("Failed to send email", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
