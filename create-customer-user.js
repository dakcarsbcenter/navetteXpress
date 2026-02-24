const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
require('dotenv').config({ path: '.env.local' });

// Schema pour créer un utilisateur customer
const { pgTable, text, timestamp, boolean } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  password: text('password'),
  role: text('role'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at'),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function createOrFindCustomerUser() {
  try {
    console.log('👤 Recherche/création d\'un utilisateur customer pour les tests...\n');
    
    const customerEmail = 'testcustomer@navettehub.com';
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, customerEmail))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log('✅ Utilisateur customer existant trouvé:');
      console.log(`   Email: ${existingUser[0].email}`);
      console.log(`   Nom: ${existingUser[0].name}`);
      console.log(`   Rôle: ${existingUser[0].role}`);
      console.log(`   ID: ${existingUser[0].id}`);
      
      if (existingUser[0].role !== 'customer') {
        console.log('🔄 Mise à jour du rôle vers customer...');
        await db
          .update(users)
          .set({ role: 'customer' })
          .where(eq(users.id, existingUser[0].id));
        console.log('✅ Rôle mis à jour !');
      }
    } else {
      console.log('➕ Création d\'un nouvel utilisateur customer...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('customer123', 12);
      
      const newUser = await db
        .insert(users)
        .values({
          id: `customer-${Date.now()}`,
          name: 'Test Customer',
          email: customerEmail,
          password: hashedPassword,
          role: 'customer',
          isActive: true,
          createdAt: new Date()
        })
        .returning();
      
      console.log('✅ Utilisateur customer créé:');
      console.log(`   Email: ${newUser[0].email}`);
      console.log(`   Nom: ${newUser[0].name}`);
      console.log(`   Rôle: ${newUser[0].role}`);
      console.log(`   ID: ${newUser[0].id}`);
    }
    
    console.log('\n🎯 Identifiants de test:');
    console.log(`   Email: ${customerEmail}`);
    console.log(`   Mot de passe: customer123`);
    console.log('\n💡 Vous pouvez vous connecter avec ces identifiants pour tester l\'onglet véhicules !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createOrFindCustomerUser();