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

## 🎨 Palette de Couleurs

### Couleurs Principales

#### Bleu Professionnel
```css
--primary-blue: #1e40af;      /* Bleu foncé principal */
--primary-blue-light: #3b82f6; /* Bleu clair pour les accents */
--primary-blue-dark: #1e3a8a;  /* Bleu très foncé */
```
**Usage** : Navigation, informations importantes, éléments de confiance

#### Orange Énergique
```css
--accent-orange: #f97316;      /* Orange principal */
--accent-orange-light: #fb923c; /* Orange clair */
--accent-orange-dark: #ea580c;  /* Orange foncé */
```
**Usage** : Call-to-action, éléments d'interaction, chaleur sénégalaise

#### Vert Sénégal
```css
--senegal-green: #059669;      /* Vert sénégalais */
--senegal-green-light: #10b981; /* Vert clair */
```
**Usage** : Succès, nature, croissance, éléments positifs

### Couleurs Neutres
```css
--neutral-900: #0f172a;  /* Texte principal */
--neutral-800: #1e293b;  /* Texte secondaire */
--neutral-700: #334155;  /* Texte tertiaire */
--neutral-600: #475569;  /* Texte désactivé */
--neutral-500: #64748b;  /* Bordures */
--neutral-400: #94a3b8;  /* Bordures claires */
--neutral-300: #cbd5e1;  /* Arrière-plans */
--neutral-200: #e2e8f0;  /* Arrière-plans clairs */
--neutral-100: #f1f5f9;  /* Arrière-plans très clairs */
--neutral-50: #f8fafc;   /* Arrière-plan principal */
```

### Couleurs d'État
```css
--success: #10b981;      /* Succès */
--error: #ef4444;        /* Erreur */
--warning: #f59e0b;      /* Avertissement */
--info: #3b82f6;         /* Information */
```

## 📝 Typographie

### Police Principale
- **Famille** : Poppins (Google Fonts)
- **Poids disponibles** : 300, 400, 500, 600, 700, 800

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

### Boutons

#### Variantes
- **Primary** : Bouton principal avec gradient orange
- **Secondary** : Bouton secondaire avec gradient bleu
- **Luxury** : Bouton de luxe avec gradient sombre
- **Outline** : Bouton avec bordure
- **Ghost** : Bouton transparent

#### Tailles
- **SM** : 32px de hauteur
- **MD** : 40px de hauteur
- **LG** : 48px de hauteur
- **XL** : 56px de hauteur

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
```bash
# Importer le design system
import '@/styles/design-system.css';

# Utiliser les composants
import { Button, Card, Badge } from '@/components/ui';
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
