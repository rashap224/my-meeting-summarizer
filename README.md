## AI Meeting Summarizer

An end-to-end, minimal full‑stack app that turns raw meeting transcripts into structured, editable summaries you can share via email.

Live demo: deploy with Vercel, set env vars, and you’re ready to go.

### Features
- Upload or paste transcripts (.txt, .md, .srt, .vtt, .csv)
- Custom instruction (prompt) to tailor the summary
- AI‑generated structured summary (editable)
- Share via email to comma‑separated recipients
- Simple, clean UI with drag‑and‑drop and character counters

### Tech Stack
- Framework: Next.js (App Router)
- UI: Tailwind v4 (via `@tailwindcss/postcss`)
- AI: Google Gemini (REST API `gemini-1.5-flash`)
- Email: Resend (REST API)
- Runtime: Node.js 18+

### Architecture
- Frontend (`app/page.js`):
	- Transcript input: file upload (button + drag‑and‑drop) or paste
	- Prompt input + generate button
	- Editable summary textarea
	- Email form (recipients, subject) + send button
- Backend API routes:
	- `POST /api/summarize` → Calls Gemini with transcript + instruction; returns `{ "summary": string }`
	- `POST /api/send` → Calls Resend to send the summary to recipients; returns `{ "ok": true, id }`
- Environment variables:
	- `GEMINI_API_KEY` → Google AI Studio API key
	- `RESEND_API_KEY` → Resend API key
	- `RESEND_FROM` → Verified sender email (single sender or a domain‑based address)
	- Optional: `MOCK_EMAIL=true` (dev mode: simulate email sending)

## Setup
1) Install dependencies
```powershell
npm install
```

2) Configure environment
- Copy `.env.example` to `.env.local` and fill in values:
```
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=no-reply@mg.yourdomain.com
```
- For fast testing (no domain) you can use:
	- `RESEND_FROM=onboarding@resend.dev` (deliverability is lower), or
	- Add your personal email as a Sender in Resend and set `RESEND_FROM` to that email (only sends to yourself until you verify a domain).

3) Run locally
```powershell
npm run dev
```
Open http://localhost:3000

## Usage
1) Upload or paste a transcript
2) Enter a custom instruction (e.g., “Summarize in exec bullets”, “Highlight action items only”)
3) Click Generate Summary
4) Edit the summary as needed
5) Enter recipient emails (comma‑separated) and a subject
6) Click Send Summary

## Deployment (Vercel)
1) Push the repo to GitHub
2) Import the project in Vercel
3) Set the Environment Variables in Vercel:
	 - `GEMINI_API_KEY`
	 - `RESEND_API_KEY`
	 - `RESEND_FROM`
4) Deploy. Test the flow on the live URL.

### Resend sender options
- Single Sender (fast): verify your email in Resend → use that email in `RESEND_FROM` (limited to sending to yourself)
- Domain (best): verify a domain/subdomain in Resend (e.g., `mg.yourdomain.com`) and set `RESEND_FROM=no-reply@mg.yourdomain.com` to email any recipient

## Troubleshooting
- “LLM request failed” in Generate Summary
	- Check `GEMINI_API_KEY` and that “Generative Language API” is enabled for your Google project.
	- Ensure the model path is correct: `v1beta/models/gemini-1.5-flash:generateContent` or use the `-latest` alias.
	- Very large transcripts are clipped for latency/cost; consider summarizing in parts.

- Email send 403 (Resend)
	- If using a single verified Sender, you can only send to that same address.
	- Verify a domain in Resend and switch `RESEND_FROM` to an address on that domain to send to anyone.
	- For quick demos, set `RESEND_FROM=onboarding@resend.dev` or `MOCK_EMAIL=true`.

- “Unexpected end of JSON input” in the client
	- The API now always returns JSON, but if you modified the route, ensure responses include a JSON body and `Content-Type: application/json`.

## Security
- Never commit `.env.local`; keys are secrets.
- Restrict and rotate API keys regularly.
- In production, consider rate‑limiting and input size limits on `/api/summarize`.

## Roadmap
- Persistence (save summaries and history) with Postgres/Prisma
- Auth (sign in, private histories)
- Streaming generation for better UX during long summaries
- Export formats (PDF/Markdown)
- Tests (unit + Playwright e2e)

## License
MIT
