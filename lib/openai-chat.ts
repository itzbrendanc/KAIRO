type ConversationMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatReply = {
  title?: string;
  answer: string;
  source: "chatgpt" | "kairo";
};

function looksLikePlaceholderKey(apiKey: string) {
  const normalized = apiKey.trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes("your_openai") ||
    normalized.includes("replace") ||
    normalized.includes("example") ||
    normalized.includes("***") ||
    normalized === "sk-..." ||
    normalized === "sk_test_replace_me"
  );
}

export function hasUsableOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  return Boolean(apiKey && !looksLikePlaceholderKey(apiKey));
}

function buildSystemPrompt(context: string, userMemory?: string) {
  return [
    "You are KAIRO AI, an investing copilot inside the KAIRO platform.",
    "Respond clearly, directly, and in plain English.",
    "Do not claim to have live data unless the supplied context says it is live.",
    "If you mention a stock stance, explain why in terms of trend, momentum, sentiment, and earnings risk when available.",
    "Keep answers concise but useful, usually 1-3 short paragraphs.",
    "You are not a financial advisor and should avoid guarantees.",
    userMemory ? `User memory:\n${userMemory}` : null,
    `KAIRO context:\n${context}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChatRequest(messages: ConversationMessage[], context: string, stream: boolean, userMemory?: string) {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  return {
    model,
    temperature: 0.4,
    stream,
    messages: [
      { role: "system", content: buildSystemPrompt(context, userMemory) },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ]
  };
}

export async function generateOpenAIChatReply(
  messages: ConversationMessage[],
  context: string,
  userMemory?: string
): Promise<ChatReply> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || looksLikePlaceholderKey(apiKey)) {
    throw new Error("OpenAI is not configured with a real API key.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(buildChatRequest(messages, context, false, userMemory))
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "OpenAI request failed.");
  }

  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("OpenAI returned an empty response.");
  }

  return {
    title: "KAIRO AI",
    answer,
    source: "chatgpt"
  };
}

export async function streamOpenAIChatReply(
  messages: ConversationMessage[],
  context: string,
  userMemory: string | undefined,
  onDelta: (chunk: string) => void
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || looksLikePlaceholderKey(apiKey)) {
    throw new Error("OpenAI is not configured with a real API key.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(buildChatRequest(messages, context, true, userMemory))
  });

  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? "Unable to stream from OpenAI.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6).trim());

      for (const line of lines) {
        if (!line || line === "[DONE]") continue;

        const payload = JSON.parse(line) as {
          choices?: Array<{
            delta?: { content?: string };
          }>;
        };
        const chunk = payload.choices?.[0]?.delta?.content;
        if (chunk) {
          onDelta(chunk);
        }
      }
    }
  }
}
