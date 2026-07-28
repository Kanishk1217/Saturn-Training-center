# Saturn Training Centre — setup notes

## 1. Database (Supabase)

Run `supabase.sql` once in your Supabase project's **SQL Editor**. It creates the
`enquiries` table and a policy that lets the public site insert rows but not
read them back.

## 2. Email notification on every enquiry

Supabase's database can't send email on its own — it needs an email provider
behind it. This project uses **Resend** (free tier, no credit card) called
from a Supabase Edge Function, fired by a plain SQL trigger.

**Status: function deployed and secret set already** (done via `supabase` CLI:
`supabase/functions/notify-enquiry` is live, and `RESEND_API_KEY` is set as
a function secret). The only remaining step is the trigger, which lives in
`supabase.sql` — run that file (again, it's idempotent) in the SQL Editor
to wire it up.

**Resend sandbox limit:** without a verified sending domain, Resend only
delivers to the email address you signed up to Resend with. The function
defaults to notifying `saturnservices2015@gmail.com` — if that's not your
Resend signup address, either sign up to Resend with that Gmail address,
or verify a domain later and update `NOTIFY_TO` / `NOTIFY_FROM` as Edge
Function secrets (`supabase secrets set NOTIFY_TO=... NOTIFY_FROM=...`).

That's it — every new row in `enquiries` now emails the configured address
with the submitted details.

## 3. Hosting (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select `Kanishk1217/Saturn-Training-center`.
3. Build command: leave blank. Build output directory: `/` (this is a static
   site, no build step).
4. Deploy. Every push to `main` redeploys automatically.
