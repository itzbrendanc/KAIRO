import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { KairoLogo } from "@/components/branding/kairo-logo";
import { useEffect } from "react";

export function AuthForm({
  mode,
  showGoogle
}: {
  mode: "login" | "signup";
  showGoogle: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [productUpdatesOptIn, setProductUpdatesOptIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const remembered = window.localStorage.getItem("kairo-last-email");
    if (remembered) {
      setEmail(remembered);
    }
  }, []);

  async function readJsonSafely(response: Response) {
    const text = await response.text();

    try {
      return text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return {
        error: response.ok
          ? "Unexpected server response."
          : text.startsWith("<")
            ? "The server returned an internal error. Check your Vercel auth environment variables and database setup."
            : text || "Unexpected server response."
      };
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (typeof window !== "undefined" && email) {
        window.localStorage.setItem("kairo-last-email", email);
      }

      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, marketingOptIn, productUpdatesOptIn })
        });
        const payload = await readJsonSafely(response);

        if (!response.ok) {
          setError(typeof payload.error === "string" ? payload.error : "Unable to continue.");
          setLoading(false);
          return;
        }

        setMessage(
          (typeof payload.message === "string" ? payload.message : undefined) ??
            "Account created successfully. Signing you in now."
        );

        const signupLogin = await signIn("credentials", {
          email,
          password,
          redirect: false
        });

        if (signupLogin?.error) {
          setMessage("Account created. Sign in with your email and password.");
          setLoading(false);
          return;
        }

        await router.push("/dashboard");
        return;
      }

      const loginCheck = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const loginPayload = await readJsonSafely(loginCheck);

      if (!loginCheck.ok) {
        setError(typeof loginPayload.error === "string" ? loginPayload.error : "Unable to continue.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Login failed. Check your email and password and try again.");
        setLoading(false);
        return;
      }

      await router.push("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to continue.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card panel" onSubmit={handleSubmit}>
        <KairoLogo size="md" />
        <div className="eyebrow">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <h1>{mode === "login" ? "Sign in to KAIRO" : "Get started with KAIRO"}</h1>
        <p className="muted-copy">
          {mode === "login"
            ? "Sign in with Google or your saved email and password. We remember the last email you used on this device."
            : "Create your account once and keep using the same email whenever you return to KAIRO."}
        </p>

        {showGoogle ? (
          <button
            className="ghost-button social-button"
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            {mode === "login" ? "Continue with Google" : "Sign up with Google"}
          </button>
        ) : null}

        <input
          className="text-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="text-input"
          type="password"
          placeholder={mode === "login" ? "Password" : "Create password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {mode === "signup" ? (
          <>
            <label className="check-row">
              <input type="checkbox" checked={productUpdatesOptIn} onChange={() => setProductUpdatesOptIn((value) => !value)} />
              <span>Send me product updates when new features launch.</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={marketingOptIn} onChange={() => setMarketingOptIn((value) => !value)} />
              <span>Send me newsletters, premium offers, and marketing emails.</span>
            </label>
          </>
        ) : null}
        {error ? <div className="error-banner">{error}</div> : null}
        {message ? <div className="success-banner">{message}</div> : null}

        <button className="primary-button" type="submit">
          {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
