import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress',
  ssl: false
});

async function checkUserPassword() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Demander l'email de l'utilisateur
    const email = process.argv[2] || 'admin@navettehub.com';
    console.log('\n🔍 Vérification pour:', email);

    // Récupérer l'utilisateur
    const result = await client.query(
      'SELECT id, email, name, role, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = result.rows[0];
    console.log('\n📋 Informations utilisateur:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Nom:', user.name);
    console.log('- Rôle:', user.role);
    console.log('- Mot de passe (hash):', user.password ? `${user.password.substring(0, 20)}...` : '❌ NULL');

    if (!user.password) {
      console.log('\n⚠️  PROBLÈME: Aucun mot de passe défini pour cet utilisateur!');
      console.log('Vous devez définir un mot de passe pour cet utilisateur.');
      return;
    }

    // Test avec un mot de passe
    if (process.argv[3]) {
      const testPassword = process.argv[3];
      console.log('\n🔐 Test du mot de passe fourni...');
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('Résultat:', isValid ? '✅ Mot de passe VALIDE' : '❌ Mot de passe INVALIDE');
      
      if (!isValid) {
        console.log('\n💡 Suggestion: Réinitialisez le mot de passe avec:');
        console.log(`node reset-user-password.js ${email} [nouveau_mot_de_passe]`);
      }
    } else {
      console.log('\n💡 Pour tester un mot de passe, utilisez:');
      console.log(`node check-user-password.js ${email} [mot_de_passe]`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkUserPassword();
