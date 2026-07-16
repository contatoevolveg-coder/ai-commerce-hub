import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/onboarding'
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');
      const isOnApiAuth = nextUrl.pathname.startsWith('/api/auth');
      
      // Allow API routes for auth to proceed
      if (isOnApiAuth) return true;

      if (isOnLogin || isOnOnboarding) {
        if (isLoggedIn) return Response.redirect(new URL('/governanca', nextUrl));
        return true;
      }

      // Se não está logado e não está nas rotas públicas, manda pro login
      if (!isLoggedIn) {
        return false; // Redirects to signIn page
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.clienteId = user.clienteId;
        token.papel = user.papel;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.clienteId = token.clienteId as string;
        session.user.papel = token.papel as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  providers: [], // providers will be added in auth.ts to avoid edge runtime issues with bcrypt/db
} satisfies NextAuthConfig
