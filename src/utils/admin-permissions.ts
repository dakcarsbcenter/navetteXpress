import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

/**
 * Vérifie si l'utilisateur actuel a le rôle admin
 */
export async function checkAdminRole(userId?: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = userId || session?.user?.id;
    if (!currentUserId) return false;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    return user.length > 0 && user[0].role === 'admin';
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle admin:', error);
    return false;
  }
}

/**
 * Middleware pour protéger les routes admin
 */
export async function requireAdminRole(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Aucune session utilisateur trouvée');
      redirect('/auth/signin');
    }

    const isAdmin = await checkAdminRole(session.user.id);
    if (!isAdmin) {
      console.error('Utilisateur non autorisé - rôle admin requis');
      redirect('/dashboard'); // Redirection vers le dashboard normal
    }

    return session.user.id;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions admin:', error);
    redirect('/auth/signin');
  }
}

/**
 * Récupère le rôle d'un utilisateur
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 ? user[0].role : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle utilisateur:', error);
    return null;
  }
}

/**
 * Assigne un rôle à un utilisateur
 */
export async function assignUserRole(userId: string, role: 'driver' | 'admin'): Promise<void> {
  try {
    // Mettre à jour le rôle de l'utilisateur
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Erreur lors de l\'assignation du rôle:', error);
    throw error;
  }
}

