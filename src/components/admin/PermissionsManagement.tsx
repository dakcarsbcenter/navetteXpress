"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { NotificationCenter } from "@/components/ui/NotificationCenter"
import { useNotification } from "@/hooks/useNotification"
import {
  ShieldCheck,
  UserGear,
  SteeringWheel,
  User,
  CalendarBlank,
  FileText,
  Users,
  Car,
  Star,
  UserCircle,
  Lock,
  LockSimple,
  CheckCircle,
  Circle,
  PencilSimple,
  Plus,
  X,
} from "@phosphor-icons/react"

type ComposedAction = "read" | "update" | "manage"

interface ResourceDef {
  key: string
  label: string
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill"; style?: React.CSSProperties }>
  actions: ComposedAction[]
}

const RESOURCES: ResourceDef[] = [
  { key: "bookings", label: "Réservations", icon: CalendarBlank, actions: ["read", "update", "manage"] },
  { key: "quotes", label: "Devis", icon: FileText, actions: ["read", "manage"] },
  { key: "users", label: "Utilisateurs", icon: Users, actions: ["read", "update", "manage"] },
  { key: "vehicles", label: "Véhicules", icon: Car, actions: ["read", "update", "manage"] },
  { key: "reviews", label: "Avis", icon: Star, actions: ["read", "manage"] },
  { key: "profile", label: "Profil", icon: UserCircle, actions: ["read", "update"] },
]

const ACTION_LABEL: Record<ComposedAction, string> = { read: "Lire", update: "Modifier", manage: "Gérer" }
const SYSTEM_ROLES = ["admin", "manager", "driver", "customer"]

const ROLE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill"; style?: React.CSSProperties }>; note: string }> = {
  admin: { label: "Administrateur", icon: ShieldCheck, note: "Accès total, verrouillé" },
  manager: { label: "Manager", icon: UserGear, note: "Configurable" },
  driver: { label: "Chauffeur", icon: SteeringWheel, note: "Configurable" },
  customer: { label: "Client", icon: User, note: "Contournement legacy" },
}

interface RoleApi {
  name: string
  displayName?: string
  userCount?: number
  permissions?: { resource: string; action: string }[]
}

function totalSlots() {
  return RESOURCES.reduce((sum, r) => sum + r.actions.length, 0)
}

function hasComposed(perms: Record<string, string[]>, resource: string, action: ComposedAction) {
  const actions = perms[resource] || []
  if (action === "manage") return ["create", "read", "update", "delete"].every((a) => actions.includes(a))
  return actions.includes(action)
}

export default function PermissionsManagement() {
  const { notifications, showSuccess, showError, removeNotification } = useNotification()
  const [roles, setRoles] = useState<RoleApi[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [permsCache, setPermsCache] = useState<Record<string, Record<string, string[]>>>({})
  const [loadingPerms, setLoadingPerms] = useState(false)
  const [savingCell, setSavingCell] = useState<string | null>(null)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleLabel, setNewRoleLabel] = useState("")
  const [creatingRole, setCreatingRole] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true)
    try {
      const res = await fetch("/api/admin/roles", { cache: "no-store" })
      const json = await res.json()
      const list: RoleApi[] = json.data || []
      setRoles(list)
      setSelectedRole((current) => {
        if (current && list.some((r) => r.name === current)) return current
        return list.find((r) => r.name === "manager")?.name ?? list[0]?.name ?? null
      })
    } catch (error) {
      console.error("Erreur lors du chargement des rôles:", error)
      showError("Impossible de charger les rôles.", "Erreur technique")
    } finally {
      setLoadingRoles(false)
    }
  }, [showError])

  useEffect(() => {
    fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedRole || selectedRole === "admin" || permsCache[selectedRole]) return
    let cancelled = false
    setLoadingPerms(true)
    fetch(`/api/admin/permissions/composed?role=${selectedRole}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        setPermsCache((prev) => ({ ...prev, [selectedRole]: json.permissions || {} }))
      })
      .catch((error) => console.error("Erreur lors du chargement des permissions:", error))
      .finally(() => { if (!cancelled) setLoadingPerms(false) })
    return () => { cancelled = true }
  }, [selectedRole, permsCache])

  const locked = selectedRole === "admin"
  const currentPerms = useMemo(
    () => (locked ? {} : (selectedRole ? permsCache[selectedRole] || {} : {})),
    [locked, selectedRole, permsCache]
  )

  const toggleAction = useCallback(async (resource: string, action: ComposedAction) => {
    if (!selectedRole || locked) return
    const enabled = !hasComposed(currentPerms, resource, action)
    const cellKey = `${resource}.${action}`
    setSavingCell(cellKey)
    try {
      const res = await fetch("/api/admin/permissions/composed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleName: selectedRole, resource, composedPermission: action, enabled }),
      })
      const json = await res.json()
      if (!res.ok) {
        showError(json.error || "Erreur lors de la mise à jour", "Échec")
        return
      }
      const refetch = await fetch(`/api/admin/permissions/composed?role=${selectedRole}`, { cache: "no-store" })
      const refetchJson = await refetch.json()
      setPermsCache((prev) => ({ ...prev, [selectedRole]: refetchJson.permissions || {} }))
      showSuccess(`Permission ${enabled ? "activée" : "désactivée"}`, "Succès")
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la permission:", error)
      showError("Erreur lors de la mise à jour de la permission", "Erreur technique")
    } finally {
      setSavingCell(null)
    }
  }, [selectedRole, locked, currentPerms, showError, showSuccess])

  const createRole = useCallback(async () => {
    if (!newRoleName.trim() || !newRoleLabel.trim()) return
    setCreatingRole(true)
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName.trim(), displayName: newRoleLabel.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        showError(json.error || "Erreur lors de la création du rôle", "Échec")
        return
      }
      showSuccess("Rôle créé avec succès", "Succès")
      setShowCreateRole(false)
      setNewRoleName("")
      setNewRoleLabel("")
      await fetchRoles()
    } catch (error) {
      console.error("Erreur lors de la création du rôle:", error)
      showError("Erreur lors de la création du rôle", "Erreur technique")
    } finally {
      setCreatingRole(false)
    }
  }, [newRoleName, newRoleLabel, showError, showSuccess, fetchRoles])

  if (loadingRoles) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
      </div>
    )
  }

  const longDate = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const customRoles = roles.filter((r) => !SYSTEM_ROLES.includes(r.name))
  const grantedCount = locked
    ? totalSlots()
    : RESOURCES.reduce((sum, r) => sum + r.actions.filter((a) => hasComposed(currentPerms, r.key, a)).length, 0)
  const selectedMeta = selectedRole ? ROLE_META[selectedRole] : undefined
  const selectedLabel = selectedMeta?.label ?? roles.find((r) => r.name === selectedRole)?.displayName ?? selectedRole ?? ""

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      <section style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#1F5245" }}>
            Rôles et accès
          </span>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Qui peut faire quoi.
          </h2>
          <p style={{ margin: 0, maxWidth: "48em", fontSize: "15px", color: "#3d3a35", lineHeight: 1.55 }}>
            Six ressources, deux à trois actions par ressource : lire, modifier, ou gérer. La gestion implique la lecture et la modification.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
            {longDate} — {time}
          </span>
          {savingCell && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#B4643A" }}>
              Enregistrement…
            </span>
          )}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "12px" }}>
        {roles.map((role) => {
          const meta = ROLE_META[role.name]
          const Icon = meta?.icon ?? UserGear
          const active = role.name === selectedRole
          const note = meta?.note ?? "Rôle personnalisé"
          return (
            <button
              key={role.name}
              type="button"
              onClick={() => setSelectedRole(role.name)}
              style={{
                backgroundColor: active ? "#12100E" : "#FFFFFF",
                border: `1px solid ${active ? "#12100E" : "#E2DACD"}`,
                borderRadius: "4px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 600, color: active ? "#F7F3EC" : "#12100E" }}>
                  {meta?.label ?? role.displayName ?? role.name}
                </span>
                <Icon size={16} weight={active ? "fill" : "regular"} style={{ color: active ? "#B4643A" : "#6E6A63" } as React.CSSProperties} />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "19px", fontWeight: 600, color: active ? "#F7F3EC" : "#12100E" }}>
                {role.userCount ?? 0}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active ? "#9a938a" : "#6E6A63",
                }}
              >
                {note}
              </span>
            </button>
          )
        })}
      </section>

      <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            padding: "18px 24px",
            borderBottom: "1px solid #E2DACD",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {selectedLabel} — {grantedCount} permissions sur {totalSlots()}
            </h3>
            <span style={{ fontSize: "12.5px", color: "#6E6A63" }}>
              {locked
                ? "Ce rôle contourne la table des permissions. Rien n'est modifiable ici."
                : "La gestion implique la lecture et la modification."}
            </span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              height: "28px",
              padding: "0 11px",
              borderRadius: "2px",
              backgroundColor: locked ? "rgba(184,73,60,.10)" : "rgba(31,82,69,.10)",
              whiteSpace: "nowrap",
            }}
          >
            {locked ? <Lock size={14} weight="fill" style={{ color: "#B8493C" }} /> : <PencilSimple size={14} style={{ color: "#1F5245" }} />}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: locked ? "#B8493C" : "#1F5245",
              }}
            >
              {locked ? "Verrouillé" : "Modifiable"}
            </span>
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr)",
            gap: "16px",
            padding: "12px 24px",
            borderBottom: "1px solid #E2DACD",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
            Ressource
          </span>
          {(["read", "update", "manage"] as ComposedAction[]).map((a) => (
            <span key={a} style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6A63" }}>
              {ACTION_LABEL[a]}
            </span>
          ))}
        </div>

        {loadingPerms ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "#E2DACD", borderTopColor: "#1F5245" }} />
          </div>
        ) : (
          RESOURCES.map((resource) => {
            const ResIcon = resource.icon
            return (
              <div
                key={resource.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(200px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr)",
                  gap: "16px",
                  alignItems: "center",
                  padding: "14px 24px",
                  borderBottom: "1px solid #F0EAE0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <ResIcon size={17} style={{ color: "#6E6A63", flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{resource.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.1em", color: "#6E6A63" }}>{resource.key}</span>
                  </div>
                </div>

                {(["read", "update", "manage"] as ComposedAction[]).map((action) => {
                  if (!resource.actions.includes(action)) {
                    return <span key={action} style={{ color: "#E2DACD", fontSize: "14px" }}>—</span>
                  }
                  const granted = locked || hasComposed(currentPerms, resource.key, action)
                  const impliedByManage = !locked && action !== "manage" && hasComposed(currentPerms, resource.key, "manage")
                  const cellLocked = locked || impliedByManage
                  const cellKey = `${resource.key}.${action}`
                  const color = granted ? (cellLocked ? "#6E6A63" : "#1F5245") : "#6E6A63"
                  const bg = granted ? (cellLocked ? "rgba(110,106,99,.10)" : "rgba(31,82,69,.08)") : "#F7F3EC"
                  const border = granted ? (cellLocked ? "#E2DACD" : "rgba(31,82,69,.35)") : "#E2DACD"
                  const label = granted ? (cellLocked ? "Incluse" : "Autorisée") : "Refusée"
                  const Icon = granted ? (cellLocked ? LockSimple : CheckCircle) : Circle

                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => toggleAction(resource.key, action)}
                      disabled={locked || savingCell === cellKey}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        height: "38px",
                        padding: "0 12px",
                        backgroundColor: bg,
                        border: `1px solid ${border}`,
                        borderRadius: "3px",
                        cursor: locked ? "not-allowed" : "pointer",
                        width: "fit-content",
                        opacity: savingCell === cellKey ? 0.6 : 1,
                      }}
                    >
                      <Icon size={15} weight="fill" style={{ color }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color }}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })
        )}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "20px", alignItems: "start" }}>
        <div style={{ backgroundColor: "#12100E", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#B4643A" }}>
            Protection du rôle admin
          </span>
          <p style={{ margin: 0, fontSize: "14px", color: "#F7F3EC", lineHeight: 1.6 }}>
            Le rôle admin n&apos;est pas configurable ici : le code court-circuite la vérification et rend l&apos;accès total avant de lire la table des permissions. Le retirer de l&apos;interface ne le retire pas du code.
          </p>
          <div style={{ backgroundColor: "#1a1815", borderRadius: "3px", padding: "14px 16px" }}>
            <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "11.5px", lineHeight: 1.7, color: "#9a938a", whiteSpace: "pre-wrap" }}>
{`if (userRole === 'admin') {
  return true
}`}
            </pre>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.1em", color: "#6E6A63", lineHeight: 1.6 }}>
            api/client/bookings/route.ts · hasBookingPermission
          </span>
        </div>

        <div style={{ backgroundColor: "#E8DCC8", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#12100E" }}>
            Deux héritages à trancher
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#3d3a35", lineHeight: 1.6 }}>
              <strong style={{ color: "#12100E" }}>Le rôle client passe par un contournement.</strong> Le même code accorde l&apos;accès aux réservations à tout{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>customer</code> sans consulter la table, avec le commentaire « comportement legacy ». Sa ligne dans cette matrice est donc décorative.
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#3d3a35", lineHeight: 1.6 }}>
              <strong style={{ color: "#12100E" }}>Quatre migrations se contredisent</strong> sur le rôle manager :{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>manager-read-update-only</code>,{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>fix-manager-permissions</code>,{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>fix-manager-permissions-complete</code>,{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>fix-manager-delete-permissions</code>. L&apos;état réel dépend de l&apos;ordre d&apos;exécution.
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E6A63" }}>
            Rôles personnalisés
          </span>
          {customRoles.length === 0 ? (
            <p style={{ margin: 0, fontSize: "14px", color: "#3d3a35", lineHeight: 1.6 }}>
              Aucun rôle personnalisé pour l&apos;instant. La table accepte des rôles créés à la main, en plus des 4 rôles système.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {customRoles.map((role) => {
                const perms = role.permissions ?? []
                const readCount = new Set(perms.filter((p) => p.action === "read").map((p) => p.resource)).size
                const manageCount = new Set(perms.filter((p) => p.action === "manage").map((p) => p.resource)).size
                const hasUsers = perms.some((p) => p.resource === "users")
                return (
                  <div key={role.name} style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBottom: "9px", borderBottom: "1px solid #F0EAE0", marginBottom: "9px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#12100E" }}>{role.displayName ?? role.name}</span>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#3d3a35" }}>Ressources en lecture</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1F5245" }}>
                        {readCount} / {RESOURCES.length}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#3d3a35" }}>Ressources en gestion</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1F5245" }}>
                        {manageCount} / {RESOURCES.length}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#3d3a35" }}>Accès utilisateurs</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: hasUsers ? "#1F5245" : "#B8493C" }}>
                        {hasUsers ? "Oui" : "Aucun accès"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {showCreateRole ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text"
                placeholder="Nom technique (ex: dispatch_nuit)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                style={{ height: "38px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E" }}
              />
              <input
                type="text"
                placeholder="Nom affiché (ex: Dispatcher nuit)"
                value={newRoleLabel}
                onChange={(e) => setNewRoleLabel(e.target.value)}
                style={{ height: "38px", padding: "0 12px", border: "1px solid #E2DACD", borderRadius: "3px", fontSize: "13px", color: "#12100E" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => { setShowCreateRole(false); setNewRoleName(""); setNewRoleLabel("") }}
                  style={{ flex: 1, height: "40px", backgroundColor: "#FFFFFF", border: "1px solid #E2DACD", borderRadius: "4px", color: "#6E6A63", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
                >
                  <X size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "-2px" }} />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={createRole}
                  disabled={creatingRole || !newRoleName.trim() || !newRoleLabel.trim()}
                  style={{ flex: 1, height: "40px", backgroundColor: "#12100E", border: "none", borderRadius: "4px", color: "#F7F3EC", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", opacity: creatingRole ? 0.6 : 1 }}
                >
                  {creatingRole ? "Création…" : "Créer"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateRole(true)}
              style={{ height: "44px", backgroundColor: "#FFFFFF", border: "1px dashed #12100E", borderRadius: "4px", color: "#12100E", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              <Plus size={15} weight="bold" style={{ display: "inline", marginRight: "8px", verticalAlign: "-2px" }} />
              Créer un rôle
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
