export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🚀 Exécution de la migration des rôles personnalisés...')
    
    // Étape 1: Créer la table custom_roles
    console.log('📊 Création de la table custom_roles...')
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

    // Étape 2: Créer la table role_permissions
    console.log('📊 Création de la table role_permissions...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        allowed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, resource, action)
      )
    `)

    // Étape 3: Insérer les rôles système
    console.log('👑 Insertion des rôles système...')
    await db.execute(sql`
      INSERT INTO custom_roles (name, display_name, description, color, level, is_system) VALUES
      ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', 5, true),
      ('driver', 'Chauffeur', 'Accès aux réservations et véhicules assignés', '#059669', 2, true),
      ('customer', 'Client', 'Accès aux réservations et demandes de devis', '#2563eb', 1, true)
      ON CONFLICT (name) DO NOTHING
    `)

    // Étape 4: Migrer les permissions existantes
    console.log('🔑 Migration des permissions existantes...')
    await db.execute(sql`
      INSERT INTO role_permissions (role_name, resource, action, allowed)
      SELECT role::text, resource, action, allowed 
      FROM permissions
      ON CONFLICT (role_name, resource, action) DO NOTHING
    `)

    // Vérification
    const rolesCount = await db.execute(sql`SELECT COUNT(*) as count FROM custom_roles`)
    const permissionsCount = await db.execute(sql`SELECT COUNT(*) as count FROM role_permissions`)
    
    const roles = await db.execute(sql`SELECT name, display_name, is_system FROM custom_roles ORDER BY is_system DESC`)
    
    console.log('✅ Migration terminée avec succès!')
    
    return NextResponse.json({
      success: true,
      message: 'Migration des rôles personnalisés terminée avec succès',
      data: {
        rolesCreated: parseInt(rolesCount.rows[0].count as string),
        permissionsMigrated: parseInt(permissionsCount.rows[0].count as string),
        roles: roles.rows
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur lors de la migration:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la migration des rôles personnalisés',
      message: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Utilisez POST pour exécuter la migration des rôles personnalisés'
  })
}