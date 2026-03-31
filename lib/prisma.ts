import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function isSupabaseDirectUrl(url: string | undefined) {
  return Boolean(url && /@db\.[^.]+\.supabase\.co:5432\//.test(url));
}

function isSupabasePoolerUrl(url: string | undefined) {
  return Boolean(
    url &&
      (url.includes(".pooler.supabase.com:5432") ||
        url.includes(".pooler.supabase.com:6543"))
  );
}

function resolveDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  // Recover from a common Supabase/Vercel misconfiguration where the direct
  // connection string is saved into DATABASE_URL and the pooled string is saved
  // into DIRECT_URL. Prisma runtime should prefer the pooled URL.
  if (isSupabaseDirectUrl(databaseUrl) && isSupabasePoolerUrl(directUrl)) {
    return directUrl;
  }

  return databaseUrl;
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log: ["error"]
  });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

// Delay client construction until the first actual database call. This keeps
// server-only page imports from eagerly instantiating Prisma during build.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrisma() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  }
});
