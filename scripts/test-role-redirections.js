// Script de test pour vérifier les redirections selon les rôles
// Usage: node scripts/test-role-redirections.js

const { db } = require('../src/db.ts');
const { users } = require('../src/schema.ts');

async function testRoleRedirections() {
  try {
    console.log("🔍 Vérification des utilisateurs et de leurs rôles...\n");
    
    // Récupérer tous les utilisateurs
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log("❌ Aucun utilisateur trouvé dans la base de données");
      return;
    }
    
    console.log("👥 Utilisateurs dans la base de données :");
    console.log("================================================");
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sans nom'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏷️  Rôle: ${user.role}`);
      console.log(`   🚀 Tableau de bord: http://localhost:3000/${getRoleDashboard(user.role)}`);
      console.log("");
    });
    
    console.log("🔄 Test de redirection :");
    console.log("========================");
    console.log("1. 👑 Admin → http://localhost:3000/dashboard → http://localhost:3000/admin/dashboard");
    console.log("2. 🚗 Chauffeur → http://localhost:3000/dashboard → http://localhost:3000/driver/dashboard");  
    console.log("3. 👤 Client → http://localhost:3000/dashboard → http://localhost:3000/client/dashboard");
    console.log("");
    console.log("💡 Pour tester :");
    console.log("- Connectez-vous avec l'un des utilisateurs ci-dessus");
    console.log("- Accédez à http://localhost:3000/dashboard");
    console.log("- Vous devriez être automatiquement redirigé vers le bon tableau de bord");
    
  } catch (error) {
    console.error("❌ Erreur lors de la vérification :", error);
  }
}

function getRoleDashboard(role) {
  switch (role) {
    case 'admin':
      return 'admin/dashboard';
    case 'driver':
      return 'driver/dashboard';
    case 'customer':
      return 'client/dashboard';
    default:
      return 'client/dashboard'; // Par défaut
  }
}

// Exécuter le test
testRoleRedirections();