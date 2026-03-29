import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { listAudienceMembers, listCampaignEvents, listCampaigns } from "@/lib/repository";

export default function AudiencePage({
  audience,
  campaigns,
  events
}: {
  audience: Array<{ id: number; email: string; status: string; marketingOptIn: boolean; productUpdatesOptIn: boolean }>;
  campaigns: Array<{ id: number; name: string; subject: string; status: string }>;
  events: Array<{ id: number; email: string; eventType: string; occurredAt: string }>;
}) {
  const [form, setForm] = useState({
    name: "",
    subject: "",
    previewText: "",
    contentHtml: "<p>New features have landed in KAIRO.</p>"
  });
  const [message, setMessage] = useState<string | null>(null);

  async function sendCampaign() {
    const response = await fetch("/api/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sendNow: true
      })
    });
    const payload = await response.json();
    if (response.ok) {
      setMessage(`Campaign processed. ${payload.result.sent} recipients queued.`);
      window.location.reload();
    } else {
      setMessage(payload.error ?? "Unable to send campaign.");
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="eyebrow">Audience</div>
        <h1>Email tracking and marketing</h1>
        <p className="muted-copy">
          Track verified subscribers, product update preferences, and campaign delivery events for your free and premium audience.
        </p>
      </section>

      <section className="grid-3">
        <div className="panel stat-card">
          <div className="stat-label">Subscribers</div>
          <div className="stat-value">{audience.length}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Campaigns</div>
          <div className="stat-value">{campaigns.length}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Events Logged</div>
          <div className="stat-value">{events.length}</div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Subscribers</div>
              <h2>Email list</h2>
            </div>
          </div>
          <div className="table">
            <div className="table-row table-head table-row-audience">
              <span>Email</span>
              <span>Status</span>
              <span>Marketing</span>
              <span>Product</span>
            </div>
            {audience.map((member) => (
              <div key={member.id} className="table-row table-row-audience">
                <span>{member.email}</span>
                <span>{member.status}</span>
                <span>{member.marketingOptIn ? "Yes" : "No"}</span>
                <span>{member.productUpdatesOptIn ? "Yes" : "No"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="eyebrow">Campaign builder</div>
          <h2>Send updates</h2>
          <div className="stack compact-stack">
            <input className="text-input" placeholder="Campaign name" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
            <input className="text-input" placeholder="Subject line" value={form.subject} onChange={(event) => setForm((value) => ({ ...value, subject: event.target.value }))} />
            <input className="text-input" placeholder="Preview text" value={form.previewText} onChange={(event) => setForm((value) => ({ ...value, previewText: event.target.value }))} />
            <textarea className="text-input text-area" value={form.contentHtml} onChange={(event) => setForm((value) => ({ ...value, contentHtml: event.target.value }))} />
            <button className="primary-button" onClick={sendCampaign}>Send campaign</button>
            {message ? <div className="success-banner">{message}</div> : null}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Delivery log</div>
            <h2>Recent email events</h2>
          </div>
        </div>
        <div className="table">
          <div className="table-row table-head table-row-events">
            <span>Email</span>
            <span>Event</span>
            <span>Occurred</span>
          </div>
          {events.map((event) => (
            <div key={event.id} className="table-row table-row-events">
              <span>{event.email}</span>
              <span>{event.eventType}</span>
              <span>{new Date(event.occurredAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
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

  if (!session.user.premium) {
    return {
      redirect: {
        destination: "/subscription",
        permanent: false
      }
    };
  }

  const [audienceResponse, campaignsResponse, eventsResponse] = await Promise.all([
    listAudienceMembers(),
    listCampaigns(),
    listCampaignEvents()
  ]);

  return {
    props: {
      session,
      audience: audienceResponse.map((member) => ({
        id: member.id,
        email: member.email,
        status: member.status,
        marketingOptIn: member.marketingOptIn,
        productUpdatesOptIn: member.productUpdatesOptIn
      })),
      campaigns: campaignsResponse.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status
      })),
      events: eventsResponse.map((event) => ({
        ...event,
        occurredAt: new Date(event.occurredAt).toISOString()
      }))
    }
  };
};
