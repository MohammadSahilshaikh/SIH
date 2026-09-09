# Corridor — Emergency-Priority Traffic Signal System

A working prototype for **SIH26205** (Transportation & Logistics — Student Innovation): a
system that lets an ambulance / fire truck / police unit request a **green corridor**
through a city's traffic signal network, on top of everyday adaptive signal control.

Three pages, no build step, no framework:

- `index.html` — landing page explaining the system
- `request.html` — form an ambulance driver/dispatcher uses to request priority passage
- `dashboard.html` — the traffic control room: live junction signals + request queue

**It runs immediately with zero setup** in *demo mode* (in-memory data, one sample
request auto-appears). Wiring in real Supabase + EmailJS keys switches it to a live,
multi-user backend.

---

## 1. How it works

1. Driver/dispatcher submits a request on `request.html` → written to Supabase
   `emergency_requests` table, plus an email alert fires via EmailJS to the control
   room inbox.
2. `dashboard.html` subscribes to that table in real time — the request appears
   instantly, no refresh.
3. Operator clicks **Clear route** → every junction on the request's route flips into
   emergency mode (approach direction held green, cross-traffic held red). This is
   written back to the `junctions` table so any other open dashboard sees it too.
4. Operator clicks **Mark passed** once the vehicle has cleared the junctions →
   those junctions return to normal adaptive cycling, request marked `completed`.

Junctions not currently in emergency mode cycle N–S / E–W every 4 seconds, standing
in for each junction's own local adaptive-timing algorithm (the "normal mode" traffic
optimization layer this problem statement is centered on).

---

## 2. Run it locally (demo mode, no setup)

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

Since `js/config.js` still has placeholder keys, the dashboard automatically runs in
demo mode — fully interactive, backed by in-memory data. Good enough to present the
concept before wiring a real backend.

---

## 3. Wire up the real backend

### Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste the contents of `supabase-schema.sql`, and
   run it. This creates the `junctions` and `emergency_requests` tables, seeds six
   demo junctions, sets permissive RLS policies for the hackathon demo, and enables
   realtime.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
4. Paste both into `js/config.js`.

### EmailJS

1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. Add an email service (Gmail, Outlook, etc.) — note the **Service ID**.
3. Create an email template with these variables in the body:
   `{{vehicle_type}}`, `{{vehicle_number}}`, `{{current_junction}}`,
   `{{destination}}`, `{{notes}}`, `{{request_id}}`, and set **To email** to
   `{{to_email}}`. Note the **Template ID**.
4. Go to **Account → General** and copy your **Public Key**.
5. Fill in `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, and
   `TRAFFIC_CONTROL_EMAIL` in `js/config.js`.

Once both are filled in, `DEMO_MODE` in `js/dashboard.js` automatically turns off and
the whole app runs on live data — try opening `dashboard.html` in two browser tabs and
submitting a request from `request.html` in a third; both dashboards update together.

---

## 4. Deploy to Vercel

No build step needed — this is a static site.

**Option A — CLI**
```bash
npm i -g vercel
vercel
```
Follow the prompts (accept defaults; framework preset: "Other").

**Option B — GitHub + Vercel dashboard**
1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Framework preset: **Other**. Build command: none. Output directory: `.`
4. Deploy.

Your Supabase and EmailJS keys are client-side (this is a static frontend, no server),
which matches the RLS setup above. For anything beyond a hackathon demo, move writes
behind an authenticated role and tighten the RLS policies before going further.

---

## 5. Where this goes next (mentioned in the pitch, not required for the demo)

- Replace `mockRoute()` in `js/request.js` with a real shortest-path/graph service
  once junction adjacency data is available, instead of "next 3 junctions in the list."
- Feed each junction's *normal-mode* cycling from an actual vehicle-density model
  (e.g., a small computer-vision service counting vehicles per approach) instead of a
  fixed 4-second timer — that closes the loop with the original PS205 "adaptive
  signal optimization" idea this system sits on top of.
- Swap the open RLS policies for authenticated dispatcher/operator roles before any
  real-world pilot.
