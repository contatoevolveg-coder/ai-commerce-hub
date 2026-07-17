import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

export const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // auth() already executes the 'authorized' callback from auth.config.ts
  // so if we get here, the user is authorized (or it's a public route)
  
  const isLoggedIn = !!req.auth;
  const requestHeaders = new Headers(req.headers)

  // Prevenção de Header Spoofing: Deletamos os cabeçalhos sensíveis enviados pelo cliente
  // antes de injetar os nossos, assegurando que rotas desprotegidas ou mal configuradas
  // não confiem no input do usuário.
  requestHeaders.delete('x-tenant-id')
  requestHeaders.delete('x-user-role')
  requestHeaders.delete('x-user-id')

  if (isLoggedIn && req.auth?.user?.clienteId) {
    // Injeta os dados nos headers para as funções síncronas de lib/tenant.ts
    requestHeaders.set('x-tenant-id', req.auth.user.clienteId)
    if (req.auth.user.papel) requestHeaders.set('x-user-role', req.auth.user.papel)
    if (req.auth.user.id) requestHeaders.set('x-user-id', req.auth.user.id)
  }

  // Next.js requires returning a NextResponse with updated headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})

export const config = {
  // Matcher ignoring static files, api/auth, and images
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
