const { Client } = require('pg');

const prodConfig = {
  host: '109.199.101.247',
  port: 5432,
  database: 'navettexpress',
  user: 'postgres',
  password: 'iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY',
  ssl: false
};

async function checkPendingBookings() {
  const client = new Client(prodConfig);
  
  try {
    console.log('🔍 Vérification des réservations en attente\n');
    console.log('='.repeat(80));
    
    await client.connect();
    console.log('✅ Connecté à la base PROD\n');
    
    // Compter par statut
    const statusCounts = await client.query(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 Répartition par statut:\n');
    let pendingCount = 0;
    
    statusCounts.rows.forEach(row => {
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
    console.log(`\n🎯 Nombre de réservations "En attente" : ${pendingCount}\n`);
    
    if (pendingCount > 0) {
      console.log('📋 Détails des réservations en attente:\n');
      
      const pendingBookings = await client.query(`
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
      `);
      
      pendingBookings.rows.forEach((booking, i) => {
        console.log(`${i + 1}. ${booking.customer_name}`);
        console.log(`   De: ${booking.pickup_address}`);
        console.log(`   À: ${booking.dropoff_address}`);
        console.log(`   Date: ${booking.scheduled_date_time}`);
        console.log(`   Prix: ${booking.price} FCFA\n`);
      });
    } else {
      console.log('✨ Aucune réservation en attente!\n');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    await client.end();
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
