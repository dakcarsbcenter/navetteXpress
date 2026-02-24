export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🚀 Application de la migration des rôles personnalisés...')
    
    // Créer la table custom_roles
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS custom_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6366f1',
        level INTEGER DEFAULT 1,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Créer la table role_permissions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) REFERENCES custom_roles(name) ON DELETE CASCADE,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        allowed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, resource, action)
      )
    `)
    
    // Insérer les rôles système s'ils n'existent pas
    await db.execute(sql`
      INSERT INTO custom_roles (name, display_name, description, color, level, is_system) VALUES
      ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', 5, true),
      ('driver', 'Chauffeur', 'Accès aux réservations et véhicules assignés', '#059669', 2, true),
      ('customer', 'Client', 'Accès aux réservations et demandes de devis', '#2563eb', 1, true)
      ON CONFLICT (name) DO NOTHING
    `)
    
    // Migrer les permissions existantes
    await db.execute(sql`
      INSERT INTO role_permissions (role_name, resource, action, allowed)
      SELECT role::text, resource, action, allowed 
      FROM permissions
      ON CONFLICT (role_name, resource, action) DO NOTHING
    `)
    
    // Vérifier les résultats
    const customRolesCount = await db.execute(sql`SELECT COUNT(*) as count FROM custom_roles`)
    const rolePermissionsCount = await db.execute(sql`SELECT COUNT(*) as count FROM role_permissions`)
    
    const roles = await db.execute(sql`SELECT name, display_name, is_system FROM custom_roles ORDER BY is_system DESC, name`)
    
    return NextResponse.json({
      success: true,
      message: 'Migration des rôles personnalisés appliquée avec succès',
      stats: {
        customRoles: parseInt(customRolesCount.rows[0].count as string),
        rolePermissions: parseInt(rolePermissionsCount.rows[0].count as string),
        roles: roles.rows
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la migration:', error)
    
    // Si la table existe déjà, c'est normal
    if (error.message?.includes('already exists')) {
      return NextResponse.json({
        success: true,
        message: 'Tables déjà existantes - migration ignorée',
        warning: 'Les tables de rôles personnalisés existent déjà'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la migration des rôles',
      details: error.message
    }, { status: 500 })
  }
}
