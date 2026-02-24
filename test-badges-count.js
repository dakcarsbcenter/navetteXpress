require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const neonUrl = process.env.DATABASE_URL;
const sql = neon(neonUrl);

async function testBadgesCounts() {
  try {
    console.log('🎯 Test des badges pour les différents dashboards\n');
    console.log('='.repeat(80));
    
    // 1. ADMIN - Toutes les réservations en attente
    console.log('\n📊 DASHBOARD ADMIN');
    console.log('-'.repeat(80));
    
    const adminPending = await sql`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE status = 'pending'
    `;
    
    console.log(`✅ Badge "Réservations": ${adminPending[0].count} réservation(s) en attente`);
    
    // 2. CLIENT - Ses réservations en attente
    console.log('\n📊 DASHBOARD CLIENT (exemple: dak\'cars Center)');
    console.log('-'.repeat(80));
    
    const clientEmail = 'dakcarsbcenter@gmail.com';
    
    // D'abord, récupérer l'ID du client
    const clientUser = await sql`
      SELECT id FROM users WHERE email = ${clientEmail}
    `;
    
    if (clientUser.length > 0) {
      const clientId = clientUser[0].id;
      
      const clientPending = await sql`
        SELECT COUNT(*) as count
        FROM bookings
        WHERE user_id = ${clientId}
        AND status = 'pending'
      `;
      
      console.log(`Client: ${clientEmail}`);
      console.log(`✅ Badge "Mes réservations": ${clientPending[0].count} réservation(s) en attente`);
      
      // Toutes les réservations du client
      const clientTotal = await sql`
        SELECT status, COUNT(*) as count
        FROM bookings
        WHERE user_id = ${clientId}
        GROUP BY status
        ORDER BY count DESC
      `;
      
      console.log('\n📋 Répartition des réservations du client:');
      clientTotal.forEach(row => {
        console.log(`   ${row.status.padEnd(15)}: ${row.count}`);
      });
    } else {
      console.log(`❌ Client ${clientEmail} non trouvé`);
    }
    
    // 3. CHAUFFEUR - Ses réservations en attente
    console.log('\n📊 DASHBOARD CHAUFFEUR (exemple: Alain Petit)');
    console.log('-'.repeat(80));
    
    const driverEmail = 'alain.petit@taxi-service.com';
    
    // Récupérer l'ID du chauffeur
    const driverUser = await sql`
      SELECT id FROM users WHERE email = ${driverEmail}
    `;
    
    if (driverUser.length > 0) {
      const driverId = driverUser[0].id;
      
      const driverPending = await sql`
        SELECT COUNT(*) as count
        FROM bookings
        WHERE driver_id = ${driverId}
        AND status = 'pending'
      `;
      
      console.log(`Chauffeur: ${driverEmail}`);
      console.log(`✅ Badge "Dashboard": ${driverPending[0].count} réservation(s) en attente`);
      
      // Toutes les réservations du chauffeur
      const driverTotal = await sql`
        SELECT status, COUNT(*) as count
        FROM bookings
        WHERE driver_id = ${driverId}
        GROUP BY status
        ORDER BY count DESC
      `;
      
      console.log('\n📋 Répartition des réservations du chauffeur:');
      driverTotal.forEach(row => {
        console.log(`   ${row.status.padEnd(15)}: ${row.count}`);
      });
    } else {
      console.log(`❌ Chauffeur ${driverEmail} non trouvé`);
    }
    
    // 4. Résumé global
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 RÉSUMÉ DES BADGES');
    console.log('='.repeat(80));
    
    const globalStats = await sql`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    `;
    
    console.log('\n📊 Répartition globale:');
    globalStats.forEach(row => {
      const emoji = row.status === 'pending' ? '🔔' : 
                   row.status === 'confirmed' ? '✅' :
                   row.status === 'assigned' ? '👤' :
                   row.status === 'in_progress' ? '🚗' :
                   row.status === 'completed' ? '✨' :
                   row.status === 'cancelled' ? '❌' : '📋';
      
      console.log(`   ${emoji} ${row.status.padEnd(15)}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

testBadgesCounts().then(() => {
  console.log('\n✅ Test terminé\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
