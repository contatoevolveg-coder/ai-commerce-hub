# Guia de Rotação de Senhas e Chaves (Hardening F9)

Em caso de vazamento, diagnóstico em produção ou ciclo de segurança periódico, siga estes passos para rotacionar as credenciais críticas do AI Commerce Hub.

## 1. Rotação de Senhas do Banco de Dados (Supabase)

O sistema utiliza duas roles no Supabase:
- `postgres`: Usada pelo Transaction Pooler para estabelecer a conexão.
- `app_role`: Usada pelo código da aplicação (`withTenant`) via `SET LOCAL ROLE` para impor o Row Level Security.

### Como rotacionar:
1. **postgres**:
   - Vá ao painel do Supabase do projeto.
   - Navegue em **Project Settings > Database > Database password**.
   - Clique em **Reset password** e gere uma nova.
   - Atualize a variável `DATABASE_URL` no painel da Vercel (Projeto Web e Worker).

2. **app_role**:
   - Vá ao **SQL Editor** no painel do Supabase.
   - Execute: `ALTER ROLE app_role WITH PASSWORD 'nova-senha-muito-forte';`
   - Atualize a variável `APP_ROLE_PASSWORD` (se houver/usada em algum lugar) ou simplesmente anote no seu cofre de senhas (a role é usada via script interno ou funções de bootstrap).

## 2. Rotação da `CREDENTIAL_ENCRYPTION_KEY`

Esta chave cifra os tokens do Bling e Mercado Livre. Se você a rotacionar, **todos os tokens existentes precisarão ser reautenticados/reinseridos**, pois eles não poderão ser decifrados com a chave nova (o sistema retornará 503 ou pedirá reconexão).

### Como rotacionar:
1. Gere uma nova chave de exatos 32 bytes em Base64:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. Vá ao painel da **Vercel**.
3. Em **ambos** os projetos (Web App e Worker), vá em **Settings > Environment Variables**.
4. Atualize o valor de `CREDENTIAL_ENCRYPTION_KEY`.
5. **Forçar Redeploy (CRÍTICO):** A Vercel não aplica variáveis novas a deployments existentes e ignora commits vazios. Faça um push com um **diff real** no código (ex: adicione um comentário num arquivo) para disparar o build e pegar a nova chave.

---
*Documentação criada como parte da Fase 9 (Hardening).*
