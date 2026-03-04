import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';

const DesignGuidelines: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Guidelines de Design
            <span className="block text-3xl text-gradient bg-linear-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              NavetteXpress
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Principes et bonnes pratiques pour maintenir la cohérence visuelle
          </p>
        </div>

        {/* Principes de Design */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Principes de Design
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  User-First Design
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Chaque décision de design doit prioriser les besoins de l&apos;utilisateur, 
                  particulièrement pour les services de transport où la clarté et la confiance sont primordiales.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">♿</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Accessibilité First
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Assurer la conformité WCAG 2.1 AA pour tous les utilisateurs, 
                  y compris ceux en situation de handicap.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Mobile-First Strategy
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  70%+ des utilisateurs réservent des services de transport sur mobile. 
                  Le design doit être optimisé pour les appareils mobiles.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Trust & Safety
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Éléments de design qui renforcent la confiance dans le service 
                  (apparence professionnelle, tarification claire, indicateurs de sécurité).
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Cohérence Visuelle
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Maintenir une identité visuelle cohérente à travers tous les composants 
                  et pages de l&apos;application.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Performance
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Optimiser les performances pour une expérience utilisateur fluide 
                  et rapide sur tous les appareils.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Personas Utilisateurs */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Personas Utilisateurs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Voyageurs d&apos;Affaires
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Besoin d&apos;efficacité, fiabilité et service professionnel
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧳</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Touristes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Requièrent des informations claires, support multilingue et sensibilité culturelle
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Résidents Locaux
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Veulent commodité, tarifs compétitifs et patterns d&apos;interface familiers
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👴</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Utilisateurs Âgés
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Besoin de cibles tactiles plus grandes, typographie claire et flux simplifiés
              </p>
            </Card>
          </div>
        </section>

        {/* Guidelines de Couleur */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Guidelines de Couleur
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Psychologie des Couleurs
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Bleu Professionnel</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Confiance et fiabilité</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Orange Énergique</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Action et chaleur sénégalaise</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg"></div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Vert Sénégal</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Nature et croissance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Utilisation des Couleurs
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Primaires</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Utiliser le bleu pour les éléments de navigation et les informations importantes
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Accents</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Utiliser l&apos;orange pour les call-to-action et les éléments d&apos;interaction
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">États</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Utiliser le vert pour les succès, rouge pour les erreurs, jaune pour les avertissements
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Guidelines de Typographie */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Guidelines de Typographie
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Hiérarchie
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Titre Hero</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Poppins 48px, Bold</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Titre Section</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Poppins 30px, Bold</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Titre Card</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Poppins 20px, Bold</p>
                </div>
                <div>
                  <p className="text-base text-slate-700 dark:text-slate-300 mb-2">Texte de corps</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Poppins 16px, Normal</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Bonnes Pratiques
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Contraste Minimum</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">4.5:1 pour le texte normal, 3:1 pour le texte large</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Taille Mobile</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Minimum 16px pour éviter le zoom sur iOS</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Line Height</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">1.5-1.6 pour une expérience de lecture optimale</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Guidelines d'Espacement */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Guidelines d&apos;Espacement
          </h2>
          <Card className="p-6">
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Système de Grille 8px
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-blue-500 rounded"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">4px - Espacement minimal</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">8px - Espacement de base</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-blue-500 rounded"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">16px - Espacement standard</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-500 rounded"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">32px - Espacement large</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Zones Tactiles
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-orange-500 rounded-lg"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">44px minimum pour les zones tactiles</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-orange-500 rounded-xl"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">64px pour les boutons importants</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Guidelines d'Accessibilité */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Guidelines d&apos;Accessibilité
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">⌨️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Navigation Clavier
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Toute fonctionnalité doit être accessible via le clavier avec des états de focus clairs.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Lecteurs d&apos;Écran
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Utiliser des labels ARIA appropriés et du HTML sémantique pour les lecteurs d&apos;écran.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Contraste de Couleur
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Maintenir un contraste suffisant entre le texte et l&apos;arrière-plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Checklist de Design */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Checklist de Design
          </h2>
          <Card className="p-6">
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    ✅ À Faire
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Utiliser la palette de couleurs définie</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Respecter la hiérarchie typographique</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Tester sur mobile en priorité</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Vérifier l&apos;accessibilité</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    ❌ À Éviter
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Interfaces surchargées</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Coûts cachés</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Design desktop-only sur mobile</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Problèmes d&apos;accessibilité</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DesignGuidelines;


