import { DashboardRootShell } from "@/components/layout/DashboardRootShell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardRootShell>{children}</DashboardRootShell>
}
