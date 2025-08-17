"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("");
  const [summary, setSummary] = useState("");
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("Meeting Summary");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setError("");
    setNotice("");
    if (!file) return;
    const name = (file.name || "").toLowerCase();
    const allowed = [".txt", ".md", ".markdown", ".srt", ".vtt", ".csv"];
    const isAllowed = allowed.some((ext) => name.endsWith(ext));
    if (!isAllowed) {
      setError("Please upload a text-based file (.txt, .md, .srt, .vtt, .csv) or paste text below.");
      return;
    }
  const text = await file.text();
    setTranscript(text);
  setFileName(file.name || "");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) await handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const generate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data?.details ? `\nDetails: ${typeof data.details === "string" ? data.details : JSON.stringify(data.details).slice(0,500)}` : "";
        throw new Error((data?.error || "Failed to generate summary") + details);
      }
      setSummary(data.summary);
      setNotice("Summary generated. You can edit before sending.");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    setError("");
    setNotice("");
    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, recipients, subject }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data?.details ? `\nDetails: ${typeof data.details === "string" ? data.details : JSON.stringify(data.details).slice(0,500)}` : "";
        throw new Error((data?.error || "Failed to send email") + details);
      }
      setNotice("Email sent successfully.");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-5 lg:px-10 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">AI Meeting Summarizer</h1>
        <p className="text-sm opacity-80 mt-1">Upload or paste a transcript, add an instruction, generate a summary, edit it, and email it.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left column: Input + Prompt */}
        <section className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-lg border p-4 transition-colors ${dragging ? "border-emerald-500 bg-emerald-500/5" : "border-white/10"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="block text-sm font-semibold">Transcript</label>
                <p className="text-xs opacity-80">Drag & drop a file or paste below. Accepted: .txt, .md, .srt, .vtt, .csv</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.srt,.vtt,.csv,text/plain,text/markdown"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                >
                  Choose File
                </button>
              </div>
            </div>
            {fileName && (
              <div className="mt-2 text-xs opacity-80 truncate" title={fileName}>
                Selected: <span className="font-medium">{fileName}</span>
              </div>
            )}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste transcript here..."
              rows={12}
              className="mt-3 w-full rounded-md border border-white/10 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
            <div className="mt-1 text-xs opacity-70">{transcript.length.toLocaleString()} characters</div>
          </div>

          <div className="rounded-lg border border-white/10 p-4 space-y-3">
            <label className="block text-sm font-medium">Custom instruction</label>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g., "Summarize in exec bullet points" or "Highlight action items only"'
              className="w-full rounded-md border border-white/10 bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
            <div className="flex gap-3">
              <button
                onClick={generate}
                disabled={loading || !transcript.trim()}
                className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                aria-busy={loading}
              >
                {loading ? "Generating…" : "Generate Summary"}
              </button>
              <button
                type="button"
                onClick={() => setTranscript("")}
                className="h-10 px-3 rounded-md border border-white/20 hover:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                Clear Transcript
              </button>
            </div>
          </div>
        </section>

        {/* Right column: Summary + Share */}
        <section className="space-y-4">
          <div className="rounded-lg border border-white/10 p-4">
            <label className="block text-sm font-medium">Generated summary (editable)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary will appear here..."
              rows={18}
              className="mt-3 w-full rounded-md border border-white/10 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
            <div className="mt-1 text-xs opacity-70">{summary.length.toLocaleString()} characters</div>
          </div>

          <div className="rounded-lg border border-white/10 p-4 space-y-3">
            <label className="block text-sm font-medium">Send via email</label>
            <input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Recipient emails, comma-separated"
              className="w-full rounded-md border border-white/10 bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full rounded-md border border-white/10 bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            />
      <div className="flex gap-3">
              <button
                onClick={send}
                disabled={sending || !summary.trim() || !recipients.trim()}
        className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                aria-busy={sending}
              >
                {sending ? "Sending…" : "Send Summary"}
              </button>
              <button
                type="button"
                onClick={() => setSummary("")}
        className="h-10 px-3 rounded-md border border-white/20 hover:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                Clear Summary
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Alerts */}
      <div className="mt-6 space-y-2">
        {error && (
          <div className="rounded-md border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-300 whitespace-pre-wrap">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-md border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
