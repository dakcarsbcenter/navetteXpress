import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Permissions {
  [resource: string]: string[]
}

interface UsePermissionsReturn {
  permissions: Permissions
  loading: boolean
  hasPermission: (resource: string, action: string) => boolean
  canManage: (resource: string) => boolean
  canRead: (resource: string) => boolean
  canCreate: (resource: string) => boolean
  canUpdate: (resource: string) => boolean
  canDelete: (resource: string) => boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<Permissions>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      setPermissions({})
      setLoading(false)
      return
    }

    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/auth/permissions')
        if (response.ok) {
          const data = await response.json()
          setPermissions(data.permissions || {})
        } else {
          setPermissions({})
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des permissions:', error)
        setPermissions({})
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [session, status])

  const hasPermission = (resource: string, action: string): boolean => {
    const resourcePermissions = permissions[resource]
    return resourcePermissions ? resourcePermissions.includes(action) : false
  }

  const canManage = (resource: string): boolean => {
    return hasPermission(resource, 'manage')
  }

  const canRead = (resource: string): boolean => {
    return hasPermission(resource, 'read')
  }

  const canCreate = (resource: string): boolean => {
    return hasPermission(resource, 'create') || canManage(resource)
  }

  const canUpdate = (resource: string): boolean => {
    return hasPermission(resource, 'update') || canManage(resource)
  }

  const canDelete = (resource: string): boolean => {
    return hasPermission(resource, 'delete') || canManage(resource)
  }

  return {
    permissions,
    loading,
    hasPermission,
    canManage,
    canRead,
    canCreate,
    canUpdate,
    canDelete
  }
}