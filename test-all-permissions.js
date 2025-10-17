const { db } = require('./src/db')
const { rolePermissionsTable } = require('./src/schema')
const { eq, and } = require('drizzle-orm')

async function testPermissions() {
  try {
    console.log('🔍 Vérification des permissions pour tous les rôles...\n')

    const roles = ['admin', 'customer', 'driver']
    const resources = ['vehicles', 'bookings', 'reviews', 'quotes', 'reports', 'profile']

    for (const role of roles) {
      console.log(`\n📋 Rôle: ${role.toUpperCase()}`)
      console.log('─'.repeat(50))

      const permissions = await db
        .select()
        .from(rolePermissionsTable)
        .where(eq(rolePermissionsTable.roleName, role))

      if (permissions.length === 0) {
        console.log('  ❌ Aucune permission définie')
      } else {
        // Grouper par ressource
        const groupedPerms = {}
        permissions.forEach(perm => {
          if (!groupedPerms[perm.resource]) {
            groupedPerms[perm.resource] = []
          }
          if (perm.allowed) {
            groupedPerms[perm.resource].push(perm.action)
          }
        })

        // Afficher les permissions
        Object.keys(groupedPerms).forEach(resource => {
          const actions = groupedPerms[resource]
          console.log(`  ✅ ${resource}: ${actions.join(', ')}`)
        })
      }
    }

    console.log('\n\n🎯 Permissions spécifiques pour le rôle CUSTOMER:')
    console.log('─'.repeat(50))

    const customerPerms = await db
      .select()
      .from(rolePermissionsTable)
      .where(and(
        eq(rolePermissionsTable.roleName, 'customer'),
        eq(rolePermissionsTable.allowed, true)
      ))

    if (customerPerms.length === 0) {
      console.log('  ⚠️  Aucune permission activée pour le rôle customer')
    } else {
      const byResource = {}
      customerPerms.forEach(perm => {
        if (!byResource[perm.resource]) {
          byResource[perm.resource] = []
        }
        byResource[perm.resource].push(perm.action)
      })

      console.log('\n  Ressources accessibles:')
      Object.entries(byResource).forEach(([resource, actions]) => {
        console.log(`    • ${resource}: ${actions.join(', ')}`)
      })
    }

    console.log('\n\n📊 Résumé des onglets qui devraient être visibles:')
    console.log('─'.repeat(50))

    const hasVehicles = customerPerms.some(p => p.resource === 'vehicles')
    const hasQuotes = customerPerms.some(p => p.resource === 'quotes')
    const hasReviews = customerPerms.some(p => p.resource === 'reviews')

    console.log(`  📊 Vue d'ensemble: ✅ (toujours visible)`)
    console.log(`  📅 Mes réservations: ✅ (toujours visible pour customer)`)
    console.log(`  📋 Mes devis: ${hasQuotes ? '✅' : '❌'} (permission quotes)`)
    console.log(`  ⭐ Évaluer trajets: ✅ (toujours visible)`)
    console.log(`  ✅ Mes avis: ${hasReviews ? '✅' : '❌'} (permission reviews)`)
    console.log(`  🚗 Véhicules: ${hasVehicles ? '✅' : '❌'} (permission vehicles)`)
    console.log(`  👤 Mon profil: ✅ (toujours visible)`)

    console.log('\n✨ Test terminé!\n')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    process.exit(0)
  }
}

testPermissions()
