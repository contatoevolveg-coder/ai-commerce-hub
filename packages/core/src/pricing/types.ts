export type TipoTarifa = 'percentual' | 'fixo' | 'matriz'

export interface FaixaMatriz {
  pesoMaximoGramas: number
  precoMaximoCentavos: bigint | null
  valorCentavos: bigint
}

export interface CanalTarifaRow {
  canalId: string
  categoria: string
  tipo: TipoTarifa
  valorBps: bigint | null
  valorCentavos: bigint | null
  matriz: FaixaMatriz[] | null
  vigenteDe: Date
  vigenteAte: Date | null
}

export type RegimeTributario = 'simples' | 'lucro_presumido' | 'lucro_real'

export interface FaixaFrete {
  pesoMaximoGramas: number
  precoMaximoCentavos: bigint | null
  valorCentavos: bigint
}

export interface FaixaTaxaFixa {
  precoMaximoCentavos: bigint | null
  valorCentavos: bigint
}

export interface CalcularMargemInput {
  precoVendaCentavos: bigint
  skuId: string
  canalId: string
  categoria: string
  pesoGramas: number
  cmvCentavos: bigint
  regimeTributario: RegimeTributario
  aliquotaImpostoBps: bigint
  data: Date
  tarifasCandidatas: CanalTarifaRow[]
  freteBrackets: FaixaFrete[]
  taxaFixaBrackets: FaixaTaxaFixa[]
}

export interface ResultadoMargem {
  precoBruto: bigint
  comissao: bigint
  taxaFixa: bigint
  frete: bigint
  imposto: bigint
  cmv: bigint
  margemLiquidaCentavos: bigint
  margemLiquidaBps: bigint
  precoPisoCentavos: bigint
}
