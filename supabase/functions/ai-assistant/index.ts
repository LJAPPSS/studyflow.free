const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const AI_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "mistralai/mistral-small-3.2-24b-instruct";
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

const SYSTEM_PROMPT =
  "Je bent een vriendelijke studieassistent voor een Nederlandse scholier. Antwoord altijd in het Nederlands, " +
  "helder en beknopt. Help met uitleg, oefenvragen en studietips. Geef geen antwoorden die de leerling zelf moet " +
  "maken zonder uitleg te geven.";

type IncomingMessage = { role: "user" | "assistant"; content: string };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseMessages(value: unknown): IncomingMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;
  const messages: IncomingMessage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_CHARS) return null;
    messages.push({ role, content: trimmed });
  }
  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Methode niet toegestaan." }, 405);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "De AI-assistent is nog niet geconfigureerd." }, 503);

    const body = await req.json().catch(() => null);
    const messages = parseMessages(body?.messages);
    if (!messages) return json({ error: "Ongeldig bericht. Probeer het opnieuw." }, 400);

    const upstream = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });

    if (!upstream.ok) {
      console.error("AI request failed", upstream.status, await upstream.text());
      return json({ error: "De AI-assistent is nu niet bereikbaar. Probeer het later opnieuw." }, 502);
    }

    const result = await upstream.json();
    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return json({ error: "De AI gaf een onverwacht antwoord. Probeer het opnieuw." }, 502);
    }

    return json({ reply: reply.trim() });
  } catch (err) {
    console.error("ai-assistant error", err);
    return json({ error: "Er ging iets mis. Probeer het opnieuw." }, 500);
  }
});

