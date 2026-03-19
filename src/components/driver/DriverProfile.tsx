"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { LogOut, Lock, Save, ShieldCheck, UserCircle2, CarFront } from "lucide-react"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"
import { ContentCard, DriverStatusBadge, SectionHeader } from "@/components/driver/shared"

interface DriverProfileProps {
  onBack: () => void
}

interface DriverData {
  id: string
  name: string
  email: string
  phone?: string
  licenseNumber?: string
  image?: string
  isActive: boolean
}

export function DriverProfile({ onBack }: DriverProfileProps) {
  const { data: session } = useSession()
  const [driverData, setDriverData] = useState<DriverData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", licenseNumber: "" })
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", model: "", mileage: "" })

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/driver/profile")
        if (!response.ok) return

        const result = await response.json()
        if (result?.success && result?.data) {
          const profile = result.data as DriverData
          setDriverData(profile)
          setForm({
            name: profile.name ?? "",
            email: profile.email ?? "",
            phone: profile.phone ?? "",
            licenseNumber: profile.licenseNumber ?? "",
          })
        }
      } catch (error) {
        console.error("Erreur profil:", error)
      }
    }

    load()
  }, [])

  const save = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/driver/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          licenseNumber: form.licenseNumber,
        }),
      })

      if (response.ok) {
        setDriverData((current) => current ? { ...current, name: form.name, phone: form.phone, licenseNumber: form.licenseNumber } : current)
      }
    } catch (error) {
      console.error("Erreur sauvegarde profil:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-20 md:pb-4">
      <SectionHeader title="MON PROFIL" subtitle="Gérez vos informations personnelles et véhicule" />

      <ContentCard title="Identité" indicator="green" className="driver-fade-in-up">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_55%,transparent)] p-4">
            <UniversalProfilePhotoUpload
              currentImage={driverData?.image || session?.user?.image || undefined}
              onImageUpdate={(imageUrl) => setDriverData((current) => current ? { ...current, image: imageUrl || undefined } : current)}
              onSuccess={() => {}}
              onError={(error) => console.error(error)}
            />
            <p className="text-sm font-semibold text-(--text-primary)">{form.name || "Chauffeur"}</p>
            <DriverStatusBadge status={driverData?.isActive ? "Active" : "Indisponible"} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-(--text-secondary)">
              Nom complet
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
              />
            </label>
            <label className="space-y-1 text-xs text-(--text-secondary)">
              Email
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
                disabled
              />
            </label>
            <label className="space-y-1 text-xs text-(--text-secondary)">
              Téléphone
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
              />
            </label>
            <label className="space-y-1 text-xs text-(--text-secondary)">
              N° permis
              <input
                value={form.licenseNumber}
                onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
              />
            </label>
          </div>
        </div>
      </ContentCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard title="Informations du véhicule" indicator="gold" className="driver-fade-in-up">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-(--text-secondary)">
              Plaque
              <input
                value={vehicleForm.plateNumber}
                onChange={(event) => setVehicleForm((current) => ({ ...current, plateNumber: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
                placeholder="AA-123-BB"
              />
            </label>
            <label className="space-y-1 text-xs text-(--text-secondary)">
              Modèle
              <input
                value={vehicleForm.model}
                onChange={(event) => setVehicleForm((current) => ({ ...current, model: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
                placeholder="Mercedes Vito"
              />
            </label>
            <label className="space-y-1 text-xs text-(--text-secondary) sm:col-span-2">
              Kilométrage
              <input
                value={vehicleForm.mileage}
                onChange={(event) => setVehicleForm((current) => ({ ...current, mileage: event.target.value }))}
                className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
                placeholder="125000"
              />
            </label>
          </div>
        </ContentCard>

        <ContentCard title="Sécurité" indicator="green" className="driver-fade-in-up">
          <div className="space-y-2">
            <button className="flex w-full items-center justify-between rounded-lg border border-(--border) bg-[color-mix(in_srgb,var(--bg-primary)_55%,transparent)] px-3 py-2 text-sm text-(--text-primary)">
              <span className="inline-flex items-center gap-2"><Lock size={15} /> Changer le mot de passe</span>
              <ShieldCheck size={15} className="text-(--success)" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-3 py-2 text-sm text-(--danger)"
            >
              <LogOut size={15} /> Déconnexion
            </button>
          </div>
        </ContentCard>
      </div>

      <button
        onClick={save}
        disabled={isSaving}
        className="inline-flex items-center gap-2 rounded-lg bg-(--accent) px-4 py-2 text-sm font-bold text-black hover:brightness-110 disabled:opacity-70"
      >
        <Save size={15} /> {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </div>
  )
}
