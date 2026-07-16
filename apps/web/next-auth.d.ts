import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      clienteId: string
      papel: string
    } & DefaultSession["user"]
  }

  interface User {
    clienteId: string
    papel: string
  }
}
