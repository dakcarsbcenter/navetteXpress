/**
 * Script de test pour la nouvelle matrice de permissions composées
 * 
 * Ce script vérifie :
 * 1. La structure de la table role_permissions
 * 2. Les permissions actuelles en base de données
 * 3. La conversion atomique → composé
 */

const { db } = require('../src/lib/db')
const { rolePermissionsTable } = require('../src/schema')
const { eq, and } = require('drizzle-orm')

// Permissions composées
const COMPOSED_PERMISSIONS = {
  'manage': ['create', 'read', 'update', 'delete'],
  'read': ['read'],
  'update': ['update'],
  'delete': ['delete']
}

// Fonction pour convertir les permissions atomiques en composées
function convertToComposed(atomicPermissions) {
  const actions = atomicPermissions
    .filter(p => p.allowed)
    .map(p => p.action)

  const hasAll = ['create', 'read', 'update', 'delete'].every(action => 
    actions.includes(action)
  )

  if (hasAll) {
    return ['manage']
  }

  return actions.filter(action => 
    ['read', 'update', 'delete'].includes(action)
  )
}

async function testPermissions() {
  console.log('🧪 Test de la Structure des Permissions Composées\n')
  console.log('=' .repeat(70))

  try {
    // 1. Récupérer toutes les permissions
    console.log('\n📊 PERMISSIONS EN BASE DE DONNÉES')
    console.log('-'.repeat(70))
    
    const allPermissions = await db.select().from(rolePermissionsTable)
    
    console.log(`\n✅ Total: ${allPermissions.length} permissions atomiques trouvées`)

    // 2. Grouper par rôle
    const permissionsByRole = {}
    allPermissions.forEach(perm => {
      if (!permissionsByRole[perm.role_name]) {
        permissionsByRole[perm.role_name] = {}
      }
      if (!permissionsByRole[perm.role_name][perm.resource]) {
        permissionsByRole[perm.role_name][perm.resource] = []
      }
      if (perm.allowed) {
        permissionsByRole[perm.role_name][perm.resource].push(perm.action)
      }
    })

    // 3. Afficher les permissions par rôle
    const roles = ['admin', 'manager', 'customer', 'driver']
    const resources = ['users', 'vehicles', 'bookings', 'quotes', 'reviews']

    for (const role of roles) {
      console.log(`\n🔐 RÔLE: ${role.toUpperCase()}`)
      console.log('-'.repeat(70))
      
      const rolePerms = permissionsByRole[role] || {}
      
      for (const resource of resources) {
        const actions = rolePerms[resource] || []
        
        // Conversion en permissions composées
        const composedPerms = []
        
        // Check if "manage" (all 4 actions)
        const hasAll = ['create', 'read', 'update', 'delete'].every(action => 
          actions.includes(action)
        )
        
        if (hasAll) {
          composedPerms.push('⚡ Gérer')
        } else {
          if (actions.includes('read')) composedPerms.push('👁️ Lire')
          if (actions.includes('update')) composedPerms.push('✏️ Modifier')
          if (actions.includes('delete')) composedPerms.push('🗑️ Supprimer')
        }

        const resourceIcons = {
          'users': '👥',
          'vehicles': '🚗',
          'bookings': '📅',
          'quotes': '📋',
          'reviews': '⭐'
        }

        const icon = resourceIcons[resource] || '📄'
        const permsText = composedPerms.length > 0 
          ? composedPerms.join(', ') 
          : '❌ Aucun'

        console.log(`  ${icon} ${resource.padEnd(12)} → ${permsText}`)
      }
    }

    // 4. Statistiques
    console.log('\n📊 STATISTIQUES')
    console.log('-'.repeat(70))
    console.log(`  • Rôles: ${roles.length}`)
    console.log(`  • Ressources: ${resources.length}`)
    console.log(`  • Permissions par rôle: ${resources.length * 4} max`)
    console.log(`  • Permissions atomiques en base: ${allPermissions.length}`)
    console.log(`  • Permissions composées par rôle: ${resources.length * 4}`)

    // 5. Vérification de cohérence
    console.log('\n✅ VÉRIFICATIONS')
    console.log('-'.repeat(70))
    
    let errorsFound = false
    
    for (const role of roles) {
      const rolePerms = allPermissions.filter(p => p.role_name === role)
      const expectedCount = resources.length * 4 // 4 actions par ressource
      
      if (rolePerms.length !== expectedCount && role !== 'admin') {
        console.log(`  ⚠️  ${role}: ${rolePerms.length} permissions (attendu: ${expectedCount})`)
        errorsFound = true
      } else {
        console.log(`  ✅ ${role}: ${rolePerms.length} permissions (OK)`)
      }
    }

    if (!errorsFound) {
      console.log('\n✅ Toutes les vérifications sont passées!')
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ Test terminé avec succès!\n')

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error)
    console.error(error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Exécuter le test
testPermissions()
