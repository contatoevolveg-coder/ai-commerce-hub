import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Next carrega .env da pasta do app (apps/web), mas os segredos do monorepo ficam na
// raiz. Este loader mínimo (sem dependência de dotenv) popula process.env a partir do
// .env da raiz em dev/build local. NÃO sobrescreve variáveis já presentes — em produção
// (Vercel) o env vem do painel e este arquivo pode nem existir (try/catch silencioso).
const raizEnv = join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env")
try {
  for (const linha of readFileSync(raizEnv, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // .env ausente (ex.: build em CI/Vercel com env injetado) — segue com o ambiente atual.
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `postgres` usa APIs de Node (net/tls) e só roda no servidor. Mantê-lo externo evita
  // que o bundler tente empacotá-lo em código de cliente/edge.
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
}

export default nextConfig
