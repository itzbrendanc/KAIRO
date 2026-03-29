import Link from "next/link";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { KairoLogo } from "@/components/branding/kairo-logo";
import { SymbolSearch } from "@/components/layout/symbol-search";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/markets", label: "Markets" },
  { href: "/signals", label: "Signals" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/community", label: "Community" },
  { href: "/subscription", label: "Subscription" },
  { href: "/audience", label: "Audience" }
];

export function AppShell({
  children,
  user
}: {
  children: ReactNode;
  user: { email: string; premium: boolean; emailVerified?: boolean } | null;
}) {
  async function logout() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <Link href="/" className="brand-link">
            <KairoLogo size="sm" />
          </Link>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-actions">
          <SymbolSearch />
          {user ? (
            <>
              <span className={`pill ${user.premium ? "pill-premium" : ""}`}>
                {user.premium ? "Premium" : "Free"}
              </span>
              {user.emailVerified === false ? <span className="pill">Unverified</span> : null}
              <span className="user-email">{user.email}</span>
              <button className="ghost-button" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="ghost-button link-button" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
