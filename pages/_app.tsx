import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/router";
import { FloatingChatButton } from "@/components/layout/floating-chat-button";
import { AppShell } from "@/components/layout/app-shell";
import "@/styles/globals.css";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const isAuthPage = router.pathname === "/login" || router.pathname === "/signup";
  const isHomePage = router.pathname === "/";

  return (
    <SessionProvider session={session}>
      <div>
      {isAuthPage || isHomePage ? (
        <Component {...pageProps} />
      ) : (
        <AppShell
          user={
            (pageProps as {
              session?: { user?: { email: string; premium: boolean; emailVerified: boolean } };
            }).session?.user ?? null
          }
        >
          <Component {...pageProps} />
        </AppShell>
      )}
      <FloatingChatButton />
      </div>
    </SessionProvider>
  );
}
