import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Create Prisma client with better error handling
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    throw new Error('DATABASE_URL environment variable is required');
  }

  // For Supabase on Vercel, prioritize DIRECT_URL over DATABASE_URL
  let databaseUrl = process.env.DIRECT_URL;
  
  // If no DIRECT_URL, fall back to DATABASE_URL
  if (!databaseUrl) {
    databaseUrl = process.env.DATABASE_URL;
  }
  
  console.log('Creating Prisma client with URL:', databaseUrl ? 'URL set' : 'No URL');
  console.log('Environment check:', {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    nodeEnv: process.env.NODE_ENV,
    finalUrl: databaseUrl ? 'Using: ' + (databaseUrl.includes('DIRECT_URL') ? 'DIRECT_URL' : 'DATABASE_URL') : 'No URL'
  });

  // Ensure the URL starts with postgresql://
  if (databaseUrl && !databaseUrl.startsWith('postgresql://')) {
    console.error('Invalid database URL format. Expected postgresql:// but got:', databaseUrl.substring(0, 20) + '...');
    throw new Error('Database URL must start with postgresql://');
  }

  return new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
