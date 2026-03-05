// NextAuthOptions type removed - using plain object
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/db"
import { users } from "@/schema"
import { eq, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { sendAccountLockedEmail } from "./email"
import type { NextAuthOptions } from "next-auth"

// Vérifier les variables d'environnement au démarrage
const { NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL } = process.env

if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET n'est pas défini. Veuillez le configurer dans votre environnement.")
}

if (!NEXTAUTH_URL) {
  console.warn("⚠️ NEXTAUTH_URL n'est pas défini. Utilisation de la valeur par défaut.")
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials manquantes. L'authentification Google ne sera pas disponible.")
}

// Configuration des providers
const providers = [
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
      console.log("🔐 [NextAuth] Tentative d'authentification...")
      console.log("📧 Email:", credentials?.email)
      console.log("🔑 Mot de passe fourni:", credentials?.password ? "✅" : "❌")

      // Throw error instead of returning null to provide specific error message
      if (!credentials?.email || !credentials?.password) {
        console.log("❌ [NextAuth] Credentials manquantes")
        throw new Error("CredentialsMissing")
      }

      // Normalize email: lowercase + trim to avoid case-sensitivity mismatches
      const normalizedEmail = credentials.email.toLowerCase().trim()

      try {
        // 1. Recherche de l'utilisateur (cas insensible)
        // On utilise trim(lower()) pour être ultra-robuste contre les espaces invisibles ou la casse
        const userResult = await db
          .select()
          .from(users)
          .where(sql`trim(lower(${users.email})) = ${normalizedEmail}`)
          .limit(1)

        if (userResult.length === 0) {
          console.log("❌ [NextAuth] Utilisateur non trouvé après normalisation:", normalizedEmail)

          // Debug: Vérifier s'il n'y a pas d'erreur de connexion ou d'écarts mineurs (typos)
          if (process.env.NODE_ENV !== 'production') {
            try {
              // Recherche floue pour aider au debug (uniquement en logs serveur de dev/staging)
              const partialMatch = await db
                .select({ email: users.email })
                .from(users)
                .where(sql`${users.email} ILIKE ${'%' + normalizedEmail.split('@')[0] + '%'}`)
                .limit(3);

              if (partialMatch.length > 0) {
                console.log("💡 [NextAuth] Suggestions de comptes existants (uniquement en logs):",
                  partialMatch.map(m => m.email).join(', '));
              }
            } catch (e) { /* ignore */ }
          }
          throw new Error("UserNotFound")
        }

        const user = userResult[0]
        console.log("✅ [NextAuth] Utilisateur trouvé ID:", user.id)
        console.log("📧 Email en base:", user.email)
        console.log("👤 Nom:", user.name)
        console.log("🏷️ Rôle:", user.role)
        console.log("🟢 Actif:", user.isActive)

        // Vérifier si le compte est désactivé par un administrateur
        if (user.isActive === false) {
          console.log("🚫 [NextAuth] Compte désactivé:", user.email)
          throw new Error("AccountDisabled")
        }

        // Vérifier si le compte est bloqué
        if (user.accountLockedUntil) {
          const now = new Date()
          const lockedUntil = new Date(user.accountLockedUntil)

          if (now < lockedUntil) {
            const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60))
            console.log("🔒 [NextAuth] Compte bloqué jusqu'à:", lockedUntil)
            throw new Error(`AccountLocked:${minutesRemaining}`)
          } else {
            // Le blocage est expiré, réinitialiser les tentatives
            await db
              .update(users)
              .set({
                loginAttempts: 0,
                accountLockedUntil: null,
                lastFailedLogin: null,
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id))
            console.log("✅ [NextAuth] Blocage expiré, compte débloqué")
          }
        }

        // Vérifier le mot de passe
        if (!user.password) {
          console.log("❌ [NextAuth] Aucun mot de passe défini pour l'utilisateur")
          throw new Error("NoPassword")
        }

        console.log("🔐 [NextAuth] Vérification du mot de passe...")
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        console.log("🔐 [NextAuth] Résultat validation:", isPasswordValid ? "✅ Valide" : "❌ Invalide")

        if (!isPasswordValid) {
          // Incrémenter le compteur de tentatives échouées
          const currentAttempts = (user.loginAttempts || 0) + 1
          console.log(`❌ [NextAuth] Mot de passe incorrect (tentative ${currentAttempts}/3)`)

          if (currentAttempts >= 3) {
            // Bloquer le compte pour 15 minutes après 3 tentatives
            const lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            await db
              .update(users)
              .set({
                loginAttempts: currentAttempts,
                accountLockedUntil: lockedUntil,
                lastFailedLogin: new Date(),
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id))

            console.log("🔒 [NextAuth] Compte bloqué pour 15 minutes après 3 tentatives")

            // Envoyer un email de notification de blocage
            try {
              await sendAccountLockedEmail(
                user.email,
                user.name || 'Utilisateur',
                lockedUntil
              )
            } catch (emailError) {
              console.error("❌ [NextAuth] Erreur lors de l'envoi de l'email de blocage:", emailError)
              // On continue quand même, le compte est bloqué
            }

            throw new Error("AccountLockedAfter3Attempts")
          } else {
            // Mettre à jour le compteur
            await db
              .update(users)
              .set({
                loginAttempts: currentAttempts,
                lastFailedLogin: new Date(),
                updatedAt: new Date()
              })
              .where(eq(users.id, user.id))

            throw new Error(`InvalidPassword:${3 - currentAttempts}`)
          }
        }

        // Connexion réussie : réinitialiser les tentatives
        if (user.loginAttempts && user.loginAttempts > 0) {
          await db
            .update(users)
            .set({
              loginAttempts: 0,
              accountLockedUntil: null,
              lastFailedLogin: null,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id))
        }

        console.log("🎉 [NextAuth] Authentification réussie pour:", user.email)

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
]

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  providers,
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
          const googleEmail = user.email.toLowerCase().trim()
          const dbUser = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${googleEmail}`)
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
          const googleEmail = (user.email || "").toLowerCase().trim()
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${googleEmail}`)
            .limit(1)

          // Si l'utilisateur existe et a un mot de passe, refuser la connexion Google
          if (existingUser.length > 0 && existingUser[0].password) {
            console.warn("Connexion Google refusée: email déjà créé par mot de passe.", googleEmail)
            return false
          }

          if (existingUser.length === 0) {
            // Créer un nouvel utilisateur pour Google
            const newUser = {
              id: user.id!,
              name: user.name || "",
              email: googleEmail,
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
