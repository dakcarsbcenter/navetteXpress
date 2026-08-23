"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Buildings, Receipt, Phone, EnvelopeSimple } from "@phosphor-icons/react";

interface Profile {
  isCompany?: boolean;
  companyType?: "hotel" | "entreprise" | "ong" | null;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
}

interface Booking {
  id: number;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDateTime: string;
  status: string;
  price: string | null;
}

const companyTypeLabels: Record<string, string> = {
  hotel: "Hôtel",
  entreprise: "Entreprise",
  ong: "ONG / mission",
};

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function EntrepriseDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKey(new Date()));

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const profileRes = await fetch("/api/client/profile");
        const profileData = await profileRes.json();
        if (cancelled) return;

        if (!profileData.success || !profileData.user?.isCompany) {
          router.push("/client/dashboard");
          return;
        }
        setProfile(profileData.user);

        const bookingsRes = await fetch("/api/client/bookings");
        const bookingsData = await bookingsRes.json();
        if (cancelled) return;
        if (bookingsData.success) {
          setBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'espace entreprise:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const months = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => set.add(monthKey(new Date(b.scheduledDateTime))));
    set.add(monthKey(new Date()));
    return Array.from(set).sort().reverse();
  }, [bookings]);

  const monthBookings = useMemo(
    () => bookings.filter((b) => monthKey(new Date(b.scheduledDateTime)) === selectedMonth),
    [bookings, selectedMonth]
  );

  const selectedMonthLabel = useMemo(() => {
    const [y, mo] = selectedMonth.split("-").map(Number);
    return formatMonthLabel(new Date(y, mo - 1, 1));
  }, [selectedMonth]);

  const monthTotal = monthBookings.reduce((sum, b) => sum + (b.price ? parseFloat(b.price) : 0), 0);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-[#6E6A63] font-[family-name:var(--font-ibm-plex-mono)] text-sm">Chargement de votre espace entreprise…</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-[#12100E] flex items-center justify-center shrink-0">
            <Buildings size={22} weight="regular" className="text-[#F7F3EC]" />
          </div>
          <div>
            <div className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-accent uppercase mb-1">
              {profile.companyType ? companyTypeLabels[profile.companyType] : "Compte entreprise"}
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{profile.companyName || session?.user?.name}</h1>
          </div>
        </div>
        <Link
          href="/client/dashboard"
          className="text-sm text-[#6E6A63] hover:text-[#12100E] transition-colors font-medium"
        >
          Retour à mon compte
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#6E6A63] uppercase">Relevé mensuel</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {months.map((m) => {
                const [y, mo] = m.split("-").map(Number);
                return (
                  <option key={m} value={m}>
                    {formatMonthLabel(new Date(y, mo - 1, 1))}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="bg-white border border-border rounded overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_auto] px-5 py-3 border-b-2 border-[#12100E] text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.12em] text-[#6E6A63] uppercase">
              <span>Date</span>
              <span>Mission</span>
              <span className="text-right">Montant</span>
            </div>
            {monthBookings.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#6E6A63]">Aucune course sur cette période.</div>
            ) : (
              monthBookings.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1fr_1fr_auto] px-5 py-3 border-b border-border last:border-0 text-sm items-center"
                >
                  <span className="font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63]">
                    {new Date(b.scheduledDateTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="text-foreground truncate pr-4">
                    {b.pickupAddress} → {b.dropoffAddress}
                  </span>
                  <span className="text-right font-medium text-foreground font-[family-name:var(--font-ibm-plex-mono)]">
                    {b.price ? `${parseFloat(b.price).toLocaleString("fr-FR")}` : "—"}
                  </span>
                </div>
              ))
            )}
            <div className="flex items-center justify-between px-5 py-4 bg-[#F7F3EC] border-t-2 border-[#12100E]">
              <span className="text-[11px] font-[family-name:var(--font-ibm-plex-mono)] text-[#6E6A63] uppercase">
                Total {selectedMonthLabel} · {monthBookings.length} course{monthBookings.length > 1 ? "s" : ""}
              </span>
              <span className="text-xl font-bold text-foreground tracking-tight">{monthTotal.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>

          <Link
            href="/reservation"
            className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Réserver une course
          </Link>
        </div>

        <div className="space-y-4">
          <div className="bg-[#12100E] rounded p-5 space-y-3">
            <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.16em] text-[#9a938a] uppercase block">Votre compte</span>
            <div className="h-px bg-[#2e2b27]" />
            <div className="flex flex-col gap-2 text-[12px] font-[family-name:var(--font-ibm-plex-mono)] text-[#9a938a]">
              <div className="flex justify-between"><span>TYPE</span><span className="text-white">{profile.companyType ? companyTypeLabels[profile.companyType] : "—"}</span></div>
              <div className="flex justify-between"><span>COURSES · MOIS</span><span className="text-white">{monthBookings.length}</span></div>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#6E6A63]">
              <Receipt size={16} weight="light" />
              <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] uppercase">Besoin d'un justificatif ?</span>
            </div>
            <p className="text-sm text-[#3d3a35]">Écrivez-nous pour recevoir le détail de vos missions, une facture consolidée ou faire évoluer votre convention.</p>
            <a href="mailto:entreprises@navettexpress.com" className="flex items-center gap-2 text-sm text-accent font-medium hover:text-[#12100E] transition-colors">
              <EnvelopeSimple size={16} weight="light" /> entreprises@navettexpress.com
            </a>
            <a href="tel:+221784651302" className="flex items-center gap-2 text-sm text-accent font-medium hover:text-[#12100E] transition-colors">
              <Phone size={16} weight="light" /> +221 78 465 13 02
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
