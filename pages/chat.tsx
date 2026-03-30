import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  title?: string;
};

const starterPrompts = [
  "What matters in the market today?",
  "Analyze AAPL for me",
  "Explain risk management for beginners",
  "What should I know about NVDA earnings?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      title: "KAIRO Chat",
      content:
        "Ask me about a stock, today’s market, earnings, money management, or one of the academy topics. I’ll answer instantly using KAIRO’s market and lesson context."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(message: string) {
    if (!message.trim()) return;
    const nextUserMessage: ChatMessage = { role: "user", content: message };
    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const payload = (await response.json()) as { title?: string; answer?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate a reply.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          title: payload.title,
          content: payload.answer ?? "No response available."
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          title: "KAIRO Chat",
          content: error instanceof Error ? error.message : "Unable to generate a reply."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel terminal-panel">
        <div className="eyebrow">AI assistant</div>
        <h1>KAIRO Chat</h1>
        <p className="muted-copy">
          Chat with KAIRO like a market copilot. Ask about stocks, signals, earnings, strategy, risk management, or what matters in the market right now.
        </p>
      </section>

      <section className="chat-layout">
        <div className="panel chat-panel">
          <div className="chat-thread">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble chat-bubble-${message.role}`}>
                {message.title ? <div className="chat-title">{message.title}</div> : null}
                <div>{message.content}</div>
              </div>
            ))}
            {loading ? <div className="chat-bubble chat-bubble-assistant">KAIRO is thinking...</div> : null}
          </div>

          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <textarea
              className="text-input text-area"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a stock, the market, earnings, or trading strategy..."
            />
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </form>
        </div>

        <aside className="stack">
          <div className="panel">
            <div className="eyebrow">Try asking</div>
            <div className="watchlist-pills">
              {starterPrompts.map((prompt) => (
                <button key={prompt} className="watch-pill" onClick={() => void sendMessage(prompt)}>
                  <strong>{prompt}</strong>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  return {
    props: {
      session
    }
  };
};
