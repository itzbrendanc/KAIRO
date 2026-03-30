import crypto from "node:crypto";
import type { EmailCampaign, EmailCampaignEvent, EmailVerificationToken, Subscription, Watchlist } from "@prisma/client";
import { ensureDatabaseInitialized } from "@/lib/db-bootstrap";
import { prisma } from "@/lib/prisma";
import { STOCKS } from "@/data/stocks";
import { MARKET_UNIVERSE } from "@/data/market-universe";

type InMemoryUser = {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string | null;
  googleId: string | null;
  image: string | null;
  premium: boolean;
  emailVerifiedAt: Date | null;
  marketingOptIn: boolean;
  productUpdatesOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryVerificationToken = {
  id: number;
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
};

type InMemoryAudienceMember = {
  id: number;
  email: string;
  userId: number | null;
  marketingOptIn: boolean;
  productUpdatesOptIn: boolean;
  status: string;
  source: string;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryCampaign = {
  id: number;
  name: string;
  subject: string;
  previewText: string | null;
  contentHtml: string;
  status: string;
  createdAt: Date;
  sentAt: Date | null;
};

type InMemoryCampaignEvent = {
  id: number;
  campaignId: number;
  audienceMemberId: number | null;
  email: string;
  eventType: string;
  metadata: string | null;
  occurredAt: Date;
};

type InMemorySubscription = {
  id: number;
  userId: number;
  provider: string;
  customerId: string | null;
  subscriptionId: string | null;
  priceId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryWatchlist = {
  id: number;
  userId: number;
  symbol: string;
  company: string;
  createdAt: Date;
};

type InMemoryChatThread = {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryChatMessage = {
  id: number;
  threadId: number;
  role: string;
  title: string | null;
  content: string;
  source: string | null;
  createdAt: Date;
};

const memory = {
  userId: 1,
  verificationId: 1,
  audienceId: 1,
  campaignId: 1,
  eventId: 1,
  subscriptionId: 1,
  watchlistId: 1,
  chatThreadId: 1,
  chatMessageId: 1,
  users: new Map<string, InMemoryUser>(),
  verificationTokens: new Map<string, InMemoryVerificationToken>(),
  audience: new Map<string, InMemoryAudienceMember>(),
  campaigns: new Map<number, InMemoryCampaign>(),
  events: [] as InMemoryCampaignEvent[],
  subscriptions: new Map<number, InMemorySubscription>(),
  watchlist: new Map<number, InMemoryWatchlist>(),
  chatThreads: new Map<number, InMemoryChatThread>(),
  chatMessages: new Map<number, InMemoryChatMessage>()
};

function lower(email: string) {
  return email.trim().toLowerCase();
}

function allowMemoryFallback() {
  return process.env.NODE_ENV !== "production";
}

async function withFallback<T>(primary: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    await ensureDatabaseInitialized();
    return await primary();
  } catch (error) {
    if (!allowMemoryFallback()) {
      throw error;
    }
    return fallback();
  }
}

export async function findUserByEmail(email: string) {
  const normalized = lower(email);
  return withFallback(
    () => prisma.user.findUnique({ where: { email: normalized } }),
    () => memory.users.get(normalized) ?? null
  );
}

export async function findUserById(id: number) {
  return withFallback(
    () => prisma.user.findUnique({ where: { id } }),
    () => Array.from(memory.users.values()).find((user) => user.id === id) ?? null
  );
}

export async function createEmailUser(input: {
  email: string;
  name?: string | null;
  passwordHash: string;
  marketingOptIn: boolean;
  productUpdatesOptIn: boolean;
}) {
  const normalized = lower(input.email);
  return withFallback(
    () =>
      prisma.user.create({
        data: {
          email: normalized,
          name: input.name ?? normalized.split("@")[0],
          passwordHash: input.passwordHash,
          marketingOptIn: input.marketingOptIn,
          productUpdatesOptIn: input.productUpdatesOptIn
        }
      }),
    () => {
      const user: InMemoryUser = {
        id: memory.userId++,
        email: normalized,
        name: input.name ?? normalized.split("@")[0] ?? null,
        passwordHash: input.passwordHash,
        googleId: null,
        image: null,
        premium: false,
        emailVerifiedAt: null,
        marketingOptIn: input.marketingOptIn,
        productUpdatesOptIn: input.productUpdatesOptIn,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memory.users.set(normalized, user);
      return user;
    }
  );
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId?: string | null;
}) {
  const normalized = lower(input.email);
  return withFallback(
    async () => {
      const existing = await prisma.user.findUnique({ where: { email: normalized } });
      if (existing) {
        return prisma.user.update({
          where: { email: normalized },
          data: {
            name: input.name ?? existing.name,
            image: input.image ?? existing.image,
            googleId: input.googleId ?? existing.googleId,
            emailVerifiedAt: existing.emailVerifiedAt ?? new Date()
          }
        });
      }

      return prisma.user.create({
        data: {
          email: normalized,
          name: input.name ?? normalized.split("@")[0],
          image: input.image,
          googleId: input.googleId,
          emailVerifiedAt: new Date(),
          marketingOptIn: true,
          productUpdatesOptIn: true
        }
      });
    },
    () => {
      const existing = memory.users.get(normalized);
      if (existing) {
        existing.name = input.name ?? existing.name;
        existing.image = input.image ?? existing.image;
        existing.googleId = input.googleId ?? existing.googleId;
        existing.emailVerifiedAt = existing.emailVerifiedAt ?? new Date();
        existing.updatedAt = new Date();
        memory.users.set(normalized, existing);
        return existing;
      }

      const user: InMemoryUser = {
        id: memory.userId++,
        email: normalized,
        name: input.name ?? normalized.split("@")[0] ?? null,
        passwordHash: null,
        googleId: input.googleId ?? null,
        image: input.image ?? null,
        premium: false,
        emailVerifiedAt: new Date(),
        marketingOptIn: true,
        productUpdatesOptIn: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memory.users.set(normalized, user);
      return user;
    }
  );
}

export async function markUserVerified(email: string) {
  const normalized = lower(email);
  return withFallback(
    () =>
      prisma.user.update({
        where: { email: normalized },
        data: {
          emailVerifiedAt: new Date()
        }
      }),
    () => {
      const user = memory.users.get(normalized);
      if (!user) return null;
      user.emailVerifiedAt = new Date();
      user.updatedAt = new Date();
      memory.users.set(normalized, user);
      return user;
    }
  );
}

export async function setUserPremium(userId: number, premium: boolean) {
  return withFallback(
    () =>
      prisma.user.update({
        where: { id: userId },
        data: { premium }
      }),
    () => {
      const user = Array.from(memory.users.values()).find((entry) => entry.id === userId);
      if (!user) return null;
      user.premium = premium;
      user.updatedAt = new Date();
      return user;
    }
  );
}

export async function getUserSubscription(userId: number) {
  return withFallback(
    () =>
      prisma.subscription.findFirst({
        where: {
          userId,
          provider: "stripe"
        }
      }),
    () =>
      Array.from(memory.subscriptions.values()).find(
        (entry) => entry.userId === userId && entry.provider === "stripe"
      ) ?? null
  );
}

export async function upsertStripeSubscriptionForUser(input: {
  userId: number;
  customerId?: string | null;
  subscriptionId?: string | null;
  priceId?: string | null;
  status: string;
  currentPeriodEnd?: Date | null;
}) {
  const premium = ["active", "trialing"].includes(input.status);

  return withFallback(
    async () => {
      const record = await prisma.subscription.upsert({
        where: {
          provider_userId: {
            provider: "stripe",
            userId: input.userId
          }
        },
        update: {
          customerId: input.customerId ?? undefined,
          subscriptionId: input.subscriptionId ?? undefined,
          priceId: input.priceId ?? undefined,
          status: input.status,
          currentPeriodEnd: input.currentPeriodEnd ?? null
        },
        create: {
          userId: input.userId,
          provider: "stripe",
          customerId: input.customerId ?? null,
          subscriptionId: input.subscriptionId ?? null,
          priceId: input.priceId ?? null,
          status: input.status,
          currentPeriodEnd: input.currentPeriodEnd ?? null
        }
      });

      await prisma.user.update({
        where: { id: input.userId },
        data: { premium }
      });

      return record;
    },
    async () => {
      const existing = Array.from(memory.subscriptions.values()).find(
        (entry) => entry.userId === input.userId && entry.provider === "stripe"
      );

      const record: InMemorySubscription =
        existing ?? {
          id: memory.subscriptionId++,
          userId: input.userId,
          provider: "stripe",
          customerId: null,
          subscriptionId: null,
          priceId: null,
          status: "inactive",
          currentPeriodEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

      record.customerId = input.customerId ?? record.customerId;
      record.subscriptionId = input.subscriptionId ?? record.subscriptionId;
      record.priceId = input.priceId ?? record.priceId;
      record.status = input.status;
      record.currentPeriodEnd = input.currentPeriodEnd ?? null;
      record.updatedAt = new Date();
      memory.subscriptions.set(record.id, record);

      const user = Array.from(memory.users.values()).find((entry) => entry.id === input.userId);
      if (user) {
        user.premium = premium;
        user.updatedAt = new Date();
      }

      return record as unknown as Subscription;
    }
  );
}

export async function updateStripeSubscriptionByCustomerId(input: {
  customerId: string;
  subscriptionId?: string | null;
  priceId?: string | null;
  status: string;
  currentPeriodEnd?: Date | null;
}) {
  const premium = ["active", "trialing"].includes(input.status);

  return withFallback(
    async () => {
      const record = await prisma.subscription.findFirst({
        where: {
          provider: "stripe",
          customerId: input.customerId
        }
      });

      if (!record) return null;

      const updated = await prisma.subscription.update({
        where: { id: record.id },
        data: {
          subscriptionId: input.subscriptionId ?? undefined,
          priceId: input.priceId ?? undefined,
          status: input.status,
          currentPeriodEnd: input.currentPeriodEnd ?? null
        }
      });

      await prisma.user.update({
        where: { id: record.userId },
        data: { premium }
      });

      return updated;
    },
    () => {
      const record = Array.from(memory.subscriptions.values()).find(
        (entry) => entry.provider === "stripe" && entry.customerId === input.customerId
      );

      if (!record) return null;

      record.subscriptionId = input.subscriptionId ?? record.subscriptionId;
      record.priceId = input.priceId ?? record.priceId;
      record.status = input.status;
      record.currentPeriodEnd = input.currentPeriodEnd ?? null;
      record.updatedAt = new Date();

      const user = Array.from(memory.users.values()).find((entry) => entry.id === record.userId);
      if (user) {
        user.premium = premium;
        user.updatedAt = new Date();
      }

      return record as unknown as Subscription;
    }
  );
}

export async function updateUserEmailPreferences(userId: number, input: { marketingOptIn: boolean; productUpdatesOptIn: boolean }) {
  return withFallback(
    () =>
      prisma.user.update({
        where: { id: userId },
        data: {
          marketingOptIn: input.marketingOptIn,
          productUpdatesOptIn: input.productUpdatesOptIn
        }
      }),
    () => {
      const user = Array.from(memory.users.values()).find((entry) => entry.id === userId);
      if (!user) return null;
      user.marketingOptIn = input.marketingOptIn;
      user.productUpdatesOptIn = input.productUpdatesOptIn;
      user.updatedAt = new Date();
      return user;
    }
  );
}

export async function createVerificationToken(email: string) {
  const normalized = lower(email);
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  return withFallback(
    () =>
      prisma.emailVerificationToken.create({
        data: {
          token,
          email: normalized,
          expiresAt
        }
      }),
    () => {
      const record: InMemoryVerificationToken = {
        id: memory.verificationId++,
        token,
        email: normalized,
        expiresAt,
        createdAt: new Date()
      };
      memory.verificationTokens.set(token, record);
      return record as unknown as EmailVerificationToken;
    }
  );
}

export async function consumeVerificationToken(token: string) {
  return withFallback(
    async () => {
      const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
      if (!record || record.expiresAt < new Date()) {
        return null;
      }
      await prisma.emailVerificationToken.delete({ where: { token } });
      return record;
    },
    () => {
      const record = memory.verificationTokens.get(token);
      if (!record || record.expiresAt < new Date()) {
        return null;
      }
      memory.verificationTokens.delete(token);
      return record as unknown as EmailVerificationToken;
    }
  );
}

export async function upsertAudienceMember(input: {
  email: string;
  userId?: number | null;
  marketingOptIn: boolean;
  productUpdatesOptIn: boolean;
  source: string;
  verifiedAt?: Date | null;
}) {
  const normalized = lower(input.email);
  return withFallback(
    async () => {
      const existing = await prisma.audienceMember.findUnique({ where: { email: normalized } });
      if (existing) {
        return prisma.audienceMember.update({
          where: { email: normalized },
          data: {
            userId: input.userId ?? existing.userId,
            marketingOptIn: input.marketingOptIn,
            productUpdatesOptIn: input.productUpdatesOptIn,
            source: input.source,
            verifiedAt: input.verifiedAt ?? existing.verifiedAt
          }
        });
      }

      return prisma.audienceMember.create({
        data: {
          email: normalized,
          userId: input.userId ?? null,
          marketingOptIn: input.marketingOptIn,
          productUpdatesOptIn: input.productUpdatesOptIn,
          source: input.source,
          status: "subscribed",
          verifiedAt: input.verifiedAt ?? null
        }
      });
    },
    () => {
      const existing = memory.audience.get(normalized);
      if (existing) {
        existing.userId = input.userId ?? existing.userId;
        existing.marketingOptIn = input.marketingOptIn;
        existing.productUpdatesOptIn = input.productUpdatesOptIn;
        existing.source = input.source;
        existing.verifiedAt = input.verifiedAt ?? existing.verifiedAt;
        existing.updatedAt = new Date();
        memory.audience.set(normalized, existing);
        return existing;
      }

      const member: InMemoryAudienceMember = {
        id: memory.audienceId++,
        email: normalized,
        userId: input.userId ?? null,
        marketingOptIn: input.marketingOptIn,
        productUpdatesOptIn: input.productUpdatesOptIn,
        status: "subscribed",
        source: input.source,
        verifiedAt: input.verifiedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memory.audience.set(normalized, member);
      return member;
    }
  );
}

export async function listAudienceMembers() {
  return withFallback(
    () =>
      prisma.audienceMember.findMany({
        orderBy: { createdAt: "desc" }
      }),
    () => Array.from(memory.audience.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );
}

export async function createCampaign(input: {
  name: string;
  subject: string;
  previewText?: string;
  contentHtml: string;
  status?: string;
}) {
  return withFallback(
    () =>
      prisma.emailCampaign.create({
        data: {
          name: input.name,
          subject: input.subject,
          previewText: input.previewText ?? null,
          contentHtml: input.contentHtml,
          status: input.status ?? "draft"
        }
      }),
    () => {
      const campaign: InMemoryCampaign = {
        id: memory.campaignId++,
        name: input.name,
        subject: input.subject,
        previewText: input.previewText ?? null,
        contentHtml: input.contentHtml,
        status: input.status ?? "draft",
        createdAt: new Date(),
        sentAt: null
      };
      memory.campaigns.set(campaign.id, campaign);
      return campaign as unknown as EmailCampaign;
    }
  );
}

export async function listCampaigns() {
  return withFallback(
    () =>
      prisma.emailCampaign.findMany({
        orderBy: { createdAt: "desc" }
      }),
    () => Array.from(memory.campaigns.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );
}

export async function markCampaignSent(campaignId: number) {
  return withFallback(
    () =>
      prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: "sent",
          sentAt: new Date()
        }
      }),
    () => {
      const campaign = memory.campaigns.get(campaignId);
      if (!campaign) return null;
      campaign.status = "sent";
      campaign.sentAt = new Date();
      memory.campaigns.set(campaignId, campaign);
      return campaign as unknown as EmailCampaign;
    }
  );
}

export async function createCampaignEvent(input: {
  campaignId: number;
  audienceMemberId?: number | null;
  email: string;
  eventType: string;
  metadata?: string | null;
}) {
  return withFallback(
    () =>
      prisma.emailCampaignEvent.create({
        data: {
          campaignId: input.campaignId,
          audienceMemberId: input.audienceMemberId ?? null,
          email: lower(input.email),
          eventType: input.eventType,
          metadata: input.metadata ?? undefined
        }
      }),
    () => {
      const event: InMemoryCampaignEvent = {
        id: memory.eventId++,
        campaignId: input.campaignId,
        audienceMemberId: input.audienceMemberId ?? null,
        email: lower(input.email),
        eventType: input.eventType,
        metadata: input.metadata ?? null,
        occurredAt: new Date()
      };
      memory.events.push(event);
      return event as unknown as EmailCampaignEvent;
    }
  );
}

export async function listCampaignEvents() {
  return withFallback(
    () =>
      prisma.emailCampaignEvent.findMany({
        orderBy: { occurredAt: "desc" },
        take: 100
      }),
    () => [...memory.events].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
  );
}

export async function listUserWatchlist(userId: number) {
  return withFallback(
    () =>
      prisma.watchlist.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      }),
    () =>
      Array.from(memory.watchlist.values())
        .filter((item) => item.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Watchlist[]
  );
}

export async function addWatchlistItem(userId: number, symbol: string) {
  const stock =
    STOCKS.find((item) => item.symbol === symbol.toUpperCase()) ??
    MARKET_UNIVERSE.find((item) => item.symbol === symbol.toUpperCase());
  if (!stock) {
    throw new Error("Unknown symbol.");
  }

  return withFallback(
    () =>
      prisma.watchlist.upsert({
        where: {
          userId_symbol: {
            userId,
            symbol: stock.symbol
          }
        },
        update: {
          company: stock.company
        },
        create: {
          userId,
          symbol: stock.symbol,
          company: stock.company
        }
      }),
    () => ({
      ...(() => {
        const existing = Array.from(memory.watchlist.values()).find(
          (item) => item.userId === userId && item.symbol === stock.symbol
        );

        if (existing) {
          return existing;
        }

        const item: InMemoryWatchlist = {
          id: memory.watchlistId++,
          userId,
          symbol: stock.symbol,
          company: stock.company,
          createdAt: new Date()
        };
        memory.watchlist.set(item.id, item);
        return item;
      })()
    } as Watchlist)
  );
}

export async function listChatThreadsForUser(userId: number) {
  return withFallback(
    () =>
      prisma.chatThread.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { updatedAt: "desc" }
      }),
    () =>
      Array.from(memory.chatThreads.values())
        .filter((thread) => thread.userId === userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map((thread) => ({
          ...thread,
          messages: Array.from(memory.chatMessages.values())
            .filter((message) => message.threadId === thread.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        }))
  );
}

export async function saveChatThreadForUser(input: {
  userId: number;
  threadId?: number | null;
  title: string;
  messages: Array<{
    role: string;
    title?: string | null;
    content: string;
    source?: string | null;
  }>;
}) {
  return withFallback(
    async () => {
      const thread =
        input.threadId != null
          ? await prisma.chatThread.findFirst({
              where: {
                id: input.threadId,
                userId: input.userId
              }
            })
          : null;

      const savedThread = thread
        ? await prisma.chatThread.update({
            where: { id: thread.id },
            data: { title: input.title }
          })
        : await prisma.chatThread.create({
            data: {
              userId: input.userId,
              title: input.title
            }
          });

      await prisma.chatMessage.deleteMany({
        where: { threadId: savedThread.id }
      });

      if (input.messages.length) {
        await prisma.chatMessage.createMany({
          data: input.messages.map((message) => ({
            threadId: savedThread.id,
            role: message.role,
            title: message.title ?? null,
            content: message.content,
            source: message.source ?? null
          }))
        });
      }

      return prisma.chatThread.findUniqueOrThrow({
        where: { id: savedThread.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }
          }
        }
      });
    },
    () => {
      const existing =
        input.threadId != null
          ? memory.chatThreads.get(input.threadId) ?? null
          : null;

      const thread: InMemoryChatThread =
        existing ?? {
          id: memory.chatThreadId++,
          userId: input.userId,
          title: input.title,
          createdAt: new Date(),
          updatedAt: new Date()
        };

      thread.title = input.title;
      thread.updatedAt = new Date();
      memory.chatThreads.set(thread.id, thread);

      Array.from(memory.chatMessages.values())
        .filter((message) => message.threadId === thread.id)
        .forEach((message) => {
          memory.chatMessages.delete(message.id);
        });

      input.messages.forEach((message) => {
        const next: InMemoryChatMessage = {
          id: memory.chatMessageId++,
          threadId: thread.id,
          role: message.role,
          title: message.title ?? null,
          content: message.content,
          source: message.source ?? null,
          createdAt: new Date()
        };
        memory.chatMessages.set(next.id, next);
      });

      return {
        ...thread,
        messages: Array.from(memory.chatMessages.values())
          .filter((message) => message.threadId === thread.id)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      };
    }
  );
}

export async function removeWatchlistItem(userId: number, symbol: string) {
  return withFallback(
    () =>
      prisma.watchlist.deleteMany({
        where: {
          userId,
          symbol: symbol.toUpperCase()
        }
      }),
    () => {
      const existing = Array.from(memory.watchlist.values()).find(
        (item) => item.userId === userId && item.symbol === symbol.toUpperCase()
      );

      if (existing) {
        memory.watchlist.delete(existing.id);
        return { count: 1 };
      }

      return { count: 0 };
    }
  );
}
