"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setPasswordStrength(score);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') calculatePasswordStrength(value);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsLoading(false)
      return
    }

    try {
      // D'abord créer le compte utilisateur
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        if (registerData.details) {
          const firstError = Object.values(registerData.details)[0] as string[];
          setError(Array.isArray(firstError) ? firstError[0] : registerData.error)
        } else {
          setError(registerData.error || "Erreur lors de la création du compte")
        }
        return
      }

      // Connexion automatique après inscription réussie
      const result = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push("/dashboard")
      } else {
        setError("Compte créé avec succès. Veuillez vous connecter.")
        setTimeout(() => router.push("/auth/signin"), 2000)
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      setError("Une erreur inattendue s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    try {
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: false
      })

      if (result?.error) {
        setError("Erreur lors de la connexion avec Google.")
      } else if (result?.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erreur Google SignIn:", error)
      setError("Erreur lors de la connexion avec Google.")
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    "Réservations prioritaires AIBD",
    "Suivi de chauffeur en temps réel",
    "Gestion simplifiée des factures",
    "Support premium dédié 24h/7"
  ]

  return (
    <div className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-midnight)', fontFamily: 'var(--font-body)' }}>

      {/* ── PANNEAU GAUCHE DÉCORATIF (hidden mobile) ── */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col"
        style={{ backgroundColor: '#08080E' }}>

        {/* Orbes flottantes */}
        <div className="orb-float absolute w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            top: '-10%', left: '-15%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
        <div className="orb-float-delay absolute w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            bottom: '5%', right: '-20%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }} />

        {/* Motif géométrique discret */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #C9A84C 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

        {/* Contenu panneau gauche */}
        <div className="relative z-10 flex flex-col h-full px-10 py-12">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-auto transition-opacity hover:opacity-80">
            <div className="w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">NX</span>
            </div>
            <div>
              <p className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}>
                Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Dakar · Service Premium 24h/24
              </p>
            </div>
          </Link>

          {/* Slogan central */}
          <div className="my-auto">
            <p className="text-4xl leading-tight mb-8"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 300,
              }}>
              Rejoignez l'élite des{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>
                voyageurs exigeants
              </span>{' '}
              à Dakar.
            </p>

            {/* Liste d'avantages */}
            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} style={{ color: 'var(--color-gold)' }} />
                  <p className="text-sm font-light" style={{ color: 'var(--color-text-secondary)' }}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pied de page panneau gauche */}
          <div className="mt-auto pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--color-text-muted)' }}>Installé avec succès à Dakar</p>
            <div className="flex gap-8 items-center opacity-40 grayscale">
              <div className="text-sm font-bold text-white tracking-widest">AIBD</div>
              <div className="text-sm font-bold text-white tracking-widest">STRIPE</div>
              <div className="text-sm font-bold text-white tracking-widest">NIER</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PANNEAU DROIT : FORMULAIRE ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative overflow-y-auto">
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

        <div className="auth-enter w-full max-w-[480px] mx-auto py-8">
          {/* Logo mobile */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden text-center justify-center transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NX</span>
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Navette <span style={{ color: 'var(--color-gold)' }}>Xpress</span>
            </p>
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
                fontWeight: 400,
              }}>
              Créer votre{' '}
              <span style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>accès premium</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              L'excellence commence par votre compte personnel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}>
                <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.12em] uppercase"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Prénom
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <User size={16} />
                  </div>
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Jean"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.12em] uppercase"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  Nom
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <User size={16} />
                  </div>
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Dupont"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-text-secondary)' }}>
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="jean.dupont@exemple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-text-secondary)' }}>
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Phone size={16} />
                </div>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="+221 77 000 00 00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-text-secondary)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {formData.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full bg-white/5 transition-all">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: i <= passwordStrength ? '100%' : '0%',
                          backgroundColor: passwordStrength <= 2 ? 'var(--color-error)' : passwordStrength === 3 ? 'var(--color-warning)' : 'var(--color-success)'
                        }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-text-secondary)' }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full py-4 rounded-xl text-base font-semibold transition-all duration-200 mt-4"
              style={{ opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Création en cours...
                </span>
              ) : (
                'Créer mon compte →'
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>ou</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          </div>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 mb-8"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-primary)',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            S'inscrire avec Google
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Déjà un compte ?{' '}
            <Link href="/auth/signin"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-gold)' }}>
              Se connecter
            </Link>
          </p>

          <p className="text-center mt-6">
            <Link href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}>
              <ArrowLeft size={12} />
              Retour au site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
