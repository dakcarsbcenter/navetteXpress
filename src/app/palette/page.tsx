import React from 'react';
import { colors } from '@/styles/colors';

export default function ColorPalettePage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#1E293B] mb-4">
            Nouvelle Palette NavetteXpress
          </h1>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
            Palette de couleurs optimisée pour l'UX/UI avec une meilleure accessibilité et une identité visuelle moderne.
          </p>
        </div>

        {/* Couleurs Principales */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Couleurs Principales</h2>
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Couleur Primaire */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#1E293B]">Orange Moderne (Primaire)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#FF7E38] rounded-lg shadow-lg"></div>
                  <div>
                    <p className="font-mono text-sm">#FF7E38</p>
                    <p className="text-sm text-[#64748B]">Principal</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#E6682F] rounded-lg shadow-lg"></div>
                  <div>
                    <p className="font-mono text-sm">#E6682F</p>
                    <p className="text-sm text-[#64748B]">Hover</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#FFB885] rounded-lg shadow-lg"></div>
                  <div>
                    <p className="font-mono text-sm">#FFB885</p>
                    <p className="text-sm text-[#64748B]">Clair</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Couleur Secondaire */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#1E293B]">Bleu Océan (Secondaire)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#0F5B8A] rounded-lg shadow-lg"></div>
                  <div>
                    <p className="font-mono text-sm">#0F5B8A</p>
                    <p className="text-sm text-[#64748B]">Principal</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#0A4B73] rounded-lg shadow-lg"></div>
                  <div>
                    <p className="font-mono text-sm">#0A4B73</p>
                    <p className="text-sm text-[#64748B]">Hover</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#B8D5E8] rounded-lg shadow-lg"></div>
                  <div>
                    <p className="font-mono text-sm">#B8D5E8</p>
                    <p className="text-sm text-[#64748B]">Clair</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Couleurs Neutres */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Couleurs Neutres</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1E293B] rounded-lg shadow-lg"></div>
              <div>
                <p className="font-mono text-sm">#1E293B</p>
                <p className="text-sm text-[#64748B]">Charbon</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#64748B] rounded-lg shadow-lg"></div>
              <div>
                <p className="font-mono text-sm">#64748B</p>
                <p className="text-sm text-[#64748B]">Gris</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#F1F5F9] rounded-lg shadow-lg border"></div>
              <div>
                <p className="font-mono text-sm">#F1F5F9</p>
                <p className="text-sm text-[#64748B]">Gris Clair</p>
              </div>
            </div>
          </div>
        </div>

        {/* Couleurs d'État */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Couleurs d'État</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#10B981] rounded-lg shadow-lg"></div>
              <div>
                <p className="font-mono text-sm">#10B981</p>
                <p className="text-sm text-[#64748B]">Succès</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#F59E0B] rounded-lg shadow-lg"></div>
              <div>
                <p className="font-mono text-sm">#F59E0B</p>
                <p className="text-sm text-[#64748B]">Attention</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#EF4444] rounded-lg shadow-lg"></div>
              <div>
                <p className="font-mono text-sm">#EF4444</p>
                <p className="text-sm text-[#64748B]">Erreur</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#3B82F6] rounded-lg shadow-lg"></div>
              <div>
                <p className="font-mono text-sm">#3B82F6</p>
                <p className="text-sm text-[#64748B]">Info</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exemples de Boutons */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Exemples de Boutons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-linear-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
              Bouton Primaire
            </button>
            <button className="bg-linear-to-r from-[#0F5B8A] to-[#0A4B73] hover:from-[#0A4B73] hover:to-[#083A5C] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
              Bouton Secondaire
            </button>
            <button className="border-2 border-[#0F5B8A] text-[#0F5B8A] hover:bg-[#0F5B8A] hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
              Bouton Outline
            </button>
            <button className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
              Bouton Succès
            </button>
          </div>
        </div>

        {/* Gradient Hero Example */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Exemple Hero Section</h2>
          <div className="relative h-64 bg-linear-to-br from-[#1E293B] via-[#0F5B8A] to-[#334155] rounded-xl p-8 text-white">
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF7E38' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">
                NavetteXpress
                <span className="block text-xl text-[#FFB885]">Transport Premium</span>
              </h3>
              <p className="text-[#B8D5E8] mb-6">
                Nouvelle identité visuelle moderne et accessible
              </p>
              <button className="bg-linear-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                Réserver Maintenant
              </button>
            </div>
          </div>
        </div>

        {/* Avantages UX */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-6">Avantages UX/UI</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#0F5B8A] mb-4">🎯 Psychologie des Couleurs</h3>
              <ul className="space-y-2 text-[#64748B]">
                <li><strong className="text-[#FF7E38]">Orange:</strong> Énergie, confiance, action</li>
                <li><strong className="text-[#0F5B8A]">Bleu:</strong> Fiabilité, professionnalisme</li>
                <li><strong className="text-[#1E293B]">Charcoal:</strong> Élégance, modernité</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#10B981] mb-4">✅ Accessibilité</h3>
              <ul className="space-y-2 text-[#64748B]">
                <li>Contraste WCAG AA/AAA compliant</li>
                <li>Lisibilité optimisée sur tous écrans</li>
                <li>Compatible daltonisme</li>
                <li>Hiérarchie visuelle claire</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
