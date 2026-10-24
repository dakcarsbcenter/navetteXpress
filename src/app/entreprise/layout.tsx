import { NextIntlClientProvider } from "next-intl"
import { getDashboardLocale } from "@/lib/dashboard-locale"
import { getDashboardMessages } from "@/i18n/dashboard-messages"
import { DashboardRootShell } from "@/components/layout/DashboardRootShell"
import { EntrepriseShell } from "@/components/entreprise/EntrepriseShell"

export default async function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  const locale = await getDashboardLocale()
  const messages = await getDashboardMessages(locale, ["common", "entreprise"])

  return (
    <DashboardRootShell>
    <NextIntlClientProvider locale={locale} messages={messages}>
      <EntrepriseShell>{children}</EntrepriseShell>
    </NextIntlClientProvider>
    </DashboardRootShell>
  )
}
