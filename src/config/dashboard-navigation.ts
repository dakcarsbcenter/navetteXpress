import {
  SquaresFour,
  CalendarBlank,
  Clock,
  Wrench,
  ChartBar,
  User,
  FileText,
  Receipt,
  PencilSimple,
  Star,
  CalendarPlus,
  Users,
  SteeringWheel,
  Car,
  ListChecks,
  MapPin,
  LockKey,
  ChartLine,
  Buildings,
  ChatCircle,
  Headset,
  Tag,
} from "@phosphor-icons/react"

type PhosphorIcon = React.ComponentType<{
  size?: number
  className?: string
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
}>

export interface DashboardNavItemConfig {
  href: string
  labelKey: string
  icon: PhosphorIcon
}

export interface DashboardNavGroupConfig {
  labelKey: string
  items: DashboardNavItemConfig[]
}

// Structure de navigation par rôle pour <DashboardShell>. Les `labelKey`
// pointent vers messages/{locale}/dashboard-{role}.json ; chaque layout les
// résout via useTranslations au moment de construire les `groups` passés au
// shell (voir driver/shared/index.ts pour le même pattern labelKey -> t()).

export const driverNavigation: DashboardNavGroupConfig[] = [
  {
    labelKey: "sidebar.sectionMain",
    items: [
      { href: "/driver/dashboard", labelKey: "sidebar.nav.dashboard", icon: SquaresFour },
      { href: "/driver/planning", labelKey: "sidebar.nav.planning", icon: CalendarBlank },
    ],
  },
  {
    labelKey: "sidebar.sectionManagement",
    items: [
      { href: "/driver/disponibilites", labelKey: "sidebar.nav.availability", icon: Clock },
      { href: "/driver/rapport", labelKey: "sidebar.nav.report", icon: Wrench },
      { href: "/driver/messages", labelKey: "sidebar.nav.messages", icon: ChatCircle },
      { href: "/driver/statistiques", labelKey: "sidebar.nav.statistics", icon: ChartBar },
      { href: "/driver/profil", labelKey: "sidebar.nav.profile", icon: User },
    ],
  },
]

export const clientNavigation: DashboardNavGroupConfig[] = [
  {
    labelKey: "sidebar.sectionPrincipal",
    items: [
      { href: "/client/dashboard", labelKey: "sidebar.nav.overview", icon: SquaresFour },
      { href: "/client/dashboard?tab=bookings", labelKey: "sidebar.nav.bookings", icon: CalendarBlank },
      { href: "/client/dashboard?tab=messages", labelKey: "sidebar.nav.messages", icon: ChatCircle },
    ],
  },
  {
    labelKey: "sidebar.sectionServices",
    items: [
      { href: "/client/dashboard?tab=quotes", labelKey: "sidebar.nav.quotes", icon: FileText },
      { href: "/client/dashboard?tab=invoices", labelKey: "sidebar.nav.invoices", icon: Receipt },
    ],
  },
  {
    labelKey: "sidebar.sectionAccount",
    items: [
      { href: "/client/dashboard?tab=create-reviews", labelKey: "sidebar.nav.createReviews", icon: PencilSimple },
      { href: "/client/dashboard?tab=reviews", labelKey: "sidebar.nav.reviews", icon: Star },
      { href: "/client/dashboard?tab=profile", labelKey: "sidebar.nav.profile", icon: User },
    ],
  },
]

// Provisoire : reprend les 6 onglets actuels de src/app/entreprise/dashboard/page.tsx.
// Le README (icônes ChartBar/CalendarPlus/CalendarBlank/FileText/Receipt/Users/User)
// ajoute une entrée "Users" (collaborateurs) qui n'est aujourd'hui qu'un widget de la
// vue d'ensemble, pas une route. À trancher pendant la session de migration entreprise.
// Les labelKey ci-dessous ne sont pas encore présentes dans
// messages/*/dashboard-entreprise.json — à ajouter avec les vrais libellés
// pendant cette même session.
export const entrepriseNavigation: DashboardNavGroupConfig[] = [
  {
    labelKey: "sidebar.section",
    items: [
      { href: "/entreprise/dashboard?tab=overview", labelKey: "sidebar.nav.overview", icon: ChartBar },
      { href: "/entreprise/dashboard?tab=planning", labelKey: "sidebar.nav.planning", icon: CalendarPlus },
      { href: "/entreprise/dashboard?tab=schedule", labelKey: "sidebar.nav.schedule", icon: CalendarBlank },
      { href: "/entreprise/dashboard?tab=quotes", labelKey: "sidebar.nav.quotes", icon: FileText },
      { href: "/entreprise/dashboard?tab=invoices", labelKey: "sidebar.nav.invoices", icon: Receipt },
      { href: "/entreprise/dashboard?tab=profile", labelKey: "sidebar.nav.profile", icon: User },
    ],
  },
]

// Miroir exact des 12 entrées / 3 groupes de docs/redesign/Dashboard Admin.dc.html
// (lignes 392-410) : Exploitation (vue d'ensemble, réservations, devis, chauffeurs),
// Référentiel (véhicules, services, lieux), Administration (utilisateurs,
// permissions, factures, avis, statistiques). Chaque route est un onglet de
// src/app/admin/dashboard/page.tsx piloté par ?tab=.
export const adminNavigation: DashboardNavGroupConfig[] = [
  {
    labelKey: "sidebar.sectionExploitation",
    items: [
      { href: "/admin/dashboard?tab=overview", labelKey: "sidebar.nav.overview", icon: SquaresFour },
      { href: "/admin/dashboard?tab=bookings", labelKey: "sidebar.nav.bookings", icon: CalendarBlank },
      { href: "/admin/dashboard?tab=quotes", labelKey: "sidebar.nav.quotes", icon: FileText },
      { href: "/admin/dashboard?tab=drivers", labelKey: "sidebar.nav.drivers", icon: SteeringWheel },
      { href: "/admin/dashboard?tab=support", labelKey: "sidebar.nav.support", icon: Headset },
    ],
  },
  {
    labelKey: "sidebar.sectionReferentiel",
    items: [
      { href: "/admin/dashboard?tab=vehicles", labelKey: "sidebar.nav.vehicles", icon: Car },
      { href: "/admin/dashboard?tab=services", labelKey: "sidebar.nav.services", icon: ListChecks },
      { href: "/admin/dashboard?tab=locations", labelKey: "sidebar.nav.locations", icon: MapPin },
      { href: "/admin/dashboard?tab=pricing", labelKey: "sidebar.nav.pricing", icon: Tag },
    ],
  },
  {
    labelKey: "sidebar.sectionAdministration",
    items: [
      { href: "/admin/dashboard?tab=users", labelKey: "sidebar.nav.users", icon: Users },
      { href: "/admin/dashboard?tab=company-requests", labelKey: "sidebar.nav.companyRequests", icon: Buildings },
      { href: "/admin/dashboard?tab=permissions", labelKey: "sidebar.nav.permissions", icon: LockKey },
      { href: "/admin/dashboard?tab=invoices", labelKey: "sidebar.nav.invoices", icon: Receipt },
      { href: "/admin/dashboard?tab=reviews", labelKey: "sidebar.nav.reviews", icon: Star },
      { href: "/admin/dashboard?tab=stats", labelKey: "sidebar.nav.stats", icon: ChartLine },
    ],
  },
]
