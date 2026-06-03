import type { NextAuthConfig } from "next-auth";

const appRoutes = ["/", "/pipeline", "/capture", "/simulator", "/settings", "/leads"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export const authConfig = {
  pages: {
    signIn: "/login"
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = nextUrl;

      const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
      const isAppRoute = appRoutes.some((route) => (route === "/" ? pathname === "/" : pathname.startsWith(route)));

      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (isAppRoute) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
