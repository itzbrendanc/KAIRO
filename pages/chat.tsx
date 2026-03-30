import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getPageSession } from "@/lib/auth";
import { listChatThreadsForUser } from "@/lib/repository";
import { formatCurrency, formatPercent } from "@/lib/format";

type StockCardData = {
  symbol: string;
  company: string;
  price: number;
  changePercent: number;
  recommendation: string;
  reasonSummary: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  title?: string;
  source?: string;
  stockCard?: StockCardData | null;
};

type ChatThread = {
  id: string;
  dbId?: number | null;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
};

const STORAGE_KEY = "kairo-chat-threads-v3";
const starterPrompts = [
  "What matters in the market today?",
  "Analyze AAPL for me",
  "Explain risk management for beginners",
  "What should I know about NVDA earnings?"
];

function createAssistantMessage(content: string): ChatMessage {
  return {
    id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "assistant",
    title: "KAIRO AI",
    content
  };
}

function createNewThread(): ChatThread {
  return {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    updatedAt: new Date().toISOString(),
    messages: [
      createAssistantMessage(
        "Ask me about a stock, earnings, the market, or a trading idea. I can answer directly with ChatGPT inside KAIRO."
      )
    ]
  };
}

function toClientThreads(
  threads: Array<{
    id: number;
    title: string;
    updatedAt: string;
    messages: Array<{
      id: number;
      role: string;
      title: string | null;
      content: string;
      source: string | null;
    }>;
  }>
): ChatThread[] {
  return threads.map((thread) => ({
    id: `thread-db-${thread.id}`,
    dbId: thread.id,
    title: thread.title,
    updatedAt: thread.updatedAt,
    messages: thread.messages.map((message) => ({
      id: `message-db-${message.id}`,
      role: message.role === "assistant" ? "assistant" : "user",
      title: message.title ?? undefined,
      content: message.content,
      source: message.source ?? undefined
    }))
  }));
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function ChatMarkdown({ content }: { content: string }) {
  const blocks = content.split("\n");
  const rendered: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    rendered.push(
      <ul key={`list-${rendered.length}`} className="chat-markdown-list">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  blocks.forEach((block, index) => {
    if (!block.trim()) {
      flushList();
      return;
    }

    if (block.trim().startsWith("- ")) {
      listItems.push(block.trim().slice(2));
      return;
    }

    flushList();
    rendered.push(
      <p key={`p-${index}`} className="chat-markdown-paragraph">
        {renderInline(block)}
      </p>
    );
  });

  flushList();
  return <div>{rendered}</div>;
}

export default function ChatPage({
  session,
  initialThreads,
  signedIn
}: {
  session?: { user?: { email?: string } };
  initialThreads: ChatThread[];
  signedIn: boolean;
}) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>(initialThreads[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (signedIn) {
      if (initialThreads.length) {
        setThreads(initialThreads);
        setActiveThreadId(initialThreads[0].id);
      } else {
        const firstThread = createNewThread();
        setThreads([firstThread]);
        setActiveThreadId(firstThread.id);
      }
      return;
    }

    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored) as ChatThread[];
      if (parsed.length) {
        setThreads(parsed);
        setActiveThreadId(parsed[0].id);
        return;
      }
    }

    const firstThread = createNewThread();
    setThreads([firstThread]);
    setActiveThreadId(firstThread.id);
  }, [initialThreads, signedIn]);

  useEffect(() => {
    if (!threads.length || typeof window === "undefined" || signedIn) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads, signedIn]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [threads, activeThreadId, loading]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0] ?? null,
    [threads, activeThreadId]
  );

  async function saveThreadToServer(thread: ChatThread) {
    if (!signedIn) return;

    const response = await fetch("/api/chat/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: thread.dbId ?? null,
        title: thread.title,
        messages: thread.messages.map((message) => ({
          role: message.role,
          title: message.title ?? null,
          content: message.content,
          source: message.source ?? null
        }))
      })
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      thread: {
        id: number;
        title: string;
        updatedAt: string;
        messages: Array<{
          id: number;
          role: string;
          title: string | null;
          content: string;
          source: string | null;
        }>;
      };
    };

    const savedThread = toClientThreads([
      {
        ...payload.thread,
        updatedAt: payload.thread.updatedAt
      }
    ])[0];

    setThreads((current) =>
      current.map((entry) => (entry.id === thread.id ? savedThread : entry))
    );
    setActiveThreadId(savedThread.id);
    setSyncMessage("Saved to your account.");
  }

  async function enrichStockCard(symbol: string | null) {
    if (!symbol) return null;

    try {
      const [stockResponse, signalResponse] = await Promise.all([
        fetch(`/api/stocks?symbol=${encodeURIComponent(symbol)}`),
        fetch(`/api/signals?symbol=${encodeURIComponent(symbol)}`)
      ]);

      if (!stockResponse.ok || !signalResponse.ok) {
        return null;
      }

      const stockPayload = (await stockResponse.json()) as {
        stock: { symbol: string; company: string; price: number; changePercent: number };
      };
      const signalPayload = (await signalResponse.json()) as {
        signal: { recommendation: string; reasonSummary: string };
      };

      return {
        symbol: stockPayload.stock.symbol,
        company: stockPayload.stock.company,
        price: stockPayload.stock.price,
        changePercent: stockPayload.stock.changePercent,
        recommendation: signalPayload.signal.recommendation,
        reasonSummary: signalPayload.signal.reasonSummary
      } satisfies StockCardData;
    } catch {
      return null;
    }
  }

  async function sendMessage(rawMessage: string) {
    if (!rawMessage.trim() || !activeThread) return;

    const message = rawMessage.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      content: message
    };
    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      title: "KAIRO AI",
      content: ""
    };

    const updatedMessages = [...activeThread.messages, userMessage, assistantPlaceholder];
    const optimisticThread = {
      ...activeThread,
      title: activeThread.title === "New chat" ? message.slice(0, 42) : activeThread.title,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages
    };

    setThreads((current) =>
      current.map((thread) => (thread.id === activeThread.id ? optimisticThread : thread))
    );
    setInput("");
    setLoading(true);
    setSyncMessage(null);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          messages: updatedMessages
            .filter((item) => item.id !== assistantId)
            .map((item) => ({ role: item.role, content: item.content }))
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to generate a reply.");
      }

      const source = response.headers.get("x-kairo-source") ?? "chatgpt";
      const symbol = response.headers.get("x-kairo-symbol") || null;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available.");
      }

      let content = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });

        setThreads((current) =>
          current.map((thread) =>
            thread.id === activeThread.id
              ? {
                  ...thread,
                  updatedAt: new Date().toISOString(),
                  messages: thread.messages.map((entry) =>
                    entry.id === assistantId
                      ? {
                          ...entry,
                          content,
                          source
                        }
                      : entry
                  )
                }
              : thread
          )
        );
      }

      const stockCard = await enrichStockCard(symbol);

      const finalThread = {
        ...optimisticThread,
        updatedAt: new Date().toISOString(),
        messages: optimisticThread.messages.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                content,
                source,
                stockCard
              }
            : entry
        )
      };

      setThreads((current) =>
        current.map((thread) => (thread.id === activeThread.id ? finalThread : thread))
      );
      await saveThreadToServer(finalThread);
    } catch (error) {
      const content = error instanceof Error ? error.message : "Unable to generate a reply.";
      const failedThread = {
        ...optimisticThread,
        updatedAt: new Date().toISOString(),
        messages: optimisticThread.messages.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                content,
                source: "chatgpt"
              }
            : entry
        )
      };
      setThreads((current) =>
        current.map((thread) => (thread.id === activeThread.id ? failedThread : thread))
      );
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    const thread = createNewThread();
    setThreads((current) => [thread, ...current]);
    setActiveThreadId(thread.id);
    setSyncMessage(null);
  }

  const messages = activeThread?.messages ?? [];

  return (
    <div className="chat-shell">
      <aside className="panel chat-sidebar">
        <button className="primary-button" type="button" onClick={startNewChat}>
          New chat
        </button>

        <div className="chat-sidebar-section">
          <div className="eyebrow">Recent chats</div>
          <div className="chat-thread-list">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`chat-thread-item ${thread.id === activeThreadId ? "chat-thread-item-active" : ""}`}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <strong>{thread.title}</strong>
                <small>{new Date(thread.updatedAt).toLocaleString()}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-sidebar-section">
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

      <section className="panel chat-main">
        <div className="chat-header">
          <div>
            <div className="eyebrow">AI assistant</div>
            <h1>KAIRO Chat</h1>
            <p className="muted-copy">
              Chat directly with ChatGPT inside KAIRO. Ask follow-up questions, analyze stocks, review earnings, and get fast plain-English answers.
            </p>
            {!signedIn ? (
              <p className="muted-copy">
                You are browsing as a guest. Your chat history stays on this device. <Link href="/login">Sign in</Link> to save it to your account.
              </p>
            ) : session?.user?.email ? (
              <p className="muted-copy">Signed in as {session.user.email}. {syncMessage ?? "Your chat history can be saved to your account."}</p>
            ) : null}
          </div>
        </div>

        <div className="chat-thread">
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
              {message.title ? <div className="chat-title">{message.title}</div> : null}
              <div className="chat-content">
                <ChatMarkdown content={message.content || (loading && message.role === "assistant" ? "Thinking..." : "")} />
              </div>
              {message.stockCard ? (
                <Link href={`/stocks/${encodeURIComponent(message.stockCard.symbol)}`} className="chat-stock-card">
                  <div className="eyebrow">Stock card</div>
                  <strong>{message.stockCard.company}</strong>
                  <span>{message.stockCard.symbol}</span>
                  <div className="signal-metrics">
                    <span>{formatCurrency(message.stockCard.price)}</span>
                    <span className={message.stockCard.changePercent >= 0 ? "positive" : "negative"}>
                      {formatPercent(message.stockCard.changePercent)}
                    </span>
                    <span>{message.stockCard.recommendation}</span>
                  </div>
                  <p className="muted-copy">{message.stockCard.reasonSummary}</p>
                </Link>
              ) : null}
              {message.role === "assistant" && message.source ? (
                <small className="chat-source">Powered by {message.source === "chatgpt" ? "ChatGPT" : message.source}</small>
              ) : null}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          className="chat-composer chat-composer-sticky"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <textarea
            className="text-input text-area chat-textarea"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="Message KAIRO AI..."
          />
          <div className="chat-composer-actions">
            <small className="muted-copy">Enter to send, Shift + Enter for a new line.</small>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);
  const signedIn = Boolean(session?.user);
  const initialThreads = signedIn && session?.user?.id
    ? toClientThreads(
        (await listChatThreadsForUser(session.user.id)).map((thread) => ({
          id: thread.id,
          title: thread.title,
          updatedAt: new Date(thread.updatedAt).toISOString(),
          messages: thread.messages.map((message) => ({
            id: message.id,
            role: message.role,
            title: message.title,
            content: message.content,
            source: message.source
          }))
        }))
      )
    : [];

  return {
    props: {
      session,
      initialThreads,
      signedIn
    }
  };
};
