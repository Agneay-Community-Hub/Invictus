// Cloudflare Worker: a small, locked-down proxy between the "Ask the Archive"
// page and the Claude API. It keeps the API key secret, only answers questions
// about this project, and streams the answer back as plain text.
import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE } from "./knowledge.js";

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 12;          // messages kept from the conversation
const MAX_USER_CHARS = 800;    // longest question accepted
const MAX_ASSISTANT_CHARS = 4000;

const SYSTEM_PROMPT = `You are the Archive Guide for "Ghosts of Exploration", a website made for the NASA Space Apps Challenge 2026 about the hardware NASA left on the Moon, on Mars and in deep space. Most visitors are students aged 8 to 14, plus teachers and parents.

How to answer:
- Base your answers on the archive below. You may add well-established facts about NASA missions and space science, but when something is not in the archive, say so ("That's not in our archive, but...") and only state it if you are confident it is accurate. If you don't know, say so and suggest a related machine they can explore.
- Use simple, friendly words and short sentences. Keep answers under about 150 words unless the visitor asks for more detail. Use a short bulleted list when listing several things.
- Always write machine names exactly as they appear in the archive headings (for example "Opportunity", "Lunar Roving Vehicle 3", "Voyager 1") so the website can link them.
- Correct myths gently. For example, "My battery is low and it's getting dark" was a journalist's summary of Opportunity's final data, not a real message.
- If asked to speak as one of the machines, you may answer in a playful first-person voice like the archive's ghost logs, but keep every fact accurate.
- Distances for deep-space probes are estimates: use the archive's 1 January 2025 distance plus the yearly rate and the date given at the start of the latest message, and say it is an estimate.
- Stay on topic: space, NASA and planetary missions, the machines in the archive, and how they worked. For anything else, kindly say you can only help with space exploration and suggest a question.
- Never ask for personal information such as names, ages, schools or locations. If a visitor shares some, don't repeat it.
- Format with plain text and simple markdown only: **bold**, bullet lists starting with "- ", and line breaks. No tables, headings or links.

${KNOWLEDGE}`;

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    ...(ok ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    _ok: ok,
  };
}

function json(status, body, headers) {
  const { _ok, ...h } = headers;
  return new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
}

// Accept only a clean, alternating user/assistant history that ends with a user question.
function cleanMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const msgs = raw.slice(-MAX_TURNS).map((m) => ({
    role: m && m.role === "assistant" ? "assistant" : "user",
    content: String((m && m.content) || "").trim(),
  }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!m.content) return null;
    if (i > 0 && m.role === msgs[i - 1].role) return null;
    const limit = m.role === "user" ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS;
    if (m.content.length > limit) m.content = m.content.slice(0, limit);
  }
  return msgs;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    const { _ok, ...corsOut } = cors;

    if (request.method === "OPTIONS") return new Response(null, { status: _ok ? 204 : 403, headers: corsOut });
    if (url.pathname === "/health") return json(200, { ok: true }, cors);
    if (request.method !== "POST" || url.pathname !== "/chat") return json(404, { error: "not_found" }, cors);
    if (!_ok) return json(403, { error: "origin_not_allowed" }, cors);
    if (!env.ANTHROPIC_API_KEY) return json(500, { error: "missing_api_key" }, cors);

    // Optional per-visitor rate limit (see wrangler.toml).
    if (env.LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return json(429, { error: "rate_limited" }, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json(400, { error: "bad_json" }, cors); }
    const messages = cleanMessages(body && body.messages);
    if (!messages) return json(400, { error: "bad_messages" }, cors);

    // Put today's date in the latest turn (not the system prompt) so the cached prefix never changes.
    const today = new Date().toISOString().slice(0, 10);
    const last = messages[messages.length - 1];
    last.content = `[Today's date: ${today}]\n${last.content}`;

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const encoder = new TextEncoder();

    let stream;
    try {
      stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 2048,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
        messages,
      });
    } catch (err) {
      console.error("stream start failed", err);
      return json(502, { error: "upstream_error" }, cors);
    }

    const readable = new ReadableStream({
      async start(controller) {
        let wrote = false;
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              wrote = true;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(encoder.encode((wrote ? "\n\n" : "") +
              "Sorry, I can't help with that one. Try asking me about a rover, a lander or a space probe!"));
          } else if (final.stop_reason === "max_tokens") {
            controller.enqueue(encoder.encode("…"));
          }
        } catch (err) {
          console.error("stream failed", err);
          controller.enqueue(encoder.encode(wrote
            ? "\n\n(The answer was cut off. Please try again.)"
            : "\u0000ERROR"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { ...corsOut, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  },
};
