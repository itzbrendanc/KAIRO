import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { listMessagesForGroup, listStudyGroups } from "@/lib/community";

type Group = {
  id: number;
  slug: string;
  name: string;
  description: string;
  premiumOnly: boolean;
};

type Message = {
  id: number;
  groupId: number;
  authorEmail: string;
  authorName: string;
  content: string;
  symbol: string | null;
  sharedSymbols: string[];
  createdAt: string;
};

export default function CommunityPage({
  groups,
  initialGroupId,
  initialMessages,
  premium,
  canPost
}: {
  groups: Group[];
  initialGroupId: number | null;
  initialMessages: Message[];
  premium: boolean;
  canPost: boolean;
}) {
  const [activeGroupId, setActiveGroupId] = useState<number | null>(initialGroupId);
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [symbol, setSymbol] = useState("");
  const [shareWatchlist, setShareWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadGroup(groupId: number) {
    setActiveGroupId(groupId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/community?groupId=${groupId}`);
      const payload = (await response.json()) as {
        messages?: Message[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to load this study group.");
        return;
      }

      setMessages(payload.messages ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function postMessage() {
    if (!activeGroupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroupId,
          content,
          symbol,
          shareWatchlist
        })
      });

      const payload = (await response.json()) as {
        messages?: Message[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to post your message.");
        return;
      }

      setMessages(payload.messages ?? []);
      setContent("");
      setSymbol("");
      setShareWatchlist(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="eyebrow">Community</div>
        <h1>KAIRO Study Groups</h1>
        <p className="muted-copy">
          Discuss stocks, compare ideas, and share watchlists with other KAIRO users. Premium members also unlock a deeper collaborative roundtable.
        </p>
      </section>

      <section className="community-layout">
        <aside className="panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Groups</div>
              <h2>Discussion rooms</h2>
            </div>
          </div>
          <div className="community-groups">
            {groups.map((group) => (
              <button
                key={group.id}
                className={`community-group-card ${group.id === activeGroupId ? "community-group-active" : ""}`}
                onClick={() => loadGroup(group.id)}
              >
                <strong>{group.name}</strong>
                <span>{group.description}</span>
                {group.premiumOnly ? <small className="pill pill-premium">Premium</small> : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="stack">
          <section className="panel">
            <div className="section-header">
              <div>
                <div className="eyebrow">Group chat</div>
                <h2>{groups.find((group) => group.id === activeGroupId)?.name ?? "Study group"}</h2>
              </div>
            </div>

            <div className="community-compose">
              <textarea
                className="text-input text-area"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share a setup, ask a question, or discuss a stock..."
              />
              <div className="two-field-grid">
                <input
                  className="text-input"
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                  placeholder="Optional ticker, like AAPL"
                />
                <label className="check-row">
                  <input type="checkbox" checked={shareWatchlist} onChange={() => setShareWatchlist((value) => !value)} />
                  <span>Share my current watchlist</span>
                </label>
              </div>
              <button className="primary-button" disabled={loading || !activeGroupId || !canPost} onClick={postMessage}>
                {loading ? "Posting..." : "Post to group"}
              </button>
              {!canPost ? <div className="muted-copy">Sign in to post, share your watchlist, and join the discussion. Browsing the groups is open.</div> : null}
              {error ? <div className="error-banner">{error}</div> : null}
            </div>
          </section>

          <section className="panel">
            <div className="section-header">
              <div>
                <div className="eyebrow">Messages</div>
                <h2>Group feed</h2>
              </div>
            </div>
            <div className="community-feed">
              {messages.map((message) => (
                <div key={message.id} className="community-message">
                  <div className="community-message-head">
                    <strong>{message.authorName}</strong>
                    <small>{new Date(message.createdAt).toLocaleString()}</small>
                  </div>
                  <p className="muted-copy">{message.content}</p>
                  <div className="community-tags">
                    {message.symbol ? <span className="watch-pill">{message.symbol}</span> : null}
                    {message.sharedSymbols.map((item) => (
                      <span key={`${message.id}-${item}`} className="watch-pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      {!premium ? (
        <section className="panel premium-strip">
          <div>
            <div className="eyebrow">Premium collaboration</div>
            <h2>Unlock the Premium Roundtable</h2>
            <p className="muted-copy">
              Premium members get an additional study room for deeper collaborative signal review and strategy discussion.
            </p>
          </div>
          <a className="primary-button link-button" href="/subscription">
            Upgrade to Premium
          </a>
        </section>
      ) : null}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);
  const premium = session?.user?.premium ?? false;
  const groups = await listStudyGroups(premium);
  const initialGroupId = groups[0]?.id ?? null;
  const initialMessages = initialGroupId ? await listMessagesForGroup(initialGroupId, premium) : [];

  return {
    props: {
      session,
      groups,
      initialGroupId,
      initialMessages,
      premium,
      canPost: Boolean(session?.user)
    }
  };
};
