export async function POST(req) {
	try {
		const { summary, recipients, subject } = await req.json();

		if (!summary || typeof summary !== "string" || !summary.trim()) {
			return new Response(
				JSON.stringify({ error: "Summary is required" }),
				{ status: 400 }
			);
		}

		// Normalize recipients into an array
		let to = [];
		if (Array.isArray(recipients)) {
			to = recipients;
		} else if (typeof recipients === "string") {
			to = recipients
				.split(",")
				.map((e) => e.trim())
				.filter(Boolean);
		}
		if (!to.length) {
			return new Response(
				JSON.stringify({ error: "At least one recipient is required" }),
				{ status: 400 }
			);
		}

		// Mock mode for local dev/testing without sending real emails
		if (process.env.MOCK_EMAIL === "true") {
			return new Response(
				JSON.stringify({ ok: true, id: "mock-id", to, subject: subject || "Meeting Summary" }),
				{ status: 200, headers: { "Content-Type": "application/json" } }
			);
		}

		if (!process.env.RESEND_API_KEY) {
			return new Response(
				JSON.stringify({ error: "Missing RESEND_API_KEY" }),
				{ status: 500 }
			);
		}
		if (!process.env.RESEND_FROM) {
			return new Response(
				JSON.stringify({ error: "Missing RESEND_FROM" }),
				{ status: 500 }
			);
		}

		const payload = {
			from: process.env.RESEND_FROM,
			to,
			subject: subject || "Meeting Summary",
			text: summary,
		};

		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const raw = await res.text();
		let body;
		try {
			body = JSON.parse(raw);
		} catch {
			body = { raw };
		}

		if (!res.ok) {
			return new Response(
				JSON.stringify({ error: "Email send failed", details: body }),
				{ status: 502 }
			);
		}

		return new Response(
			JSON.stringify({ ok: true, id: body?.id || body }),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (e) {
		return new Response(
			JSON.stringify({ error: "Unexpected error", details: String(e) }),
			{ status: 500 }
		);
	}
}

