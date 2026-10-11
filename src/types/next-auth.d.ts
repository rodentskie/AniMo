import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    tokenVersion: number;
  }

  interface User {
    tokenVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    tokenVersion: number;
  }
}
