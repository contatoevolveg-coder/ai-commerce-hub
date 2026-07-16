'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { dbAuthBootstrap } from '@ai-commerce/db'
import { cliente, usuario, papel } from '@ai-commerce/db/src/schema'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', Object.fromEntries(formData))
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciais inválidas.'
        default:
          return 'Algo deu errado.'
      }
    }
    throw error
  }
}

const registerSchema = z.object({
  razaoSocial: z.string().min(2),
  cnpj: z.string().optional(),
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function registerTenant(prevState: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return 'Dados inválidos. Verifique os campos e tente novamente.'
  }

  const { razaoSocial, cnpj, nome, email, password } = parsed.data

  try {
    // 1. Verificar se email já existe
    const ex = await dbAuthBootstrap.select({ id: usuario.id }).from(usuario).where(eq(usuario.email, email)).limit(1)
    if (ex.length > 0) return 'Email já cadastrado.'

    // 2. Hash da senha
    const senhaHash = await bcrypt.hash(password, 10)

    // 3. Garantir que papel Admin exista
    let [adminRole] = await dbAuthBootstrap.select().from(papel).where(eq(papel.codigo, 'admin')).limit(1)
    if (!adminRole) {
      const [novoPapel] = await dbAuthBootstrap.insert(papel).values({ codigo: 'admin', descricao: 'Administrador' }).returning()
      adminRole = novoPapel
    }

    // 4. Inserir Cliente e Usuário
    await dbAuthBootstrap.transaction(async (tx) => {
      const [novoCliente] = await tx
        .insert(cliente)
        .values({ nome: razaoSocial, cnpj: cnpj })
        .returning({ id: cliente.id })

      await tx.insert(usuario).values({
        clienteId: novoCliente.id,
        papelId: adminRole.id,
        nome,
        email,
        senhaHash,
      })
    })

    // Sucesso, tenta logar
    await signIn('credentials', { email, password })
  } catch (error) {
    if (error instanceof AuthError) throw error // Para o redirect do NextAuth funcionar
    console.error(error)
    return 'Erro interno ao criar conta.'
  }
}
