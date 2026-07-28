# Saturn Training Centre — setup notes

## 1. Database (Supabase)

Run `supabase.sql` once in your Supabase project's **SQL Editor**. It creates the
`enquiries` table and a policy that lets the public site insert rows but not
read them back.

## 2. Email notification on every enquiry

Supabase's database can't send email on its own — it needs an email provider
behind it. This project uses **Resend** (free tier, no credit card) called
from a small Supabase Edge Function, triggered by a Database Webhook.

**a. Get a Resend API key**
1. Sign up at resend.com (free tier).
2. Dashboard → API Keys → Create API Key. Copy it.
3. Without your own verified sending domain, Resend only lets you send to
   the email you signed up with. Verifying `saturnservices2015@gmail.com`'s
   domain isn't possible (it's a Gmail address) — either sign up to Resend
   *with* that Gmail address so it's the verified recipient, or verify a
   domain you own later and send from `enquiries@yourdomain.com`.

**b. Deploy the Edge Function**

The function lives at `supabase/functions/notify-enquiry/index.ts`. Easiest
path is the Supabase Dashboard (no CLI/token needed from Claude):
1. Dashboard → Edge Functions → Create a new function, name it `notify-enquiry`.
2. Paste in the contents of `supabase/functions/notify-enquiry/index.ts`.
3. Deploy.
4. Project Settings → Edge Functions → Secrets → add `RESEND_API_KEY` with
   the key from step (a).

**c. Wire up the Database Webhook**
1. Dashboard → Database → Webhooks → Create a new webhook.
2. Table: `enquiries`. Events: `Insert`.
3. Type: Supabase Edge Function → select `notify-enquiry`.
4. Save.

That's it — every new row in `enquiries` now emails
`saturnservices2015@gmail.com` with the submitted details.

## 3. Hosting (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select `Kanishk1217/Saturn-Training-center`.
3. Build command: leave blank. Build output directory: `/` (this is a static
   site, no build step).
4. Deploy. Every push to `main` redeploys automatically.
