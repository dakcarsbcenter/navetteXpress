export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/db"
import { users, rolePermissionsTable } from "@/schema"
import { eq, inArray, and } from "drizzle-orm"

async function hasUsersPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
    try {
        if (userRole === 'admin') return true
        const permissions = await db
            .select()
            .from(rolePermissionsTable)
            .where(and(
                eq(rolePermissionsTable.roleName, userRole),
                eq(rolePermissionsTable.resource, 'users'),
                eq(rolePermissionsTable.action, action),
                eq(rolePermissionsTable.allowed, true)
            ))
        return permissions.length > 0
    } catch (error) {
        console.error('Erreur permissions:', error)
        return false
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as { user?: { role?: string, email?: string } } | null
        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const userRole = session.user.role
        if (!userRole) {
            return NextResponse.json({ error: "Rôle utilisateur non défini" }, { status: 403 })
        }

        const hasPermission = await hasUsersPermission(userRole, 'delete')
        if (!hasPermission) {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
        }

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Aucun identifiant fourni pour la suppression" }, { status: 400 })
        }

        // Un admin ne peut pas se supprimer lui-même (mesure de sécurité basique)
        // On pourrait récupérer l'ID de l'user connecté depuis la session si on l'avait, mais on a l'email.
        const currentUserReq = await db.select({ id: users.id }).from(users).where(eq(users.email, session.user.email || ''))
        const currentUserId = currentUserReq[0]?.id

        if (currentUserId && ids.includes(currentUserId)) {
            return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 })
        }

        const deletedUsers = await db
            .delete(users)
            .where(inArray(users.id, ids))
            .returning({ id: users.id })

        return NextResponse.json({
            success: true,
            message: `${deletedUsers.length} utilisateur(s) supprimé(s) avec succès`,
            deletedIds: deletedUsers.map(u => u.id)
        })
    } catch (error) {
        console.error("Erreur bulk delete users:", error)
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
    }
}
