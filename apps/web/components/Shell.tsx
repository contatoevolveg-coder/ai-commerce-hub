"use client"

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@ai-commerce/ui/src/lib/utils'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Bot, 
  Users, 
  BarChart3, 
  Settings,
  Bell,
  UserCircle,
  ShieldCheck
} from 'lucide-react'

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Governança", href: "/governanca", icon: ShieldCheck },
  { name: "Agentes IA", href: "/agentes", icon: Bot },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Configurações", href: "/config", icon: Settings },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [greeting, setGreeting] = useState("Olá")

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-app font-sans text-body">
      <aside className="flex w-[248px] flex-col border-r border-border-subtle bg-surface">
        <div className="flex h-[56px] items-center border-b border-border-subtle px-4 font-bold text-primary-text">
          AI Commerce Hub
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-hover",
                  isActive
                    ? "bg-hover text-primary-text border-l-4 border-primary pl-2"
                    : "text-muted hover:text-body"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted group-hover:text-body")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[56px] w-full items-center justify-between border-b border-border-subtle bg-surface px-6">
          <div className="text-sm font-medium text-muted">
            {greeting}, <span className="text-primary-text">João</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted hover:text-primary-text transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
            </button>
            <button className="text-muted hover:text-primary-text transition-colors">
              <UserCircle className="h-7 w-7" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
