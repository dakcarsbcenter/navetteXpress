"use client"

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  SquaresFour,
  CalendarBlank,
  FileText,
  Receipt,
  Star,
  PencilSimple,
  User,
  SignOut,
  Circle,
} from '@phosphor-icons/react'
import { ThemeToggle } from '@/app/driver/dashboard/components/ThemeToggle'
import { DashboardLanguageSwitcher } from '@/components/dashboard/DashboardLanguageSwitcher'

interface NavItem {
  href: string
  label: string
  mobileLabel: string
  icon: React.ComponentType<{
    size?: number
    className?: string
    weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  }>
  tab?: string
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        active
          ? 'border-(--color-client-accent) bg-[color-mix(in_srgb,var(--color-client-accent)_10%,transparent)] text-(--color-client-accent)'
          : 'border-transparent text-(--text-muted) hover:border-(--color-client-border) hover:bg-[color-mix(in_srgb,var(--color-client-card)_75%,transparent)] hover:text-(--color-client-text-primary)'
      }`}
    >
      {active && (
        <span className="absolute -left-3 top-2 h-7 w-1 rounded-full bg-(--color-client-accent)" />
      )}
      <Icon size={16} weight={active ? 'fill' : 'regular'} />
      <span>{item.label}</span>
    </Link>
  )
}

function ClientSidebarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const t = useTranslations('client')

  const principalItems: NavItem[] = [
    { href: '/client/dashboard', label: t('sidebar.nav.overview'), mobileLabel: t('sidebar.nav.overviewMobile'), icon: SquaresFour, tab: 'overview' },
    { href: '/client/dashboard?tab=bookings', label: t('sidebar.nav.bookings'), mobileLabel: t('sidebar.nav.bookingsMobile'), icon: CalendarBlank, tab: 'bookings' },
  ]

  const serviceItems: NavItem[] = [
    { href: '/client/dashboard?tab=quotes', label: t('sidebar.nav.quotes'), mobileLabel: t('sidebar.nav.quotesMobile'), icon: FileText, tab: 'quotes' },
    { href: '/client/dashboard?tab=invoices', label: t('sidebar.nav.invoices'), mobileLabel: t('sidebar.nav.invoicesMobile'), icon: Receipt, tab: 'invoices' },
  ]

  const accountItems: NavItem[] = [
    { href: '/client/dashboard?tab=create-reviews', label: t('sidebar.nav.createReviews'), mobileLabel: t('sidebar.nav.createReviewsMobile'), icon: PencilSimple, tab: 'create-reviews' },
    { href: '/client/dashboard?tab=reviews', label: t('sidebar.nav.reviews'), mobileLabel: t('sidebar.nav.reviewsMobile'), icon: Star, tab: 'reviews' },
    { href: '/client/dashboard?tab=profile', label: t('sidebar.nav.profile'), mobileLabel: t('sidebar.nav.profileMobile'), icon: User, tab: 'profile' },
  ]

  const currentTab = searchParams?.get('tab') ?? 'overview'

  const isActive = (item: NavItem) => {
    if (!item.tab) return pathname === item.href
    if (item.tab === 'overview') {
      return pathname === '/client/dashboard' && !searchParams?.get('tab')
    }
    return pathname === '/client/dashboard' && currentTab === item.tab
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'CX'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const allMobileItems = [...principalItems, ...serviceItems, ...accountItems]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: 'var(--color-client-border)', backgroundColor: 'var(--color-client-card)' }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ backgroundColor: 'var(--color-client-accent)' }}
            >
              <span className="text-xs font-bold text-white">NX</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                Navette <span style={{ color: 'var(--color-client-accent)' }}>Xpress</span>
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {t('sidebar.brandTagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--color-client-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-xs font-bold"
              style={{
                border: '1px solid var(--color-client-border)',
                backgroundColor: 'var(--color-client-surface)',
                color: 'var(--color-client-text-primary)',
              }}
            >
              {getInitials(session?.user?.name)}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-client-text-primary)' }}>
                {session?.user?.name ?? t('sidebar.defaultName')}
              </p>
              <div
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)',
                  color: 'var(--success)',
                }}
              >
                <Circle size={8} weight="fill" />
                {t('sidebar.online')}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            <p
              className="px-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('sidebar.sectionPrincipal')}
            </p>
            {principalItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item)} />
            ))}
          </div>

          <div className="space-y-2">
            <p
              className="px-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('sidebar.sectionServices')}
            </p>
            {serviceItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item)} />
            ))}
          </div>

          <div className="space-y-2">
            <p
              className="px-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('sidebar.sectionAccount')}
            </p>
            {accountItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item)} />
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div
          className="space-y-3 p-4"
          style={{ borderTop: '1px solid var(--color-client-border)' }}
        >
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DashboardLanguageSwitcher dropDirection="up" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex h-11 w-full items-center gap-2 rounded-xl border px-3 text-sm transition-colors hover:text-(--danger)"
            style={{
              border: '1px solid var(--color-client-border)',
              backgroundColor: 'var(--color-client-surface)',
              color: 'var(--text-muted)',
            }}
          >
            <SignOut size={16} />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        style={{
          borderColor: 'var(--color-client-border)',
          backgroundColor: 'color-mix(in srgb, var(--color-client-card) 95%, transparent)',
        }}
      >
        <div className="grid grid-cols-7 gap-0.5">
          {allMobileItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors"
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-client-accent) 12%, transparent)'
                    : 'transparent',
                  color: active ? 'var(--color-client-accent)' : 'var(--text-muted)',
                }}
              >
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
                <span className="text-[9px] leading-tight text-center truncate w-full">{item.mobileLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default function ClientSidebar() {
  return <ClientSidebarInner />
}
