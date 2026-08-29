"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Buildings } from "@phosphor-icons/react";
import { EntrepriseOverview } from "./components/EntrepriseOverview";
import { EntreprisePlanning } from "./components/EntreprisePlanning";
import { EntrepriseSchedule } from "./components/EntrepriseSchedule";
import { EntrepriseQuotes } from "./components/EntrepriseQuotes";
import { EntrepriseInvoices } from "./components/EntrepriseInvoices";
import { EntrepriseProfileTab } from "./components/EntrepriseProfileTab";
import type { Booking, Profile } from "./types";

type TabId = "overview" | "planning" | "schedule" | "quotes" | "invoices" | "profile";

const TAB_IDS: TabId[] = ["overview", "planning", "schedule", "quotes", "invoices", "profile"];

function EntrepriseDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("entreprise");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Le shell code l'onglet actif dans ?tab= (voir EntrepriseShell) : on suit ce
  // paramètre plutôt qu'un état local isolé, sinon le contenu affiché se désynchronise
  // du titre de la barre du haut et de l'entrée active de la barre latérale.
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab");
    setActiveTab(tabFromUrl && TAB_IDS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : "overview");
  }, [searchParams]);

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[#6E6A63] font-[family-name:var(--font-ibm-plex-mono)] text-sm">{t("loading")}</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[#12100E]">
          <Buildings size={18} weight="regular" className="text-[#F7F3EC]" />
        </div>
        <div>
          <div className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-accent uppercase mb-0.5">
            {profile.companyType ? companyTypeLabels[profile.companyType] : t("defaultCompanyType")}
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{profile.companyName || session?.user?.name}</h1>
        </div>
      </div>

      {activeTab === "overview" && (
        <EntrepriseOverview profile={profile} companyTypeLabels={companyTypeLabels} bookings={bookings} />
      )}
      {activeTab === "planning" && <EntreprisePlanning onPlanChanged={loadBookings} />}
      {activeTab === "schedule" && <EntrepriseSchedule bookings={bookings} onBookingChanged={loadBookings} />}
      {activeTab === "quotes" && <EntrepriseQuotes />}
      {activeTab === "invoices" && <EntrepriseInvoices />}
      {activeTab === "profile" && <EntrepriseProfileTab profile={profile} onUpdated={loadProfile} />}
    </div>
  );
}

export default function EntrepriseDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
        </div>
      }
    >
      <EntrepriseDashboardContent />
    </Suspense>
  );
}
