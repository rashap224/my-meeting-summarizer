export async function POST(req) {
  try {
    const { transcript, prompt } = await req.json();

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return new Response(
        JSON.stringify({ error: "Transcript is required" }),
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY" }),
        { status: 500 }
      );
    }

    const instruction =
      (prompt && prompt.trim()) ||
      "Summarize the transcript into concise sections: Overview, Key Points (bullets), Action Items (who, what, when), Decisions, Risks, and Next Steps.";

    // Keep prompt compact; Gemini 1.5 supports long context but clipping controls cost/latency
    const MAX_CHARS = 20000;
    const clipped = transcript.length > MAX_CHARS ? transcript.slice(0, MAX_CHARS) : transcript;

    const userPrompt = [
      "You are an assistant that writes crisp, structured summaries of meeting transcripts.",
      "Follow these rules:",
      "- Be faithful to the transcript.",
      "- Use clear headings and bullets.",
      "- Include Action Items with owners and due dates if present.",
      "- Keep it concise.",
      "",
      `User instruction: ${instruction}`,
      "",
      "Transcript:",
      clipped,
    ].join("\n");

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" +
      `?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    const raw = await geminiRes.text();
    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: "LLM request failed", details: safeJson(raw) }),
        { status: 502 }
      );
    }

    const data = safeJson(raw);
    const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : undefined;
    const parts = candidate?.content?.parts || candidate?.content?.parts === undefined && candidate?.content?.parts; // defensive
    let summary = "";
    if (Array.isArray(candidate?.content?.parts)) {
      summary = candidate.content.parts
        .map((p) => (typeof p?.text === "string" ? p.text : ""))
        .filter(Boolean)
        .join("\n");
    }
    if (!summary && typeof candidate?.content?.text === "string") {
      summary = candidate.content.text;
    }

    if (!summary || !summary.trim()) {
      return new Response(
        JSON.stringify({ error: "No summary generated", details: data }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      { status: 500 }
    );
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
