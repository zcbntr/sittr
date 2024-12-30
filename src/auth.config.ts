import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import type { NextAuthConfig } from "next-auth";

// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
} satisfies NextAuthConfig;
