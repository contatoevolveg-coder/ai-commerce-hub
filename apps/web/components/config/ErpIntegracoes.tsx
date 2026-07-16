"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, Button, Badge, Input, Field, Modal } from "@ai-commerce/ui"
import {
  CATALOGO_ERP,
  type ErpTipo,
  type ErpCatalogo,
} from "@ai-commerce/core/src/integracoes/catalogo-erp"

interface Conexao {
  id: string
  erp: ErpTipo
  rotulo: string
  status: "conectado" | "desconectado" | "erro"
}

export function ErpIntegracoes() {
  const [conexoes, setConexoes] = useState<Conexao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erpAtivo, setErpAtivo] = useState<ErpCatalogo | null>(null)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [rotulo, setRotulo] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const statusPorErp = useMemo(() => {
    const m = new Map<ErpTipo, Conexao>()
    for (const c of conexoes) m.set(c.erp, c)
    return m
  }, [conexoes])

  async function carregar() {
    setCarregando(true)
    try {
      const res = await fetch("/api/integracoes/erp")
      if (res.ok) setConexoes(await res.json())
    } catch {
      // Silencioso: sem a listagem, a UI mostra tudo como desconectado.
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrir(cat: ErpCatalogo) {
    setErpAtivo(cat)
    setRotulo(cat.nome)
    setValores(Object.fromEntries(cat.campos.map((c) => [c.chave, ""])))
    setErro(null)
  }

  function fechar() {
    setErpAtivo(null)
    setEnviando(false)
    setErro(null)
  }

  async function salvar() {
    if (!erpAtivo) return
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch("/api/integracoes/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ erp: erpAtivo.erp, rotulo, credenciais: valores }),
      })
      if (res.ok) {
        fechar()
        await carregar()
      } else {
        const data = await res.json().catch(() => ({}))
        setErro(typeof data.erro === "string" ? data.erro : "Não foi possível salvar a conexão.")
      }
    } catch {
      setErro("Erro de rede ao salvar a conexão.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {CATALOGO_ERP.map((cat) => {
          const conectado = statusPorErp.get(cat.erp)?.status === "conectado"
          return (
            <Card key={cat.erp} padding="sm" className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary-text">{cat.nome}</span>
                  <Badge variant={conectado ? "success" : "default"}>
                    {conectado ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                <span className="text-xs text-muted">{cat.descricao}</span>
              </div>
              <Button
                size="sm"
                variant={conectado ? "secondary" : "primary"}
                onClick={() => abrir(cat)}
              >
                {conectado ? "Reconectar" : "Conectar"}
              </Button>
            </Card>
          )
        })}
        {carregando && <span className="text-xs text-muted">Carregando conexões…</span>}
      </div>

      <Modal
        open={erpAtivo !== null}
        onClose={fechar}
        title={erpAtivo ? `Conectar ${erpAtivo.nome}` : ""}
        description="As credenciais são cifradas (AES-256-GCM) antes de serem salvas — nunca ficam em texto plano nem em log."
      >
        {erpAtivo && (
          <div className="flex flex-col gap-4">
            <Field label="Nome da conexão" htmlFor="erp-rotulo">
              <Input
                id="erp-rotulo"
                value={rotulo}
                onChange={(e) => setRotulo(e.target.value)}
              />
            </Field>

            {erpAtivo.campos.map((campo) => (
              <Field
                key={campo.chave}
                label={campo.rotulo}
                htmlFor={`erp-${campo.chave}`}
                hint={campo.ajuda}
              >
                <Input
                  id={`erp-${campo.chave}`}
                  type={campo.tipo === "password" ? "password" : "text"}
                  autoComplete="off"
                  value={valores[campo.chave] ?? ""}
                  onChange={(e) =>
                    setValores((v) => ({ ...v, [campo.chave]: e.target.value }))
                  }
                />
              </Field>
            ))}

            {erro && (
              <div className="rounded-sm border border-danger/40 bg-danger/12 px-3 py-2 text-xs text-danger">
                {erro}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={fechar} disabled={enviando}>
                Cancelar
              </Button>
              <Button size="sm" onClick={salvar} disabled={enviando}>
                {enviando ? "Salvando…" : "Salvar conexão"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
