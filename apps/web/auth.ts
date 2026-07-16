import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { z } from 'zod'
import { db, dbAuthBootstrap } from '@ai-commerce/db'
import { usuario, papel } from '@ai-commerce/db/src/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          
          // Buscar usuário no banco (ignorando RLS para resolver auth inicial)
          const rows = await dbAuthBootstrap
            .select({
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              senhaHash: usuario.senhaHash,
              clienteId: usuario.clienteId,
              ativo: usuario.ativo,
              papelId: usuario.papelId,
            })
            .from(usuario)
            .where(eq(usuario.email, email))
            .limit(1)

          if (rows.length === 0) return null

          const user = rows[0]
          if (!user.ativo) return null // Usuário desativado

          // Buscar descrição do papel
          const roles = await dbAuthBootstrap
            .select({ codigo: papel.codigo })
            .from(papel)
            .where(eq(papel.id, user.papelId))
            .limit(1)

          const passwordsMatch = await bcrypt.compare(password, user.senhaHash)

          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.nome,
              email: user.email,
              clienteId: user.clienteId,
              papel: roles[0]?.codigo || 'admin',
            }
          }
        }

        console.log('Credenciais inválidas')
        return null
      },
    }),
  ],
})
