-- Better Auth Default Schema Migration
-- This migration creates the default Better Auth tables

-- Drop existing Better Auth tables if they exist
DROP TABLE IF EXISTS "public"."better_auth_verificationTokens" CASCADE;
DROP TABLE IF EXISTS "public"."better_auth_accounts" CASCADE;
DROP TABLE IF EXISTS "public"."better_auth_sessions" CASCADE;
DROP TABLE IF EXISTS "public"."better_auth_users" CASCADE;

-- Create sessions table
CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create verificationTokens table
CREATE TABLE IF NOT EXISTS "public"."verificationTokens" (
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "token" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "provider" text NOT NULL,
    "providerAccountId" text NOT NULL,
    "refreshToken" text,
    "accessToken" text,
    "expiresAt" bigint,
    "tokenType" text,
    "scope" text,
    "idToken" text,
    "sessionState" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

-- Add primary keys
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."verificationTokens" ADD CONSTRAINT "verificationTokens_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- Add unique constraints
CREATE UNIQUE INDEX "sessions_id_key" ON "public"."sessions" USING btree ("id");
CREATE UNIQUE INDEX "verificationTokens_token_key" ON "public"."verificationTokens" USING btree ("token");
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts" USING btree ("provider", "providerAccountId");

-- Add foreign key constraints
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."verificationTokens" ADD CONSTRAINT "verificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verificationTokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE "public"."sessions" TO "service_role";
GRANT SELECT ON TABLE "public"."sessions" TO "anon";
GRANT SELECT ON TABLE "public"."sessions" TO "authenticated";

GRANT ALL ON TABLE "public"."verificationTokens" TO "service_role";
GRANT SELECT ON TABLE "public"."verificationTokens" TO "anon";
GRANT SELECT ON TABLE "public"."verificationTokens" TO "authenticated";

GRANT ALL ON TABLE "public"."accounts" TO "service_role";
GRANT SELECT ON TABLE "public"."accounts" TO "anon";
GRANT SELECT ON TABLE "public"."accounts" TO "authenticated";

-- Add to realtime publication
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."sessions";
