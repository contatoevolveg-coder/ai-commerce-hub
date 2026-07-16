# APROVAÇÃO F4.1/F4.2 — com 2 ajustes obrigatórios antes de codar

> Cole isto no Antigravity como resposta ao `implementation_plan.md` que ele apresentou. É uma
> aprovação condicional: o plano está bom, mas faltam 2 ajustes concretos encontrados ao conferir
> o estado real de `packages/integrations` — inclua-os como parte do F4.1, não pule.

---

## Ajuste 1 — `packages/integrations/package.json` não tem `zod`, `vitest` nem script `test`

Conferido agora: o pacote está assim hoje —

```json
{
  "name": "@ai-commerce/integrations",
  "scripts": { "typecheck": "tsc --noEmit", "lint": "eslint src --ext .ts,.tsx" },
  "dependencies": {},
  "devDependencies": { "typescript": "5.4.5" }
}
```

Sem `test` script e sem `zod`/`vitest` nas deps, o DoD do F4.1 (`pnpm --filter integrations test`)
falha no primeiro comando, antes mesmo de rodar qualquer teste real.

**Adicione como Passo 0 do F4.1**, antes de "Setup de Tipos e Contratos":

- `zod` como `dependencies` — **não é lib nova ao monorepo** (já usada em `packages/core` e em
  todo o projeto), só nova a este `package.json`. Não precisa de aprovação separada de
  dependência externa, mas registre no diff.
- `vitest` como `devDependency`, espelhando exatamente o que já existe em
  `packages/core/package.json` (mesma versão: `1.6.0`).
- Script `"test": "vitest run"` (mesmo padrão do `core`).

Isso é edição aditiva de um `package.json` existente — segue a regra 1/2 do `ANTIGRAVITY_RULES.md`
(superset, não reescrita isolada): mantenha `typecheck`/`lint` como estão, só adicione `test` e as
deps.

---

## Ajuste 2 — env do registry: schema próprio em `integrations`, não estender `core/env.ts`

`packages/core/src/env.ts` já tem um padrão Zod de env (`DATABASE_URL`, `NODE_ENV`) — **não
estenda esse arquivo** com `ADAPTER_MODE`/`ERROR_RATE`. Motivo: isso criaria uma razão para
`integrations` depender de `core` só por causa de env, quando a direção de dependência do projeto
é `apps/web → core/services → integrations` (o registry de adapters não deveria puxar `core`).

Crie `packages/integrations/src/env.ts` com o mesmo padrão (schema Zod, `safeParse`, throw se
inválido), só que local:

```ts
import { z } from 'zod'

const envSchema = z.object({
  ADAPTER_MODE: z.enum(['mock', 'real']).default('mock'),
  ERROR_RATE: z.coerce.number().min(0).max(1).default(0.05),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  throw new Error(`Invalid environment variables (integrations): ${JSON.stringify(_env.error.format())}`)
}

export const env = _env.data
```

Use este `env` dentro de `registry.ts` e dos mocks (`withLatency`/taxa de erro).

---

## Aprovação

Com os 2 ajustes acima incorporados ao Passo 0/Passo 2 do F4.1: **plano aprovado**. Pode:

1. Criar o branch `feat/f4-integracoes-mock`.
2. Executar o F4.1 completo (contratos → mocks → registry → testes), incluindo os 2 ajustes.
3. Rodar o DoD do F4.1 (`pnpm --filter integrations typecheck && lint && test`) e colar a saída
   real antes de seguir.
4. **Parar após o F4.1** e aguardar minha aprovação explícita antes de iniciar o F4.2 — não
   emende as duas entregas num commit só (regra do `AGENTS.md`: uma feature/etapa por vez, DoD
   verde a cada uma).

Se durante a implementação surgir qualquer ambiguidade não coberta pelo plano ou por
`PROMPT_F4.md`, pare e pergunte — não invente.
