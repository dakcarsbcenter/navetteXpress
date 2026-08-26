"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ModernUsersManagement } from "@/components/admin/ModernUsersManagement"
import { Warning, Info } from "@phosphor-icons/react"

interface UserPermissions {
  [resource: string]: string[]
}

export function ClientUsersManagement() {
  const t = useTranslations('client.users')
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserPermissions()
  }, [])

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions')
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || {})
      }
    } catch (err) {
      console.error(t('loadError'), err)
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier si l'utilisateur a au moins une permission sur les utilisateurs
  const hasUsersPermission = 
    userPermissions.users?.includes('read') ||
    userPermissions.users?.includes('create') ||
    userPermissions.users?.includes('update') ||
    userPermissions.users?.includes('delete')

  const permissionLabels: Record<string, string> = {
    manage: t('permissionManage'),
    read: t('permissionRead'),
    create: t('permissionCreate'),
    update: t('permissionUpdate'),
    delete: t('permissionDelete'),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--color-client-accent)' }} />
      </div>
    )
  }

  if (!hasUsersPermission) {
    return (
      <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
            <Warning size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#EF4444' }}>
              {t('accessDeniedTitle')}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-client-text-secondary)' }}>
              {t('accessDeniedMessage')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header avec informations sur les permissions */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--color-client-accent-bg)', border: '1px solid var(--color-client-accent-border)' }}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-client-card)', color: 'var(--color-client-accent)' }}>
            <Info size={20} weight="fill" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1" style={{ color: 'var(--color-client-text-primary)' }}>
              {t('yourPermissions')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {userPermissions.users?.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-client-card)', color: 'var(--color-client-accent)', border: '1px solid var(--color-client-accent-border)' }}
                >
                  {permissionLabels[permission] || permission}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Composant de gestion des utilisateurs */}
      <ModernUsersManagement userPermissions={userPermissions} />
    </div>
  )
}

