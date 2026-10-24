import { ClientMessages } from "@/i18n/ClientMessages";

// Toutes les pages d'authentification sont des composants clients sur le namespace auth.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ClientMessages namespaces={["auth"]}>{children}</ClientMessages>;
}
