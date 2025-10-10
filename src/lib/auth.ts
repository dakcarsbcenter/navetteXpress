// NextAuthOptions type removed - using plain object
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/db"
import { users } from "@/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

// Exige une configuration via les variables d'environnement
const { NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET n'est pas défini. Veuillez le configurer dans votre environnement.")
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials manquantes. L'authentification Google ne sera pas disponible.")
}

export const authOptions = {
  secret: NEXTAUTH_SECRET,
  providers: [
    // Google Provider (conditionnel)
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    // Credentials Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credentials manquantes")
          throw new Error("CredentialsMissing")
        }

        try {
          // Rechercher l'utilisateur dans la base de données
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (userResult.length === 0) {
            console.log("Utilisateur non trouvé:", credentials.email)
            throw new Error("UserNotFound")
          }

          const user = userResult[0]

          // Vérifier le mot de passe
          if (!user.password) {
            console.log("Aucun mot de passe défini pour l'utilisateur")
            throw new Error("NoPassword")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            console.log("Mot de passe incorrect")
            throw new Error("InvalidPassword")
          }

          console.log("Authentification réussie pour:", user.email)
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error("Erreur lors de l'authentification:", error)
          if (error instanceof Error) {
            throw error
          }
          throw new Error("ServerError")
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      
      // Pour les utilisateurs Google, récupérer les informations depuis la DB
      if (account?.provider === "google" && user?.email) {
        try {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1)
          
          if (dbUser.length > 0) {
            token.id = dbUser[0].id
            token.role = dbUser[0].role
          }
        } catch (error) {
          console.error("Erreur lors de la récupération de l'utilisateur Google:", error)
        }
      }
      
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account }: any) {
      // Si c'est une connexion Google
      if (account?.provider === "google") {
        try {
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1)

          if (existingUser.length === 0) {
            // Créer un nouvel utilisateur pour Google
            const newUser = {
              id: user.id!,
              name: user.name || "",
              email: user.email!,
              image: user.image || null,
              role: "customer" as const, // Par défaut, les utilisateurs Google sont des clients
              password: null, // Pas de mot de passe pour les utilisateurs Google
              emailVerified: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            await db.insert(users).values(newUser)
            console.log("Nouvel utilisateur Google créé:", user.email)
          } else {
            // Mettre à jour l'image si elle a changé
            if (user.image && existingUser[0].image !== user.image) {
              await db
                .update(users)
                .set({ 
                  image: user.image,
                  updatedAt: new Date()
                })
                .where(eq(users.id, existingUser[0].id))
            }
          }
        } catch (error) {
          console.error("Erreur lors de la gestion de l'utilisateur Google:", error)
          return false
        }
      }
      
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Rediriger vers la page de connexion en cas d'erreur
  },
}
