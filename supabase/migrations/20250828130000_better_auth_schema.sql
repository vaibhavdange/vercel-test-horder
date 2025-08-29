-- Better Auth Schema Migration
-- This migration adds the required tables for Better Auth

-- Create Better Auth tables
CREATE TABLE IF NOT EXISTS "public"."better_auth_users" (
    "id" text NOT NULL,
    "email" text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."better_auth_sessions" (
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."better_auth_verificationTokens" (
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "token" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."better_auth_accounts" (
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
ALTER TABLE ONLY "public"."better_auth_users"
    ADD CONSTRAINT "better_auth_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."better_auth_sessions"
    ADD CONSTRAINT "better_auth_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."better_auth_verificationTokens"
    ADD CONSTRAINT "better_auth_verificationTokens_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."better_auth_accounts"
    ADD CONSTRAINT "better_auth_accounts_pkey" PRIMARY KEY ("id");

-- Add unique constraints
CREATE UNIQUE INDEX "better_auth_users_email_key" ON "public"."better_auth_users" USING btree ("email");
CREATE UNIQUE INDEX "better_auth_sessions_id_key" ON "public"."better_auth_sessions" USING btree ("id");
CREATE UNIQUE INDEX "better_auth_verificationTokens_token_key" ON "public"."better_auth_verificationTokens" USING btree ("token");
CREATE UNIQUE INDEX "better_auth_accounts_provider_providerAccountId_key" ON "public"."better_auth_accounts" USING btree ("provider", "providerAccountId");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."better_auth_sessions"
    ADD CONSTRAINT "better_auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."better_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."better_auth_verificationTokens"
    ADD CONSTRAINT "better_auth_verificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."better_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."better_auth_accounts"
    ADD CONSTRAINT "better_auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."better_auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "public"."better_auth_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."better_auth_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."better_auth_verificationTokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."better_auth_accounts" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE "public"."better_auth_users" TO "service_role";
GRANT SELECT ON TABLE "public"."better_auth_users" TO "anon";
GRANT SELECT ON TABLE "public"."better_auth_users" TO "authenticated";

GRANT ALL ON TABLE "public"."better_auth_sessions" TO "service_role";
GRANT SELECT ON TABLE "public"."better_auth_sessions" TO "anon";
GRANT SELECT ON TABLE "public"."better_auth_sessions" TO "authenticated";

GRANT ALL ON TABLE "public"."better_auth_verificationTokens" TO "service_role";
GRANT SELECT ON TABLE "public"."better_auth_verificationTokens" TO "anon";
GRANT SELECT ON TABLE "public"."better_auth_verificationTokens" TO "authenticated";

GRANT ALL ON TABLE "public"."better_auth_accounts" TO "service_role";
GRANT SELECT ON TABLE "public"."better_auth_accounts" TO "anon";
GRANT SELECT ON TABLE "public"."better_auth_accounts" TO "authenticated";

-- Add to realtime publication
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."better_auth_users";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."better_auth_sessions";
