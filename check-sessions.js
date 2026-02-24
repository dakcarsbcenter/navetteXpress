const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

// Schema pour vérifier les sessions
const { pgTable, text, timestamp } = require('drizzle-orm/pg-core');

const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token'),
  userId: text('user_id'),
  expires: timestamp('expires'),
});

const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function checkActiveSessions() {
  try {
    console.log('🔍 Vérification des sessions actives...\n');
    
    // Récupérer toutes les sessions
    const allSessions = await db.select().from(sessions).limit(10);
    
    console.log(`📊 Nombre de sessions: ${allSessions.length}\n`);
    
    if (allSessions.length > 0) {
      allSessions.forEach((session, index) => {
        const isExpired = new Date() > new Date(session.expires);
        console.log(`${index + 1}. Session ${session.id?.substring(0, 8)}...`);
        console.log(`   � User ID: ${session.userId}`);
        console.log(`   ⏰ Expire: ${session.expires}`);
        console.log(`   📋 Statut: ${isExpired ? '❌ Expirée' : '✅ Active'}\n`);
      });
    } else {
      console.log('ℹ️  Aucune session active');
    }
    
    // Nettoyer les sessions expirées
    const now = new Date();
    console.log('🧹 Nettoyage des sessions expirées...');
    
    const deletedCount = await db
      .delete(sessions)
      .where(sessions.expires < now)
      .returning();
    
    console.log(`🗑️  ${deletedCount.length} sessions expirées supprimées`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkActiveSessions();