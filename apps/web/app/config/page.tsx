import { PageHeader } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { ConfigView } from "@/components/config/ConfigView"

export default async function ConfigPage() {
  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Configurações"
          subtitle="Gerencie sua conta, loja e integrações"
        />
        <ConfigView />
      </div>
    </Shell>
  )
}
