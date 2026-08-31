"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { signOut, useSession } from "next-auth/react"
import { SignOut, Lock, FloppyDisk, ShieldCheck } from "@phosphor-icons/react"
import UniversalProfilePhotoUpload from "@/components/ui/UniversalProfilePhotoUpload"
import { TONE_STYLE } from "@/components/shared/StatusBadge"

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

const cardStyle: CSSProperties = { background: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px" }
const cardHeaderStyle: CSSProperties = { padding: "18px 24px", borderBottom: "1px solid #E2DACD" }
const cardTitleStyle: CSSProperties = { margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }
const labelStyle: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }
const inputStyle: CSSProperties = { width: "100%", height: "44px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "4px", fontSize: "13.5px", color: "#12100E", background: "#FFFFFF", outline: "none" }

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

  const activeTone = driverData?.isActive ? TONE_STYLE.valide : TONE_STYLE.clos

  return (
    <div className="flex flex-col gap-7 pb-16 md:pb-0">
      <section className="flex flex-col gap-2">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
          PROFIL
        </span>
        <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
          Mon profil
        </h2>
        <p style={{ margin: 0, fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>Gérez vos informations personnelles et véhicule</p>
      </section>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={cardTitleStyle}>Identité</h3>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "20px", border: "1px solid #E2DACD", borderRadius: "4px", background: "#F7F3EC" }}>
            <UniversalProfilePhotoUpload
              currentImage={driverData?.image || session?.user?.image || undefined}
              onImageUpdate={(imageUrl) => setDriverData((current) => current ? { ...current, image: imageUrl || undefined } : current)}
              onSuccess={() => {}}
              onError={(error) => console.error(error)}
            />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{form.name || "Chauffeur"}</p>
            <span
              className="inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-[2px] px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{ backgroundColor: activeTone.bg, color: activeTone.color }}
            >
              <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: activeTone.color }} />
              {driverData?.isActive ? "Active" : "Indisponible"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span style={labelStyle}>Nom complet</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                style={inputStyle}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span style={labelStyle}>Email</span>
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                style={{ ...inputStyle, background: "#F7F3EC", color: "#6E6A63" }}
                disabled
              />
            </label>
            <label className="flex flex-col gap-2">
              <span style={labelStyle}>Téléphone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                style={inputStyle}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span style={labelStyle}>N° permis</span>
              <input
                value={form.licenseNumber}
                onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))}
                style={inputStyle}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Informations du véhicule</h3>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span style={labelStyle}>Plaque</span>
              <input
                value={vehicleForm.plateNumber}
                onChange={(event) => setVehicleForm((current) => ({ ...current, plateNumber: event.target.value }))}
                style={inputStyle}
                placeholder="AA-123-BB"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span style={labelStyle}>Modèle</span>
              <input
                value={vehicleForm.model}
                onChange={(event) => setVehicleForm((current) => ({ ...current, model: event.target.value }))}
                style={inputStyle}
                placeholder="Mercedes Vito"
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span style={labelStyle}>Kilométrage</span>
              <input
                value={vehicleForm.mileage}
                onChange={(event) => setVehicleForm((current) => ({ ...current, mileage: event.target.value }))}
                style={inputStyle}
                placeholder="125000"
              />
            </label>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Sécurité</h3>
          </div>
          <div className="flex flex-col gap-3 p-6">
            <button
              type="button"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "44px", padding: "0 14px", border: "1px solid #E2DACD", borderRadius: "4px", background: "#FFFFFF", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              <span className="inline-flex items-center gap-2"><Lock size={15} /> Changer le mot de passe</span>
              <ShieldCheck size={15} color="#1F5245" />
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{ display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 14px", border: "1px solid #B8493C", borderRadius: "4px", background: "rgba(184,73,60,.06)", color: "#B8493C", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              <SignOut size={15} /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", alignSelf: "flex-start", height: "48px", padding: "0 20px", background: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontSize: "14px", fontWeight: 600, cursor: isSaving ? "wait" : "pointer", opacity: isSaving ? 0.7 : 1 }}
      >
        <FloppyDisk size={15} /> {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </div>
  )
}
