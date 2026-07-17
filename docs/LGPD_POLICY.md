# Política de Retenção e Exclusão de Dados (LGPD)

O AI Commerce Hub atua como Operador dos dados fornecidos pelos seus clientes (Lojistas), que são os Controladores perante a LGPD.

## 1. Escopo de Retenção
- **Dados Ativos**: Mantidos enquanto o contrato do lojista estiver vigente.
- **Logs de Auditoria (`audit_log`)**: Mantidos indefinidamente (append-only) com propósitos de segurança e rastreabilidade para os clientes, exceto em caso de encerramento da conta onde a deleção integral ("direito ao esquecimento") for exercida.
- **Backup**: Os backups do banco de dados são retidos por 30 dias. Dados excluídos da base principal podem persistir em backups durante esse período antes de expurgados de forma automatizada.

## 2. Exclusão de Conta (Direito ao Esquecimento)
O sistema provê um mecanismo de exclusão total via painel (`DELETE /api/clientes/lgpd`):
- **O que é deletado?**: O tenant principal (`cliente`) e todo e qualquer rastro relacional por `CASCADE` (usuários, sessões, tokens oauth, conexões erp, produtos, pedidos, logs de auditoria atrelados ao cliente).
- **Quem pode solicitar?**: Exclusivamente um usuário logado com o papel `admin` no respectivo Tenant.
- **Rastro Residual**: O encerramento do tenant gerará um log imutável a nível de sistema (fora do isolamento do tenant) registrando apenas que o ID da loja "X" solicitou exclusão na data "Y" por um administrador. Nenhum PII ou dado negocial é mantido.
