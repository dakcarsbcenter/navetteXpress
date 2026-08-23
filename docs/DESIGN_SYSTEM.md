# 🎨 Design System NavetteXpress

## Vue d'ensemble

Ce document présente le système de design complet pour **NavetteXpress**, un service premium de transport de luxe au Sénégal. Le design system a été créé pour assurer une cohérence visuelle et une expérience utilisateur optimale à travers toute l'application.

## 🎯 Identité de Marque

### Mission
NavetteXpress offre des services de transport de luxe professionnels, fiables et accessibles au Sénégal, avec un focus sur l'excellence du service client et la satisfaction des utilisateurs.

### Valeurs
- **Professionnalisme** : Service de haute qualité avec chauffeurs certifiés
- **Fiabilité** : Ponctualité et sécurité garanties
- **Luxe** : Véhicules haut de gamme et confort optimal
- **Accessibilité** : Service disponible 24h/24, 7j/7
- **Innovation** : Réservation instantanée et suivi en temps réel

## 🎨 Palette de Couleurs — Corridor

> Direction validée en remplacement de la précédente palette bleu atlantique (`#123B4D`), elle-même venue remplacer un rouge pourpre (`#9B1B30`). Le bordeaux d'origine est définitivement retiré. Objectif : un système éditorial, chaleureux et tenable sur de longues pages — deux fonds seulement (craie et encre), un vert lagune qui porte l'action, une terre brûlée en accent ponctuel.

#### Lagune (accent principal)
```css
--color-accent: #1F5245;        /* Lagune — boutons primaires, nav active */
--color-accent-hover: #19433B;
--color-accent-light: #3D7A67;
```
**Usage** : Navigation active, boutons primaires, liens, focus rings — sur les 3 dashboards et le site public. Le chauffeur garde une nuance distincte dans la famille Terre (`#B4643A` clair / `#D68F63` sombre) pour se différencier visuellement sans rompre la cohérence — la Terre est aussi la couleur des jalons "arrivée" du motif corridor, un rappel cohérent du thème route/chauffeur.

#### Terre brûlée (accent ponctuel)
```css
--gold: #B4643A;
--gold-light: #C98761;
```
**Usage** : Accent chaud utilisé avec parcimonie — une ou deux occurrences par page (bornes d'arrivée, chiffres clés, badges). Ne pas l'utiliser pour les boutons d'action principaux (ceux-ci utilisent la Lagune).

#### Couleurs sémantiques (préservées)
```css
--color-success: #22C55E;
--color-warning: #F39C12;
--color-error: #B8493C;         /* Brique — déjà proche de la Terre, cohérent avec la palette */
```

### Couleurs Neutres — Encre / Craie
```css
--encre: #12100E;        /* Texte principal, fond sombre (blocs entreprise, footer) */
--texte-secondaire: #3d3a35;  /* Paragraphes */
--texte-muet: #6E6A63;   /* Libellés mono, légendes */
--bordure: #E2DACD;      /* Filets, séparateurs */
--sable: #E8DCC8;        /* Blocs d'emphase, panneaux */
--craie: #F7F3EC;        /* Fond principal — le seul fond clair du système */
```

Deux fonds seulement dans tout le produit : **craie** (`#F7F3EC`) pour les surfaces claires, **encre** (`#12100E`) pour les blocs de contraste (bandeaux entreprise, footer, cartes de résumé sombre dans le tunnel de réservation).

### Couleurs d'État
```css
--success: #10b981;      /* Succès */
--error: #ef4444;        /* Erreur */
--warning: #f59e0b;      /* Avertissement */
--info: #3b82f6;         /* Information */
```

## 📝 Typographie

### Familles de Polices (next/font/google, voir `src/app/layout.tsx`)
- **Archivo** (`--font-archivo`) : titres (700, interlettrage -3,5 %), sous-titres et boutons (600), texte courant (400) — une seule famille pour toute la hiérarchie, pas de serif.
- **Mono / data** (`--font-ibm-plex-mono`) : IBM Plex Mono — kilométrages, horaires, références, libellés de champs. Toujours en capitales, interlettrage +14 % pour les libellés.

### Hiérarchie Typographique

| Élément | Taille | Poids | Usage |
|---------|--------|-------|-------|
| Hero Title | 48px (3rem) | 800 | Titres principaux des sections hero |
| Section Title | 30px (1.875rem) | 700 | Titres de sections importantes |
| Card Title | 24px (1.5rem) | 700 | Titres de cartes et composants |
| Subtitle | 20px (1.25rem) | 600 | Sous-titres |
| Body Large | 18px (1.125rem) | 400 | Texte important |
| Body | 16px (1rem) | 400 | Texte de base |
| Small | 14px (0.875rem) | 400 | Texte secondaire |
| XS | 12px (0.75rem) | 400 | Labels, badges |

### Guidelines Typographiques
- **Contraste minimum** : 4.5:1 pour le texte normal, 3:1 pour le texte large
- **Taille mobile** : Minimum 16px pour éviter le zoom sur iOS
- **Line height** : 1.5-1.6 pour une expérience de lecture optimale
- **Espacement** : Utiliser le système de grille 8px

## 📐 Espacement et Grille

### Système de Grille 8px
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Zones Tactiles
- **Minimum** : 44px x 44px pour toutes les zones tactiles
- **Recommandé** : 48px x 48px pour les boutons importants
- **Mobile** : 56px x 56px pour les boutons principaux

## 🧩 Composants UI

### Icônes
- **Librairie unique** : `@phosphor-icons/react` — utilisée dans les 3 dashboards (admin, client, chauffeur)
- `lucide-react` a été retiré du projet ; ne pas le réintroduire, même pour un composant ponctuel

### Boutons

#### Variantes (`src/components/ui/Button.tsx`)
- **Primary** : Lagune plein (`#1F5245` → hover `#19433B`) — action principale. Plat, pas d'ombre, `border-radius: 4px`.
- **Secondary** : Terre plein (`#B4643A` → hover `#96502D`)
- **Luxury** : Encre plein (`#12100E`), texte craie, en majuscules — CTA de contraste (bandeaux sombres)
- **Outline** : Bordure encre 1px, fond transparent
- **Ghost** : Lien texte souligné (filet 2px), pas de fond ni de padding visuel

#### Tailles
- **SM** : 32px de hauteur
- **MD** : 40px de hauteur
- **LG** : 48px de hauteur
- **XL** : 56px de hauteur

### Le trait du corridor

Motif récurrent introduit par la refonte Corridor : une ligne horizontale (filet 1.5-2px, encre) reliant des jalons circulaires, qui matérialise un trajet ou une progression.

- **Bandeau de zones** (sous l'en-tête, pages publiques) : jalons Dakar (lagune) — AIBD — Mbour — Petite Côte (terre), reliés par le filet, avec les distances en mono entre les jalons intermédiaires.
- **Fil de progression** (tunnel de réservation) : les 3 étapes (Trajet / Besoins / Contact) sont les 3 jalons ; jalon actif et jalons passés en lagune, jalon à venir en gris clair (`#c9c3b8`) avec anneau vide.
- **Jalons départ/arrivée** (formulaires et récapitulatifs de course) : cercle 11-13px, filet 2px — départ en lagune, arrivée en terre, étapes intermédiaires en encre.

Ne pas réinventer ce motif ailleurs sous une autre forme (barre de progression classique, stepper Material, etc.) — c'est l'élément signature du système.

### Cards

#### Variantes
- **Default** : Card standard
- **Service** : Card de service avec hover effects
- **Vehicle** : Card de véhicule avec image
- **Testimonial** : Card de témoignage
- **Pricing** : Card de tarification

### Badges

#### Variantes
- **Default** : Badge standard
- **Success** : Badge de succès (vert)
- **Warning** : Badge d'avertissement (jaune)
- **Error** : Badge d'erreur (rouge)
- **Info** : Badge d'information (bleu)
- **Luxury** : Badge de luxe (gradient sombre)
- **Outline** : Badge avec bordure

## 🎭 Animations et Transitions

### Durées
```css
--transition-fast: 0.15s ease;    /* Micro-interactions */
--transition-base: 0.2s ease;     /* Transitions standard */
--transition-slow: 0.3s ease;     /* Transitions complexes */
--transition-slower: 0.5s ease;   /* Transitions de page */
```

### Animations Disponibles
- **fadeInUp** : Apparition depuis le bas
- **slideInRight** : Glissement depuis la droite
- **pulse** : Pulsation douce
- **float** : Flottement léger

## 📱 Responsive Design

### Breakpoints
```css
--mobile: 320px;
--mobile-lg: 480px;
--tablet: 768px;
--desktop: 1024px;
--desktop-lg: 1280px;
--desktop-xl: 1536px;
```

### Stratégie Mobile-First
- Design optimisé pour mobile en priorité
- 70%+ des utilisateurs réservent sur mobile
- Touch targets minimum 44px
- Typographie adaptée aux petits écrans

## ♿ Accessibilité

### Standards WCAG 2.1 AA
- **Contraste** : Minimum 4.5:1 pour le texte normal
- **Navigation clavier** : Toutes les fonctionnalités accessibles
- **Lecteurs d'écran** : Labels ARIA appropriés
- **Focus** : États de focus clairs et visibles

### Bonnes Pratiques
- Utiliser du HTML sémantique
- Fournir des alternatives textuelles
- Assurer la navigation au clavier
- Tester avec des outils d'accessibilité

## 🌙 Thème Sombre

### Variables CSS
```css
.dark {
  --background: var(--neutral-900);
  --foreground: var(--neutral-50);
  --card: var(--neutral-800);
  --border: var(--neutral-700);
  /* ... autres variables */
}
```

### Guidelines
- Maintenir la hiérarchie visuelle
- Adapter les couleurs pour le contraste
- Préserver la lisibilité
- Tester sur les deux thèmes

## 🎯 Personas Utilisateurs

### Voyageurs d'Affaires
- **Besoins** : Efficacité, fiabilité, service professionnel
- **Design** : Interface épurée, informations claires, réservation rapide

### Touristes
- **Besoins** : Informations claires, support multilingue, sensibilité culturelle
- **Design** : Interface intuitive, visuels attractifs, processus simplifié

### Résidents Locaux
- **Besoins** : Commodité, tarifs compétitifs, patterns familiers
- **Design** : Interface familière, prix visibles, options flexibles

### Utilisateurs Âgés
- **Besoins** : Cibles tactiles grandes, typographie claire, flux simplifiés
- **Design** : Boutons larges, texte lisible, navigation simple

## 📋 Checklist de Design

### ✅ À Faire
- [ ] Utiliser la palette de couleurs définie
- [ ] Respecter la hiérarchie typographique
- [ ] Tester sur mobile en priorité
- [ ] Vérifier l'accessibilité
- [ ] Maintenir la cohérence visuelle
- [ ] Optimiser les performances
- [ ] Tester sur les deux thèmes

### ❌ À Éviter
- [ ] Interfaces surchargées
- [ ] Coûts cachés
- [ ] Design desktop-only sur mobile
- [ ] Problèmes d'accessibilité
- [ ] Incohérences visuelles
- [ ] Performance lente
- [ ] Contraste insuffisant

## 🚀 Implémentation

### Installation
```tsx
// Le design system global est chargé une fois dans src/app/layout.tsx
import '@/styles/design-system.css';

// Les composants s'importent individuellement (pas de barrel export dans src/components/ui/)
import { Button } from '@/components/ui/Button';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { Badge } from '@/components/ui/Badge';
```

### Utilisation des Composants
```tsx
// Bouton principal
<Button variant="primary" size="lg">
  Réserver Maintenant
</Button>

// Card de service
<ServiceCard
  title="Transfert Aéroport"
  description="Service professionnel"
  icon="✈️"
  features={[...]}
  price="25 000 FCFA"
  onBook={handleBook}
/>

// Badge de statut
<Badge variant="success">
  Disponible
</Badge>
```

## 📚 Ressources

### Fichiers du Design System
- `src/styles/design-system.css` - Styles de base
- `src/components/ui/` - Composants UI
- `src/components/examples/` - Exemples et maquettes

### Outils Recommandés
- **Figma** : Pour les maquettes et prototypes
- **Chrome DevTools** : Pour le responsive testing
- **Lighthouse** : Pour l'audit de performance
- **axe-core** : Pour l'audit d'accessibilité

## 🔄 Mise à Jour

### Version 1.0.0
- Charte graphique initiale
- Composants de base
- Système de couleurs
- Guidelines d'accessibilité

### Prochaines Versions
- Composants avancés
- Animations supplémentaires
- Thèmes personnalisés
- Optimisations de performance

---

**Note** : Ce design system est un document vivant qui évolue avec les besoins de l'application. Toute modification doit être documentée et communiquée à l'équipe de développement.
