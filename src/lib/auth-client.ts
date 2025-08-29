import { createAuthClient } from "@/lib/better-auth/react";

export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;
