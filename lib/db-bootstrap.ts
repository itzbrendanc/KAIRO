import { prisma } from "@/lib/prisma";

declare global {
  var __kairoDbBootstrapPromise: Promise<void> | undefined;
  var __kairoDbBootstrapped: boolean | undefined;
}

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
      "id" SERIAL NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "passwordHash" TEXT,
      "googleId" TEXT,
      "image" TEXT,
      "premium" BOOLEAN NOT NULL DEFAULT false,
      "emailVerifiedAt" TIMESTAMP(3),
      "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
      "productUpdatesOptIn" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "Watchlist" (
      "id" SERIAL NOT NULL,
      "userId" INTEGER NOT NULL,
      "symbol" TEXT NOT NULL,
      "company" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "SavedSignal" (
      "id" SERIAL NOT NULL,
      "userId" INTEGER,
      "symbol" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "confidence" DOUBLE PRECISION NOT NULL,
      "explanation" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SavedSignal_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "SimulatedTrade" (
      "id" SERIAL NOT NULL,
      "userId" INTEGER NOT NULL,
      "symbol" TEXT NOT NULL,
      "side" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "price" DOUBLE PRECISION NOT NULL,
      "thesis" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SimulatedTrade_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "Subscription" (
      "id" SERIAL NOT NULL,
      "userId" INTEGER NOT NULL,
      "provider" TEXT NOT NULL DEFAULT 'stripe',
      "customerId" TEXT,
      "subscriptionId" TEXT,
      "priceId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'inactive',
      "currentPeriodEnd" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
      "id" SERIAL NOT NULL,
      "token" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "AudienceMember" (
      "id" SERIAL NOT NULL,
      "email" TEXT NOT NULL,
      "userId" INTEGER,
      "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
      "productUpdatesOptIn" BOOLEAN NOT NULL DEFAULT true,
      "status" TEXT NOT NULL DEFAULT 'subscribed',
      "source" TEXT NOT NULL DEFAULT 'signup',
      "verifiedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "AudienceMember_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "EmailCampaign" (
      "id" SERIAL NOT NULL,
      "name" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "previewText" TEXT,
      "contentHtml" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "sentAt" TIMESTAMP(3),
      CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "EmailCampaignEvent" (
      "id" SERIAL NOT NULL,
      "campaignId" INTEGER NOT NULL,
      "audienceMemberId" INTEGER,
      "email" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "metadata" TEXT,
      "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EmailCampaignEvent_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "StudyGroup" (
      "id" SERIAL NOT NULL,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "GroupMessage" (
      "id" SERIAL NOT NULL,
      "groupId" INTEGER NOT NULL,
      "userId" INTEGER,
      "authorEmail" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "symbol" TEXT,
      "sharedSymbols" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "ChatThread" (
      "id" SERIAL NOT NULL,
      "userId" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" SERIAL NOT NULL,
      "threadId" INTEGER NOT NULL,
      "role" TEXT NOT NULL,
      "title" TEXT,
      "content" TEXT NOT NULL,
      "source" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
    )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Watchlist_userId_symbol_key" ON "Watchlist"("userId", "symbol")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_provider_userId_key" ON "Subscription"("provider", "userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_provider_customerId_key" ON "Subscription"("provider", "customerId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_provider_subscriptionId_key" ON "Subscription"("provider", "subscriptionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AudienceMember_email_key" ON "AudienceMember"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AudienceMember_userId_key" ON "AudienceMember"("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "StudyGroup_slug_key" ON "StudyGroup"("slug")`,
  `CREATE INDEX IF NOT EXISTS "ChatThread_userId_idx" ON "ChatThread"("userId")`,
  `CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_idx" ON "ChatMessage"("threadId")`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Watchlist_userId_fkey') THEN
        ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedSignal_userId_fkey') THEN
        ALTER TABLE "SavedSignal" ADD CONSTRAINT "SavedSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SimulatedTrade_userId_fkey') THEN
        ALTER TABLE "SimulatedTrade" ADD CONSTRAINT "SimulatedTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_userId_fkey') THEN
        ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AudienceMember_userId_fkey') THEN
        ALTER TABLE "AudienceMember" ADD CONSTRAINT "AudienceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCampaignEvent_campaignId_fkey') THEN
        ALTER TABLE "EmailCampaignEvent" ADD CONSTRAINT "EmailCampaignEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCampaignEvent_audienceMemberId_fkey') THEN
        ALTER TABLE "EmailCampaignEvent" ADD CONSTRAINT "EmailCampaignEvent_audienceMemberId_fkey" FOREIGN KEY ("audienceMemberId") REFERENCES "AudienceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupMessage_groupId_fkey') THEN
        ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupMessage_userId_fkey') THEN
        ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatThread_userId_fkey') THEN
        ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_threadId_fkey') THEN
        ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`
] as const;

async function bootstrapPostgresSchema() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

export async function ensureDatabaseInitialized() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl.startsWith("postgres")) {
    return;
  }

  if (globalThis.__kairoDbBootstrapped) {
    return;
  }

  if (!globalThis.__kairoDbBootstrapPromise) {
    globalThis.__kairoDbBootstrapPromise = (async () => {
      await bootstrapPostgresSchema();

      globalThis.__kairoDbBootstrapped = true;
    })().catch((error) => {
      globalThis.__kairoDbBootstrapPromise = undefined;
      throw error;
    });
  }

  await globalThis.__kairoDbBootstrapPromise;
}
