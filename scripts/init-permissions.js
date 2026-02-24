const { db } = require('../src/db');
const { permissionsTable } = require('../src/schema');

async function initPermissions() {
  console.log('🚀 Initialisation des permissions...');

  // Permissions pour ADMIN (accès complet)
  const adminPermissions = [
    { role: 'admin', resource: 'bookings', action: 'create', allowed: true },
    { role: 'admin', resource: 'bookings', action: 'read', allowed: true },
    { role: 'admin', resource: 'bookings', action: 'update', allowed: true },
    { role: 'admin', resource: 'bookings', action: 'delete', allowed: true },
    
    { role: 'admin', resource: 'vehicles', action: 'create', allowed: true },
    { role: 'admin', resource: 'vehicles', action: 'read', allowed: true },
    { role: 'admin', resource: 'vehicles', action: 'update', allowed: true },
    { role: 'admin', resource: 'vehicles', action: 'delete', allowed: true },
    
    { role: 'admin', resource: 'users', action: 'create', allowed: true },
    { role: 'admin', resource: 'users', action: 'read', allowed: true },
    { role: 'admin', resource: 'users', action: 'update', allowed: true },
    { role: 'admin', resource: 'users', action: 'delete', allowed: true },
    
    { role: 'admin', resource: 'planning', action: 'create', allowed: true },
    { role: 'admin', resource: 'planning', action: 'read', allowed: true },
    { role: 'admin', resource: 'planning', action: 'update', allowed: true },
    { role: 'admin', resource: 'planning', action: 'delete', allowed: true },
  ];

  // Permissions pour CHAUFFEUR (accès limité)
  const chauffeurPermissions = [
    { role: 'chauffeur', resource: 'bookings', action: 'read', allowed: true }, // Peut voir ses propres réservations
    { role: 'chauffeur', resource: 'bookings', action: 'update', allowed: true }, // Peut mettre à jour le statut de ses réservations
    
    { role: 'chauffeur', resource: 'vehicles', action: 'read', allowed: true }, // Peut voir les véhicules
    
    { role: 'chauffeur', resource: 'users', action: 'read', allowed: false }, // Ne peut pas voir les autres utilisateurs
    
    { role: 'chauffeur', resource: 'planning', action: 'read', allowed: true }, // Peut voir son planning
  ];

  try {
    // Insérer les permissions admin
    for (const permission of adminPermissions) {
      await db.insert(permissionsTable).values(permission).onConflictDoNothing();
    }
    console.log('✅ Permissions admin initialisées');

    // Insérer les permissions chauffeur
    for (const permission of chauffeurPermissions) {
      await db.insert(permissionsTable).values(permission).onConflictDoNothing();
    }
    console.log('✅ Permissions chauffeur initialisées');

    console.log('🎉 Permissions initialisées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  initPermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initPermissions };
