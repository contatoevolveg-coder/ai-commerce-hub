/**
 * Catálogo de ERPs suportados e os campos de credencial que cada um exige.
 *
 * É a fonte única que torna o sistema multi-ERP: a UI renderiza o formulário de conexão a
 * partir daqui, e o serviço valida as credenciais contra os campos daqui. Adicionar suporte a
 * um ERP novo = uma entrada aqui + o valor no enum `erp_tipo` do schema. Nenhuma lógica de
 * conexão é hardcoded para "Bling" — Bling é só a primeira entrada.
 *
 * Arquivo de dados puro (sem I/O, sem deps de servidor) — pode ser importado no client.
 */

export type ErpTipo = 'bling' | 'tiny' | 'outro'

export interface CampoCredencial {
  chave: string
  rotulo: string
  /** `password` = campo mascarado na UI (segredos). `text` = valor não sensível (ex. URL base). */
  tipo: 'text' | 'password'
  ajuda?: string
  opcional?: boolean
}

export interface ErpCatalogo {
  erp: ErpTipo
  nome: string
  descricao: string
  campos: CampoCredencial[]
}

export const CATALOGO_ERP: ErpCatalogo[] = [
  {
    erp: 'bling',
    nome: 'Bling',
    descricao: 'ERP de gestão: NF-e, estoque, pedidos e catálogo. OAuth2 (API v3).',
    campos: [
      {
        chave: 'clientId',
        rotulo: 'Client ID',
        tipo: 'text',
        ajuda: 'Painel de desenvolvedor do Bling → sua aplicação.',
      },
      { chave: 'clientSecret', rotulo: 'Client Secret', tipo: 'password' },
      {
        chave: 'code',
        rotulo: 'Código de Autorização (Opcional)',
        tipo: 'password',
        ajuda: 'Necessário para o primeiro login OAuth2. Se já estiver conectado, deixe em branco.',
        opcional: true,
      },
    ],
  },
  {
    erp: 'tiny',
    nome: 'Tiny ERP',
    descricao: 'ERP de gestão (grupo Olist). Autenticação por token de API.',
    campos: [{ chave: 'token', rotulo: 'Token da API', tipo: 'password' }],
  },
  {
    erp: 'outro',
    nome: 'Outro ERP',
    descricao: 'Conector genérico para um ERP fora da lista, via API REST.',
    campos: [
      {
        chave: 'baseUrl',
        rotulo: 'URL base da API',
        tipo: 'text',
        ajuda: 'Ex.: https://api.seu-erp.com/v1',
      },
      { chave: 'apiKey', rotulo: 'Chave de API', tipo: 'password' },
    ],
  },
]

export function getErpCatalogo(erp: ErpTipo): ErpCatalogo | undefined {
  return CATALOGO_ERP.find((c) => c.erp === erp)
}

export const ERPS_SUPORTADOS: ErpTipo[] = CATALOGO_ERP.map((c) => c.erp)
