"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ModernUsersManagement } from "@/components/shared/ModernUsersManagement"
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
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#1F5245' }} />
      </div>
    )
  }

  if (!hasUsersPermission) {
    return (
      <div className="p-6" style={{ backgroundColor: 'rgba(184,73,60,.06)', border: '1px solid rgba(184,73,60,.2)', borderRadius: '4px' }}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(184,73,60,.12)', color: '#B8493C' }}>
            <Warning size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#B8493C' }}>
              {t('accessDeniedTitle')}
            </h3>
            <p className="text-sm mt-1" style={{ color: '#6E6A63' }}>
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
      <div className="p-4 mb-6" style={{ backgroundColor: 'rgba(31,82,69,.06)', border: '1px solid rgba(31,82,69,.2)', borderRadius: '4px' }}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF', color: '#1F5245' }}>
            <Info size={20} weight="fill" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1" style={{ color: '#12100E' }}>
              {t('yourPermissions')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {userPermissions.users?.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: '#FFFFFF', color: '#1F5245', border: '1px solid rgba(31,82,69,.2)', borderRadius: '2px' }}
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

