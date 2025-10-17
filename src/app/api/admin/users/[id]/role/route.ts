import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { roleId } = body
    const { id } = await params
    
    // Mapper roleId vers le nom du rôle
    let roleName: 'admin' | 'manager' | 'driver' | 'customer'
    switch (roleId) {
      case 1:
        roleName = 'admin'
        break
      case 2:
        roleName = 'manager'
        break
      case 3:
        roleName = 'driver'
        break
      case 4:
        roleName = 'customer'
        break
      default:
        return NextResponse.json(
          { error: 'ID de rôle invalide' },
          { status: 400 }
        )
    }

    await db
      .update(users)
      .set({ role: roleName })
      .where(eq(users.id, id))

    return NextResponse.json({
      success: true,
      message: 'Rôle utilisateur mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    )
  }
}