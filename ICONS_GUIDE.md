# Guide d'utilisation des icônes Lucide React - Navette Xpress

## 📦 Configuration

Les icônes lucide-react sont déjà installées et configurées dans le projet. Toutes les icônes sont centralisées dans `src/components/icons.tsx` pour faciliter l'import et maintenir la cohérence.

## 🎯 Comment utiliser les icônes

### Import basique

```tsx
import { Phone, Mail, Car, Calendar } from '@/components/icons';

function MyComponent() {
  return (
    <div>
      <Phone className="w-5 h-5" />
      <Mail className="w-5 h-5 text-blue-600" />
      <Car className="w-6 h-6" />
      <Calendar className="w-6 h-6" />
    </div>
  );
}
```

### Personnalisation des icônes

#### Taille
```tsx
// Petite icône (16px)
<Phone className="w-4 h-4" />

// Moyenne (20px)
<Phone className="w-5 h-5" />

// Grande (24px)
<Phone className="w-6 h-6" />

// Très grande (32px)
<Phone className="w-8 h-8" />
```

#### Couleur
```tsx
// Couleur personnalisée
<Phone className="w-5 h-5 text-blue-600" />
<Mail className="w-5 h-5 text-red-500" />

// Avec dark mode
<Phone className="w-5 h-5 text-slate-900 dark:text-white" />
```

#### Stroke Width (épaisseur du trait)
```tsx
<Phone className="w-5 h-5" strokeWidth={2} />
<Phone className="w-5 h-5" strokeWidth={1.5} />
```

#### Animation
```tsx
// Rotation
<Loader2 className="w-5 h-5 animate-spin" />

// Pulse
<Bell className="w-5 h-5 animate-pulse" />

// Bounce
<ArrowDown className="w-5 h-5 animate-bounce" />
```

## 📚 Icônes disponibles par catégorie

### Navigation & Menu
- `Menu`, `X`, `ChevronDown`, `ChevronRight`, `ChevronLeft`
- `ArrowRight`, `ArrowLeft`

### Communication
- `Phone`, `Mail`, `MessageCircle`, `Send`

### Transport
- `Car`, `Plane`, `MapPin`, `Navigation`, `Map`

### Utilisateur & Compte
- `User`, `Users`, `UserPlus`, `UserCheck`
- `LogIn`, `LogOut`, `Settings`

### Réservation & Calendrier
- `Calendar`, `CalendarDays`, `Clock`, `Timer`, `AlertCircle`

### Statut & Notifications
- `Bell`, `BellRing`, `Check`, `CheckCircle`, `XCircle`
- `AlertTriangle`, `Info`

### Actions
- `Plus`, `Minus`, `Edit`, `Trash2`, `Search`, `Filter`
- `Download`, `Upload`, `Save`, `RefreshCw`

### UI & Interface
- `Eye`, `EyeOff`, `Home`, `Star`, `Heart`, `Share2`
- `ExternalLink`, `Link`, `Copy`, `Loader2`

### Business
- `Briefcase`, `CreditCard`, `DollarSign`, `TrendingUp`
- `BarChart`, `PieChart`

### Réseaux sociaux
- `Facebook`, `Instagram`, `Linkedin`, `Twitter`

### Sécurité
- `Shield`, `ShieldCheck`, `Lock`, `Unlock`

### Documents
- `FileText`, `File`, `FileDownload`, `FileUpload`

### Thème
- `Sun`, `Moon`, `Monitor`

### Utilitaires
- `MoreVertical`, `MoreHorizontal`, `Grid`, `List`
- `Package`, `Zap`

## 💡 Exemples pratiques

### Bouton avec icône
```tsx
import { Calendar } from '@/components/icons';

<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
  <Calendar className="w-5 h-5" />
  Réserver
</button>
```

### Liens avec icône
```tsx
import { Phone, Mail } from '@/components/icons';

<a href="tel:+221781319191" className="flex items-center gap-2">
  <Phone className="w-4 h-4" />
  +221 78 131 91 91
</a>

<a href="mailto:contact@navettexpress.sn" className="flex items-center gap-2">
  <Mail className="w-4 h-4" />
  contact@navettexpress.sn
</a>
```

### État de chargement
```tsx
import { Loader2 } from '@/components/icons';

{isLoading ? (
  <Loader2 className="w-5 h-5 animate-spin" />
) : (
  <span>Contenu chargé</span>
)}
```

### Cards avec icônes
```tsx
import { Clock, CheckCircle, Shield } from '@/components/icons';

<div className="grid grid-cols-3 gap-4">
  <div className="p-4 bg-white rounded-lg">
    <Clock className="w-6 h-6 text-blue-600 mb-2" />
    <h3>Disponible 24h/24</h3>
  </div>
  
  <div className="p-4 bg-white rounded-lg">
    <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
    <h3>Réservation instantanée</h3>
  </div>
  
  <div className="p-4 bg-white rounded-lg">
    <Shield className="w-6 h-6 text-purple-600 mb-2" />
    <h3>Sécurité garantie</h3>
  </div>
</div>
```

### Menu de navigation
```tsx
import { Home, Car, Calendar, User } from '@/components/icons';

const navItems = [
  { icon: Home, label: 'Accueil', href: '/' },
  { icon: Car, label: 'Flotte', href: '/flotte' },
  { icon: Calendar, label: 'Réservation', href: '/reservation' },
  { icon: User, label: 'Profile', href: '/profile' },
];

<nav>
  {navItems.map((item) => (
    <Link key={item.href} href={item.href} className="flex items-center gap-2">
      <item.icon className="w-5 h-5" />
      {item.label}
    </Link>
  ))}
</nav>
```

## 🎨 Bonnes pratiques UX

### Tailles recommandées selon le contexte

- **Icônes dans le texte** : `w-4 h-4` (16px)
- **Boutons standards** : `w-5 h-5` (20px)
- **Boutons principaux** : `w-6 h-6` (24px)
- **Headers de sections** : `w-8 h-8` (32px)
- **Hero sections** : `w-12 h-12` ou plus (48px+)

### Contraste et accessibilité

```tsx
// ✅ Bon : Bon contraste
<Phone className="w-5 h-5 text-slate-900 dark:text-white" />

// ❌ Éviter : Mauvais contraste
<Phone className="w-5 h-5 text-gray-300" />
```

### Performance

Les icônes lucide-react bénéficient du tree-shaking automatique : seules les icônes importées sont incluses dans le bundle final. C'est pourquoi nous utilisons des imports nommés.

```tsx
// ✅ Bon : Tree-shaking efficace
import { Phone, Mail } from '@/components/icons';

// ❌ À éviter : Import de toute la bibliothèque
import * as Icons from 'lucide-react';
```

## 🔄 Ajouter de nouvelles icônes

Si vous avez besoin d'une icône qui n'est pas encore dans `icons.tsx` :

1. Consultez la [documentation Lucide](https://lucide.dev/icons)
2. Ajoutez l'export dans `src/components/icons.tsx`
3. Utilisez-la comme les autres icônes

```tsx
// Dans src/components/icons.tsx
export {
  // ... autres exports
  NouvelleIcone,
} from 'lucide-react';
```

## 📱 Responsive Design

```tsx
// Taille responsive
<Phone className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />

// Visible/caché selon la taille d'écran
<div className="hidden md:flex items-center gap-2">
  <Mail className="w-4 h-4" />
  <span>contact@navettexpress.sn</span>
</div>
```

## 🎯 Exemples spécifiques à Navette Xpress

### Section Hero
```tsx
<button className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl">
  <Calendar className="w-6 h-6" />
  Réserver Maintenant
</button>
```

### Contact bar
```tsx
<div className="flex items-center gap-6">
  <div className="flex items-center gap-2">
    <Phone className="w-4 h-4" />
    <span>+221 78 131 91 91</span>
  </div>
  <div className="flex items-center gap-2">
    <Mail className="w-4 h-4" />
    <span>contact@navettexpress.sn</span>
  </div>
</div>
```

### Service cards
```tsx
<div className="p-6 bg-white rounded-2xl">
  <Car className="w-8 h-8 text-blue-600 mb-4" />
  <h3>Transfert Aéroport</h3>
  <p>Service disponible 24h/24</p>
</div>
```

---

**Documentation mise à jour** : Octobre 2024  
**Version de lucide-react** : 0.544.0

Pour plus d'informations, consultez la [documentation officielle de Lucide React](https://lucide.dev/guide/packages/lucide-react).


