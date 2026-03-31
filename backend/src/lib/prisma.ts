import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const withConnectTimeout = (url: string): string => {
  if (url.includes("connect_timeout=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=10`;
};

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  // Fail fast in serverless instead of hanging on pending DB calls.
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: withConnectTimeout(dbUrl) });
export const prisma = new PrismaClient({ adapter });
