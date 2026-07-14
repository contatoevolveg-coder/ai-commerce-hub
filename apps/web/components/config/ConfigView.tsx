"use client"

import { useState } from "react"
import { Card, Button, Badge, Input, Field } from "@ai-commerce/ui"
import {
  SettingsNav,
  type SettingsSectionKey,
} from "@/components/config/SettingsNav"
import { SettingsSection } from "@/components/config/SettingsSection"

interface Marketplace {
  id: string
  name: string
}

const marketplaces: Marketplace[] = [
  { id: "mercado-livre", name: "Mercado Livre" },
  { id: "shopee", name: "Shopee" },
  { id: "amazon", name: "Amazon" },
  { id: "magalu", name: "Magalu" },
]

interface NotificationPreference {
  id: string
  label: string
  description: string
}

const notificationPreferences: NotificationPreference[] = [
  {
    id: "new-orders",
    label: "Novos pedidos",
    description: "Receba um aviso a cada pedido recebido",
  },
  {
    id: "low-stock",
    label: "Estoque baixo",
    description: "Alertas quando um produto atingir o estoque mínimo",
  },
  {
    id: "agent-actions",
    label: "Ações dos agentes",
    description: "Resumo diário das ações executadas pelos agentes de IA",
  },
]

export function ConfigView() {
  const [active, setActive] = useState<SettingsSectionKey>("perfil")

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <SettingsNav active={active} onChange={setActive} />
      </aside>

      <div className="flex-1">
        {active === "perfil" && (
          <SettingsSection
            title="Perfil"
            description="Gerencie suas informações pessoais"
          >
            <Field label="Nome" htmlFor="perfil-nome">
              <Input id="perfil-nome" placeholder="Seu nome completo" />
            </Field>
            <Field label="E-mail" htmlFor="perfil-email">
              <Input
                id="perfil-email"
                type="email"
                placeholder="voce@exemplo.com"
              />
            </Field>
          </SettingsSection>
        )}

        {active === "loja" && (
          <SettingsSection
            title="Loja"
            description="Configure os dados da sua loja"
          >
            <Field label="Nome da loja" htmlFor="loja-nome">
              <Input id="loja-nome" placeholder="Nome da sua loja" />
            </Field>
            <Field
              label="Descrição"
              htmlFor="loja-descricao"
              hint="Um breve resumo exibido para seus clientes"
            >
              <Input
                id="loja-descricao"
                placeholder="O que a sua loja vende"
              />
            </Field>
            <Field label="CNPJ" htmlFor="loja-cnpj">
              <Input id="loja-cnpj" placeholder="00.000.000/0000-00" />
            </Field>
          </SettingsSection>
        )}

        {active === "integracoes" && (
          <SettingsSection
            title="Integrações"
            description="Conecte seus marketplaces para centralizar as vendas"
          >
            {marketplaces.map((marketplace) => (
              <Card
                key={marketplace.id}
                padding="sm"
                className="flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-primary-text">
                    {marketplace.name}
                  </span>
                  <Badge variant="default">Desconectado</Badge>
                </div>
                <Button size="sm">Conectar</Button>
              </Card>
            ))}
          </SettingsSection>
        )}

        {active === "notificacoes" && (
          <SettingsSection
            title="Notificações"
            description="Escolha os avisos que deseja receber"
          >
            {notificationPreferences.map((preference) => (
              <Card
                key={preference.id}
                padding="sm"
                className="flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-primary-text">
                    {preference.label}
                  </span>
                  <span className="text-xs text-muted">
                    {preference.description}
                  </span>
                </div>
                <Badge variant="success">Ativado</Badge>
              </Card>
            ))}
          </SettingsSection>
        )}

        {active === "faturamento" && (
          <SettingsSection
            title="Faturamento"
            description="Gerencie seu plano e forma de pagamento"
          >
            <Card
              padding="sm"
              className="flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-primary-text">
                  Plano Pro
                </span>
                <span className="text-xs text-muted">
                  R$ 199/mês, renova em 13 de agosto de 2026
                </span>
              </div>
              <Badge variant="success">Ativo</Badge>
            </Card>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">
                Alterar plano
              </Button>
              <Button variant="ghost" size="sm">
                Ver faturas
              </Button>
            </div>
          </SettingsSection>
        )}
      </div>
    </div>
  )
}
