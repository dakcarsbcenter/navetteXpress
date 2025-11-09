import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres:iNN9kThHnnpcMJKamorJYpIXxjNJpwpALtKD2wq8czsrJH81B24PM49dXzeW2uyY@109.199.101.247:5432/navettexpress',
  ssl: false
});

async function resetPassword() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('❌ Usage: node reset-user-password.js [email] [nouveau_mot_de_passe]');
      console.log('Exemple: node reset-user-password.js admin@navettehub.com Admin123!');
      return;
    }

    console.log('\n🔍 Recherche utilisateur:', email);

    // Vérifier que l'utilisateur existe
    const checkResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = checkResult.rows[0];
    console.log('✅ Utilisateur trouvé:');
    console.log('- ID:', user.id);
    console.log('- Nom:', user.name);
    console.log('- Rôle:', user.role);

    // Hasher le nouveau mot de passe
    console.log('\n🔐 Hashage du nouveau mot de passe...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ Mot de passe hashé');

    // Mettre à jour le mot de passe
    console.log('\n💾 Mise à jour dans la base de données...');
    await client.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    console.log('✅ Mot de passe mis à jour avec succès!');
    console.log('\n🎉 Vous pouvez maintenant vous connecter avec:');
    console.log('- Email:', email);
    console.log('- Mot de passe:', newPassword);

    // Vérifier que ça fonctionne
    console.log('\n🔍 Vérification...');
    const verifyResult = await client.query(
      'SELECT password FROM users WHERE email = $1',
      [email]
    );
    
    const isValid = await bcrypt.compare(newPassword, verifyResult.rows[0].password);
    console.log('Test de connexion:', isValid ? '✅ SUCCÈS' : '❌ ÉCHEC');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword();
