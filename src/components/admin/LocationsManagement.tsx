"use client"

import { useState, useEffect } from "react"
import { Plus, MapPin, Trash, PencilSimple } from "@phosphor-icons/react"
import { useNotification } from "@/hooks/useNotification"
import { NotificationCenter } from "@/components/ui/NotificationCenter"

interface Location {
  id: number
  name: string
  isActive: boolean
  createdAt: string
}

export function LocationsManagement() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const { notifications, showSuccess, showError, removeNotification } = useNotification()

  const [formData, setFormData] = useState({ name: "", isActive: true })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations?all=true")
      if (response.ok) {
        const result = await response.json()
        if (result?.success) setLocations(result.data ?? [])
      }
    } catch (error) {
      console.error("Erreur chargement lieux:", error)
      showError("Erreur lors du chargement des lieux", "Erreur")
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingLocation(null)
    setFormData({ name: "", isActive: true })
    setIsModalOpen(true)
  }

  const openEditModal = (location: Location) => {
    setEditingLocation(location)
    setFormData({ name: location.name, isActive: location.isActive })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : "/api/locations"
      const method = editingLocation ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        showSuccess(editingLocation ? "Lieu modifié avec succès" : "Lieu créé avec succès", "Succès")
        setIsModalOpen(false)
        fetchLocations()
      } else {
        const error = await response.json()
        showError(`Erreur: ${error.error}`, "Échec")
      }
    } catch {
      showError("Une erreur est survenue", "Erreur technique")
    }
  }

  const handleDelete = async (location: Location) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${location.name} ?`)) return
    try {
      const response = await fetch(`/api/locations/${location.id}`, { method: "DELETE" })
      if (response.ok) {
        showSuccess("Lieu supprimé avec succès", "Succès")
        fetchLocations()
      } else {
        showError("Erreur lors de la suppression", "Erreur")
      }
    } catch {
      showError("Erreur technique", "Erreur")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      <section style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#1F5245" }}>
            Corridors et adresses
          </span>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Lieux de prise en charge.
          </h2>
          <p style={{ margin: 0, maxWidth: "48em", fontSize: "15px", color: "#3d3a35", lineHeight: 1.5 }}>
            Départs et arrivées disponibles pour les clients au moment de la réservation.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2"
          style={{ height: "40px", padding: "0 18px", backgroundColor: "#1F5245", border: "none", borderRadius: "4px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Plus size={16} weight="bold" />
          Nouveau lieu
        </button>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 120px", gap: "16px", padding: "12px 24px", borderBottom: "1px solid #E2DACD" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>Nom du lieu</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>Statut</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63", textAlign: "right" }}>Actions</span>
        </div>

        {locations.map((loc) => (
          <div
            key={loc.id}
            style={{ display: "grid", gridTemplateColumns: "2fr 1fr 120px", gap: "16px", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #F0EAE0" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div style={{ display: "grid", placeItems: "center", width: "32px", height: "32px", borderRadius: "3px", backgroundColor: "rgba(31,82,69,.08)", flexShrink: 0 }}>
                <MapPin size={16} style={{ color: "#1F5245" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#12100E" }}>{loc.name}</span>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                width: "fit-content",
                height: "26px",
                padding: "0 10px",
                borderRadius: "2px",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: loc.isActive ? "rgba(31,82,69,.10)" : "rgba(110,106,99,.12)",
                color: loc.isActive ? "#1F5245" : "#6E6A63",
              }}
            >
              <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: loc.isActive ? "#1F5245" : "#6E6A63" }} />
              {loc.isActive ? "Actif" : "Inactif"}
            </span>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
              <button
                type="button"
                onClick={() => openEditModal(loc)}
                title="Modifier"
                style={{ display: "grid", placeItems: "center", width: "32px", height: "32px", border: "1px solid #E2DACD", borderRadius: "3px", color: "#6E6A63", cursor: "pointer" }}
              >
                <PencilSimple size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(loc)}
                title="Supprimer"
                style={{ display: "grid", placeItems: "center", width: "32px", height: "32px", border: "1px solid #E2DACD", borderRadius: "3px", color: "#B8493C", cursor: "pointer" }}
              >
                <Trash size={15} />
              </button>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <MapPin size={32} style={{ color: "#E2DACD", margin: "0 auto 10px" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "#6E6A63" }}>Aucun lieu défini</p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(18,16,14,.55)" }} onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "24px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 600, color: "#12100E", letterSpacing: "-0.01em" }}>
              {editingLocation ? "Modifier le lieu" : "Nouveau lieu"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1F5245", marginBottom: "8px" }}>
                  Nom du lieu
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6E6A63" }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Aéroport AIBD"
                    required
                    style={{ width: "100%", height: "42px", padding: "0 14px 0 40px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13.5px", color: "#12100E" }}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", border: "1px solid #E2DACD", borderRadius: "3px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "#1F5245" }}
                />
                <span style={{ fontSize: "13px", color: "#12100E", fontWeight: 500 }}>
                  Lieu actif <span style={{ color: "#6E6A63", fontWeight: 400 }}>(visible par les clients)</span>
                </span>
              </label>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, height: "42px", backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "3px", color: "#6E6A63", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: "42px", backgroundColor: "#1F5245", border: "none", borderRadius: "3px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  {editingLocation ? "Enregistrer" : "Créer le lieu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
