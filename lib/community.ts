import { prisma } from "@/lib/prisma";

export type StudyGroupRecord = {
  id: number;
  slug: string;
  name: string;
  description: string;
  premiumOnly: boolean;
};

export type GroupMessageRecord = {
  id: number;
  groupId: number;
  userId: number | null;
  authorEmail: string;
  authorName: string;
  content: string;
  symbol: string | null;
  sharedSymbols: string[];
  createdAt: string;
};

type InMemoryGroup = StudyGroupRecord;

type InMemoryMessage = {
  id: number;
  groupId: number;
  userId: number | null;
  authorEmail: string;
  authorName: string;
  content: string;
  symbol: string | null;
  sharedSymbols: string[];
  createdAt: Date;
};

type CommunityStore = {
  nextMessageId: number;
  groups: InMemoryGroup[];
  messages: InMemoryMessage[];
};

declare global {
  var __kairoCommunityStore: CommunityStore | undefined;
}

const initialGroups: InMemoryGroup[] = [
  {
    id: 1,
    slug: "opening-bell",
    name: "Opening Bell",
    description: "Daily discussion about market leaders, macro themes, and early setups.",
    premiumOnly: false
  },
  {
    id: 2,
    slug: "swing-lab",
    name: "Swing Lab",
    description: "Share multi-day trade ideas, thesis notes, and watchlist updates.",
    premiumOnly: false
  },
  {
    id: 3,
    slug: "premium-roundtable",
    name: "Premium Roundtable",
    description: "Deeper collaborative analysis for premium members with shared conviction notes.",
    premiumOnly: true
  }
];

function buildInitialStore(): CommunityStore {
  const now = Date.now();

  return {
    nextMessageId: 4,
    groups: initialGroups,
    messages: [
      {
        id: 1,
        groupId: 1,
        userId: null,
        authorEmail: "coach@kairo.app",
        authorName: "KAIRO Coach",
        content:
          "Watch how AAPL reacts around recent highs. If momentum holds with constructive news, that can support a cleaner continuation setup.",
        symbol: "AAPL",
        sharedSymbols: [],
        createdAt: new Date(now - 1000 * 60 * 90)
      },
      {
        id: 2,
        groupId: 2,
        userId: null,
        authorEmail: "coach@kairo.app",
        authorName: "KAIRO Coach",
        content:
          "When you share a swing trade idea, include the setup, the invalidation point, and what headline could change the thesis.",
        symbol: "MSFT",
        sharedSymbols: [],
        createdAt: new Date(now - 1000 * 60 * 55)
      },
      {
        id: 3,
        groupId: 3,
        userId: null,
        authorEmail: "premium@kairo.app",
        authorName: "Premium Desk",
        content:
          "Premium members can use this room to compare full AI signal explanations and discuss how they line up with watchlist names.",
        symbol: "NVDA",
        sharedSymbols: ["NVDA", "MSFT", "META"],
        createdAt: new Date(now - 1000 * 60 * 25)
      }
    ]
  };
}

function getStore() {
  if (!globalThis.__kairoCommunityStore) {
    globalThis.__kairoCommunityStore = buildInitialStore();
  }

  return globalThis.__kairoCommunityStore;
}

async function withFallback<T>(primary: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}

function normalizeMessage(message: {
  id: number;
  groupId: number;
  userId?: number | null;
  authorEmail: string;
  authorName: string;
  content: string;
  symbol?: string | null;
  sharedSymbols?: string | null;
  createdAt: Date;
}): GroupMessageRecord {
  return {
    id: message.id,
    groupId: message.groupId,
    userId: message.userId ?? null,
    authorEmail: message.authorEmail,
    authorName: message.authorName,
    content: message.content,
    symbol: message.symbol ?? null,
    sharedSymbols: message.sharedSymbols ? message.sharedSymbols.split(",").filter(Boolean) : [],
    createdAt: message.createdAt.toISOString()
  };
}

async function ensureDefaultGroups() {
  return withFallback(
    async () => {
      for (const group of initialGroups) {
        await prisma.studyGroup.upsert({
          where: { slug: group.slug },
          update: {
            name: group.name,
            description: group.description,
            premiumOnly: group.premiumOnly
          },
          create: group
        });
      }

      const existingMessages = await prisma.groupMessage.count();

      if (existingMessages === 0) {
        const groups = await prisma.studyGroup.findMany({
          select: { id: true, slug: true }
        });

        const bySlug = new Map(groups.map((group) => [group.slug, group.id]));

        await prisma.groupMessage.createMany({
          data: buildInitialStore().messages.map((message) => ({
            groupId:
              message.groupId === 1
                ? bySlug.get("opening-bell") ?? 1
                : message.groupId === 2
                  ? bySlug.get("swing-lab") ?? 2
                  : bySlug.get("premium-roundtable") ?? 3,
            authorEmail: message.authorEmail,
            authorName: message.authorName,
            content: message.content,
            symbol: message.symbol,
            sharedSymbols: message.sharedSymbols.join(","),
            createdAt: message.createdAt
          }))
        });
      }
    },
    () => undefined
  );
}

export async function listStudyGroups(premium: boolean) {
  return withFallback(
    async () => {
      await ensureDefaultGroups();
      return prisma.studyGroup.findMany({
        where: premium ? undefined : { premiumOnly: false },
        orderBy: { id: "asc" }
      });
    },
    () => getStore().groups.filter((group) => !group.premiumOnly || premium)
  );
}

export async function listMessagesForGroup(groupId: number, premium: boolean) {
  return withFallback(
    async () => {
      await ensureDefaultGroups();
      const allowedGroup = await prisma.studyGroup.findFirst({
        where: {
          id: groupId,
          ...(premium ? {} : { premiumOnly: false })
        }
      });

      if (!allowedGroup) {
        return [] as GroupMessageRecord[];
      }

      const messages = await prisma.groupMessage.findMany({
        where: { groupId },
        orderBy: { createdAt: "asc" }
      });

      return messages.map(normalizeMessage);
    },
    () =>
      getStore()
        .messages
        .filter((message) => message.groupId === groupId)
        .filter((message) => {
          const group = getStore().groups.find((entry) => entry.id === message.groupId);
          return group ? !group.premiumOnly || premium : false;
        })
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((message) =>
          normalizeMessage({
            ...message,
            sharedSymbols: message.sharedSymbols.join(",")
          })
        )
  );
}

export async function createGroupMessage(input: {
  groupId: number;
  premium: boolean;
  userId?: number | null;
  authorEmail: string;
  authorName: string;
  content: string;
  symbol?: string | null;
  sharedSymbols?: string[];
}) {
  const content = input.content.trim();
  if (!content && (!input.sharedSymbols || input.sharedSymbols.length === 0)) {
    throw new Error("Write a message or share at least one symbol.");
  }

  return withFallback(
    async () => {
      await ensureDefaultGroups();

      const group = await prisma.studyGroup.findFirst({
        where: {
          id: input.groupId,
          ...(input.premium ? {} : { premiumOnly: false })
        }
      });

      if (!group) {
        throw new Error("You do not have access to that study group.");
      }

      const message = await prisma.groupMessage.create({
        data: {
          groupId: input.groupId,
          userId: input.userId ?? null,
          authorEmail: input.authorEmail,
          authorName: input.authorName || input.authorEmail.split("@")[0] || "Trader",
          content: content || "Shared a watchlist snapshot with the group.",
          symbol: input.symbol?.toUpperCase() ?? null,
          sharedSymbols: (input.sharedSymbols ?? []).map((item) => item.toUpperCase()).join(",")
        }
      });

      return normalizeMessage(message);
    },
    () => {
      const groups = getStore().groups.filter((group) => !group.premiumOnly || input.premium);
      const group = groups.find((entry) => entry.id === input.groupId);

      if (!group) {
        throw new Error("You do not have access to that study group.");
      }

      const store = getStore();
      const message: InMemoryMessage = {
        id: store.nextMessageId++,
        groupId: input.groupId,
        userId: input.userId ?? null,
        authorEmail: input.authorEmail,
        authorName: input.authorName || input.authorEmail.split("@")[0] || "Trader",
        content: content || "Shared a watchlist snapshot with the group.",
        symbol: input.symbol?.toUpperCase() ?? null,
        sharedSymbols: (input.sharedSymbols ?? []).map((item) => item.toUpperCase()),
        createdAt: new Date()
      };

      store.messages.push(message);
      return normalizeMessage({
        ...message,
        sharedSymbols: message.sharedSymbols.join(",")
      });
    }
  );
}
