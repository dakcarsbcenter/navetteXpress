import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Page de redirection intelligente vers le tableau de bord approprié
 * selon le rôle de l'utilisateur connecté
 * 
 * Rôles supportés:
 * - admin -> /admin/dashboard
 * - driver -> /driver/dashboard  
 * - customer -> /client/dashboard
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Vérification de l'authentification
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Redirection basée sur le rôle
  const userRole = session.user.role;
  
  switch (userRole) {
    case "admin":
      redirect("/admin/dashboard");
    case "driver":
      redirect("/driver/dashboard");
    case "customer":
      redirect("/client/dashboard");
    default:
      // Rôle inconnu, rediriger vers client par défaut
      redirect("/client/dashboard");
  }

  // Cette ligne ne sera jamais atteinte à cause des redirections
  return null;
}
