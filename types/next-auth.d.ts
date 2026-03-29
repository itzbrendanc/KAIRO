import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name?: string | null;
      premium: boolean;
      emailVerified: boolean;
      marketingOptIn: boolean;
      productUpdatesOptIn: boolean;
    };
  }

  interface User {
    id: number;
    premium: boolean;
    emailVerified: boolean;
    marketingOptIn: boolean;
    productUpdatesOptIn: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    premium?: boolean;
    emailVerified?: boolean;
    marketingOptIn?: boolean;
    productUpdatesOptIn?: boolean;
  }
}
