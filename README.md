# AI Commerce Hub

Sistema operacional de IA para operação de e-commerce multicanal.

## Setup Inicial

Em uma máquina limpa, execute os seguintes comandos:

```bash
# 1. Instale as dependências
pnpm i

# 2. Suba a infraestrutura (Postgres, Redis, Mailhog)
docker compose up -d

# 3. Inicie o ambiente de desenvolvimento (Web, Worker, Storybook)
pnpm dev
```

### URLs Locais
- Web App: http://localhost:3000
- Storybook: http://localhost:6006
- Mailhog UI: http://localhost:8025
- Postgres: `postgres://postgres:postgres@localhost:5432/ai_commerce`
- Redis: `redis://localhost:6379`
