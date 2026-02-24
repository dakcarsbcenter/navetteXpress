import { db } from '@/db';
import { users } from '@/schema';
import { eq } from 'drizzle-orm';

/**
 * Utilitaire pour assigner le rôle admin au premier utilisateur
 * Utilisez cet utilitaire via la console de votre navigateur ou un script Node.js
 */

export async function initFirstAdmin(userId: string) {
  try {
    console.log('🔄 Assignation du rôle admin...');
    
    // Vérifier si l'utilisateur existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return false;
    }

    const user = existingUser[0];
    
    if (user.role === 'admin') {
      console.log('✅ L\'utilisateur est déjà admin');
    } else {
      // Mettre à jour vers admin
      await db
        .update(users)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(users.id, userId));
      
      console.log('✅ Rôle admin assigné avec succès');
    }
    
    console.log('🎉 Vous pouvez maintenant accéder à /admin');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation du rôle admin:', error);
    throw error;
  }
}

/**
 * Fonction d'aide pour récupérer l'ID utilisateur actuel côté client
 */
export function getCurrentUserId() {
  // Cette fonction doit être utilisée côté client avec useSession()
  console.log('📋 Pour obtenir votre ID utilisateur:');
  console.log('1. Ouvrez les DevTools (F12)');
  console.log('2. Allez dans l\'onglet Application > Local Storage');
  console.log('3. Cherchez les clés NextAuth et copiez votre user ID');
  console.log('4. Ou utilisez: console.log(useSession().data?.user?.id) dans un composant React');
}

// Exemple d'utilisation en développement :
// initFirstAdmin('uuid-utilisateur');

