'use client'

import { authenticate } from '../actions'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      className="mt-4 w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
      disabled={pending}
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  )
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined)

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0b1220]">
      <div className="w-full max-w-md bg-white dark:bg-[#131d35] border border-slate-200 dark:border-[#233152] rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Infinoos Commerce</h1>
          <p className="text-slate-500 dark:text-[#93a1c2] text-sm mt-2">
            Faça login para gerenciar suas operações
          </p>
        </div>

        <form action={dispatch} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              id="email"
              type="email"
              name="email"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="password">
              Senha
            </label>
            <input
              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              id="password"
              type="password"
              name="password"
              required
              minLength={6}
            />
          </div>

          {errorMessage && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {errorMessage}
            </div>
          )}

          <SubmitButton />
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-[#93a1c2]">
          Não tem uma conta?{' '}
          <Link href="/onboarding" className="text-blue-600 hover:underline">
            Cadastre sua loja
          </Link>
        </div>
      </div>
    </div>
  )
}
