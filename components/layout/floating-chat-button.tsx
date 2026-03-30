"use client";

import Link from "next/link";
import { useRouter } from "next/router";

export function FloatingChatButton() {
  const router = useRouter();

  if (router.pathname === "/chat") {
    return null;
  }

  return (
    <Link href="/chat" className="floating-chat-button" aria-label="Chat with AI">
      <span className="floating-chat-icon">?</span>
      <span>Ask AI</span>
    </Link>
  );
}
