"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Buildings, ChartBar, CalendarPlus, CalendarBlank, FileText, Receipt, User as UserIcon } from "@phosphor-icons/react";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { EntrepriseOverview } from "./components/EntrepriseOverview";
import { EntreprisePlanning } from "./components/EntreprisePlanning";
import { EntrepriseSchedule } from "./components/EntrepriseSchedule";
import { EntrepriseQuotes } from "./components/EntrepriseQuotes";
import { EntrepriseInvoices } from "./components/EntrepriseInvoices";
import { EntrepriseProfileTab } from "./components/EntrepriseProfileTab";
import type { Booking, Profile } from "./types";

type TabId = "overview" | "planning" | "schedule" | "quotes" | "invoices" | "profile";

export default function EntrepriseDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("entreprise");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const companyTypeLabels: Record<string, string> = useMemo(
    () => ({
      hotel: t("companyTypes.hotel"),
      entreprise: t("companyTypes.entreprise"),
      ong: t("companyTypes.ong"),
    }),
    [t]
  );

  const loadBookings = useCallback(async () => {
    try {
      const bookingsRes = await fetch("/api/client/bookings");
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const profileRes = await fetch("/api/client/profile");
    const profileData = await profileRes.json();
    if (!profileData.success || !profileData.user?.isCompany) {
      router.push("/client/dashboard");
      return null;
    }
    setProfile(profileData.user);
    return profileData.user;
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const user = await loadProfile();
        if (cancelled || !user) return;
        await loadBookings();
      } catch (error) {
        console.error("Erreur lors du chargement de l'espace entreprise:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router, loadProfile, loadBookings]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-[#6E6A63] font-[family-name:var(--font-ibm-plex-mono)] text-sm">{t("loading")}</div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs: { id: TabId; label: string; icon: typeof ChartBar }[] = [
    { id: "overview", label: t("tabs.overview"), icon: ChartBar },
    { id: "planning", label: t("tabs.planning"), icon: CalendarPlus },
    { id: "schedule", label: t("tabs.schedule"), icon: CalendarBlank },
    { id: "quotes", label: t("tabs.quotes"), icon: FileText },
    { id: "invoices", label: t("tabs.invoices"), icon: Receipt },
    { id: "profile", label: t("tabs.profile"), icon: UserIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-[#12100E] flex items-center justify-center shrink-0">
            <Buildings size={22} weight="regular" className="text-[#F7F3EC]" />
          </div>
          <div>
            <div className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-accent uppercase mb-1">
              {profile.companyType ? companyTypeLabels[profile.companyType] : t("defaultCompanyType")}
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{profile.companyName || session?.user?.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DashboardLanguageSwitcher />
          <Link
            href="/client/dashboard"
            className="text-sm text-[#6E6A63] hover:text-[#12100E] transition-colors font-medium"
          >
            {t("backToAccount")}
          </Link>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-8 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-[#12100E] text-[#12100E]"
                  : "border-transparent text-[#6E6A63] hover:text-[#12100E]"
              }`}
            >
              <Icon size={16} weight={active ? "fill" : "regular"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <EntrepriseOverview profile={profile} companyTypeLabels={companyTypeLabels} bookings={bookings} />
      )}
      {activeTab === "planning" && <EntreprisePlanning onPlanChanged={loadBookings} />}
      {activeTab === "schedule" && <EntrepriseSchedule bookings={bookings} />}
      {activeTab === "quotes" && <EntrepriseQuotes />}
      {activeTab === "invoices" && <EntrepriseInvoices />}
      {activeTab === "profile" && <EntrepriseProfileTab profile={profile} onUpdated={loadProfile} />}
    </div>
  );
}
