import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { getUserProfile } from "@/lib/repository";

type ProfileState = {
  experienceLevel: string;
  riskTolerance: string;
  investingGoal: string;
  timeHorizon: string;
  favoriteSectors: string;
  favoriteSymbols: string;
  preferredStrategies: string;
  bio: string;
  onboardingCompleted: boolean;
};

export default function SettingsPage({
  initialProfile
}: {
  initialProfile: ProfileState;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateField<Key extends keyof ProfileState>(key: Key, value: ProfileState[Key]) {
    setProfile((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });

      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to save your settings.");
        setSaving(false);
        return;
      }

      setMessage(payload?.message ?? "Saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save your settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="eyebrow">Personal memory</div>
        <h1>Teach KAIRO how you invest</h1>
        <p className="muted-copy">
          This profile becomes the memory layer for your account. KAIRO uses it to tailor chat responses, signal framing, education, and product recommendations to your style and goals.
        </p>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Core profile</div>
            <h2>Set your investing identity</h2>
          </div>
        </div>
        <div className="card-grid">
          <label className="lesson-card">
            <strong>Experience level</strong>
            <select className="text-input" value={profile.experienceLevel} onChange={(event) => updateField("experienceLevel", event.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="lesson-card">
            <strong>Risk tolerance</strong>
            <select className="text-input" value={profile.riskTolerance} onChange={(event) => updateField("riskTolerance", event.target.value)}>
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
          <label className="lesson-card">
            <strong>Primary goal</strong>
            <select className="text-input" value={profile.investingGoal} onChange={(event) => updateField("investingGoal", event.target.value)}>
              <option value="long-term growth">Long-term growth</option>
              <option value="income">Income</option>
              <option value="capital preservation">Capital preservation</option>
              <option value="active trading">Active trading</option>
            </select>
          </label>
          <label className="lesson-card">
            <strong>Time horizon</strong>
            <select className="text-input" value={profile.timeHorizon} onChange={(event) => updateField("timeHorizon", event.target.value)}>
              <option value="day trading">Day trading</option>
              <option value="swing">Swing</option>
              <option value="position">Position</option>
              <option value="long-term">Long-term</option>
            </select>
          </label>
        </div>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Interests</div>
              <h2>What should KAIRO remember?</h2>
            </div>
          </div>
          <div className="lesson-list">
            <label className="lesson-card">
              <strong>Favorite sectors</strong>
              <input
                className="text-input"
                value={profile.favoriteSectors}
                onChange={(event) => updateField("favoriteSectors", event.target.value)}
                placeholder="AI, semiconductors, healthcare, financials"
              />
            </label>
            <label className="lesson-card">
              <strong>Favorite symbols</strong>
              <input
                className="text-input"
                value={profile.favoriteSymbols}
                onChange={(event) => updateField("favoriteSymbols", event.target.value)}
                placeholder="AAPL, NVDA, META, SPY"
              />
            </label>
            <label className="lesson-card">
              <strong>Preferred strategies</strong>
              <input
                className="text-input"
                value={profile.preferredStrategies}
                onChange={(event) => updateField("preferredStrategies", event.target.value)}
                placeholder="Trend following, swing trading, earnings plays"
              />
            </label>
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Extra context</div>
              <h2>How should the AI talk to you?</h2>
            </div>
          </div>
          <label className="lesson-card">
            <strong>Notes for KAIRO</strong>
            <textarea
              className="text-input"
              rows={10}
              value={profile.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Example: I am learning swing trading, I want to avoid risky options, and I prefer simple explanations over technical jargon."
            />
          </label>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="success-banner">{message}</div> : null}

      <section className="panel premium-strip">
        <div>
          <div className="eyebrow">Save your profile</div>
          <h2>Make the platform feel personal</h2>
          <p className="muted-copy">
            Once this is saved, KAIRO can frame stock ideas, lessons, and chat responses around your real objectives instead of talking to every user the same way.
          </p>
        </div>
        <button className="primary-button" onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save profile memory"}
        </button>
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

  const profile = await getUserProfile(session.user.id);

  return {
    props: {
      session,
      initialProfile: {
        experienceLevel: profile.experienceLevel,
        riskTolerance: profile.riskTolerance,
        investingGoal: profile.investingGoal,
        timeHorizon: profile.timeHorizon,
        favoriteSectors: profile.favoriteSectors ?? "",
        favoriteSymbols: profile.favoriteSymbols ?? "",
        preferredStrategies: profile.preferredStrategies ?? "",
        bio: profile.bio ?? "",
        onboardingCompleted: profile.onboardingCompleted
      }
    }
  };
};
