import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const withConnectTimeout = (url: string): string => {
  if (url.includes("connect_timeout=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=10`;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString: withConnectTimeout(process.env.DATABASE_URL),
});

export const prisma = global.__prisma__ ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
