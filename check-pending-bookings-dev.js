require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const neonUrl = process.env.DATABASE_URL;
const sql = neon(neonUrl);

async function checkPendingBookings() {
  try {
    console.log('🔍 Vérification des réservations en attente (DEV)\n');
    console.log('='.repeat(80));
    
    // Compter par statut
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    `;
    
    console.log('📊 Répartition par statut:\n');
    let pendingCount = 0;
    
    statusCounts.forEach(row => {
      const emoji = row.status === 'pending' ? '🔔' : 
                   row.status === 'confirmed' ? '✅' :
                   row.status === 'assigned' ? '👤' :
                   row.status === 'in_progress' ? '🚗' :
                   row.status === 'completed' ? '✨' :
                   row.status === 'cancelled' ? '❌' : '📋';
      
      console.log(`   ${emoji} ${row.status.padEnd(15)} : ${row.count}`);
      
      if (row.status === 'pending') {
        pendingCount = parseInt(row.count);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎯 Badge à afficher : ${pendingCount > 0 ? pendingCount : 'Aucun badge'}\n`);
    
    if (pendingCount > 0) {
      console.log('📋 Détails des réservations en attente:\n');
      
      const pendingBookings = await sql`
        SELECT 
          id,
          customer_name,
          pickup_address,
          dropoff_address,
          scheduled_date_time,
          price
        FROM bookings
        WHERE status = 'pending'
        ORDER BY scheduled_date_time DESC
        LIMIT 10
      `;
      
      pendingBookings.forEach((booking, i) => {
        console.log(`${i + 1}. ${booking.customer_name}`);
        console.log(`   De: ${booking.pickup_address}`);
        console.log(`   À: ${booking.dropoff_address}`);
        console.log(`   Date: ${new Date(booking.scheduled_date_time).toLocaleString('fr-FR')}`);
        console.log(`   Prix: ${booking.price} FCFA\n`);
      });
    } else {
      console.log('✨ Aucune réservation en attente - le badge ne s\'affichera pas!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkPendingBookings().then(() => {
  console.log('✅ Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
