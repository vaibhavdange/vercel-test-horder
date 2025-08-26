import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Create Prisma client with better error handling
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    throw new Error('DATABASE_URL environment variable is required');
  }

  return new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
