# 🎨 Guide d'Utilisation des Templates Email Resend

## 📋 Vue d'ensemble

Ce guide vous montre comment prévisualiser, construire et utiliser les templates d'emails dans NavetteXpress.

## 🚀 Méthodes de Prévisualisation

### Méthode 1 : Serveur de Développement React Email (Recommandé)

Le moyen le plus simple de prévisualiser vos emails avec rechargement automatique :

```bash
npm run email
```

Cela ouvre un serveur sur **http://localhost:3001** avec :
- ✅ Prévisualisation en temps réel
- ✅ Rechargement automatique lors des modifications
- ✅ Test sur différents clients email
- ✅ Mode responsive (mobile/desktop)

### Méthode 2 : Génération de Fichiers HTML

Pour générer des fichiers HTML statiques :

```bash
npm run email:preview
```

Cela crée des fichiers HTML dans `email-previews/` que vous pouvez ouvrir dans votre navigateur.

### Méthode 3 : Export React Email

Pour exporter tous les templates :

```bash
npm run email:export
```

Les fichiers sont créés dans `.react-email/`.

## 📧 Templates Disponibles

### 1. PasswordResetEmail
**Fichier :** `src/emails/PasswordResetEmail.tsx`

**Utilisation :**
```typescript
import { PasswordResetEmail } from '@/emails';

const html = render(PasswordResetEmail({
  userName: 'Jean Dupont',
  resetUrl: 'https://app.com/reset?token=abc123',
  expiresIn: '1 heure'
}));
```

**Props :**
- `userName` (string) : Nom de l'utilisateur
- `resetUrl` (string) : Lien de réinitialisation
- `expiresIn` (string, optionnel) : Durée de validité (défaut: "1 heure")

**Design :**
- Bouton call-to-action bleu
- Lien de secours
- Message d'expiration
- Footer professionnel

### 2. AccountLockedEmail
**Fichier :** `src/emails/AccountLockedEmail.tsx`

**Utilisation :**
```typescript
import { AccountLockedEmail } from '@/emails';

const html = render(AccountLockedEmail({
  userName: 'Marie Martin',
  unlockTime: 'vendredi 15 novembre 2025 à 14:30',
  resetUrl: 'https://app.com/reset'
}));
```

**Props :**
- `userName` (string) : Nom de l'utilisateur
- `unlockTime` (string) : Date/heure de déblocage formatée
- `resetUrl` (string) : Lien de réinitialisation

**Design :**
- Alerte jaune pour attirer l'attention
- Box avec l'heure de déblocage
- Bouton rouge pour l'urgence
- Conseils de sécurité

### 3. WelcomeEmail
**Fichier :** `src/emails/WelcomeEmail.tsx`

**Utilisation :**
```typescript
import WelcomeEmail from '@/emails/WelcomeEmail';

const html = render(WelcomeEmail());
```

**Props :** Aucun (optionnel : vous pouvez l'étendre)

**Design :**
- Message de bienvenue chaleureux
- Liste des fonctionnalités
- Bouton d'accès au compte

## 🎨 Personnaliser les Templates

### Modifier les Couleurs

Dans chaque template, vous trouverez les styles en bas du fichier :

```typescript
const button = {
  backgroundColor: '#0070f3', // ← Changez cette couleur
  borderRadius: '5px',
  color: '#fff',
  // ...
};
```

**Palette de couleurs NavetteXpress :**
- Bleu principal : `#0070f3`
- Vert succès : `#28a745`
- Rouge alerte : `#dc3545`
- Jaune warning : `#ffc107`

### Ajouter un Logo

```typescript
import { Img } from '@react-email/components';

// Dans le template
<Container style={container}>
  <Img
    src="https://votre-domaine.com/logo.png"
    alt="NavetteXpress"
    width="150"
    height="50"
    style={{ margin: '0 auto' }}
  />
  <Heading style={h1}>Titre</Heading>
  {/* ... */}
</Container>
```

### Ajouter des Boutons Secondaires

```typescript
<Section style={buttonContainer}>
  <Button style={button} href="https://...">
    Action Principale
  </Button>
  <Button style={secondaryButton} href="https://...">
    Action Secondaire
  </Button>
</Section>

// Style
const secondaryButton = {
  ...button,
  backgroundColor: 'transparent',
  color: '#0070f3',
  border: '1px solid #0070f3',
};
```

## 🔧 Créer un Nouveau Template

### Étape 1 : Créer le fichier

```bash
touch src/emails/MonNouveauEmail.tsx
```

### Étape 2 : Structure de base

```typescript
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface MonNouveauEmailProps {
  userName: string;
  customData: string;
}

export default function MonNouveauEmail({
  userName = 'Utilisateur',
  customData,
}: MonNouveauEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Texte de prévisualisation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Titre</Heading>
          
          <Text style={text}>
            Bonjour {userName},
          </Text>
          
          <Text style={text}>
            Votre contenu ici : {customData}
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://...">
              Action
            </Button>
          </Section>

          <Text style={footer}>
            Cordialement,<br />
            L&apos;équipe NavetteXpress
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (copiez depuis un template existant)
const main = { /* ... */ };
const container = { /* ... */ };
// etc.
```

### Étape 3 : Ajouter à l'index

```typescript
// src/emails/index.ts
export { default as MonNouveauEmail } from './MonNouveauEmail';
```

### Étape 4 : Utiliser dans votre code

```typescript
import { sendEmail } from '@/lib/email';
import { MonNouveauEmail } from '@/emails';

await resend.emails.send({
  from: FROM_EMAIL,
  to: [email],
  subject: 'Mon Sujet',
  react: MonNouveauEmail({
    userName: 'Jean',
    customData: 'test'
  }),
});
```

## 📱 Test sur Différents Clients Email

### Via React Email Dev

```bash
npm run email
```

Puis cliquez sur "Device Preview" pour tester :
- 📧 Gmail
- 📧 Outlook
- 📧 Apple Mail
- 📧 Yahoo Mail
- 📱 Mobile

### Manuellement

1. Générez le HTML :
```bash
npm run email:preview
```

2. Envoyez-vous un email de test :
```bash
node test-email-sending.mjs votre@email.com
```

3. Vérifiez sur votre client email préféré

## 🎯 Bonnes Pratiques

### 1. Texte Alt pour les Images

```typescript
<Img
  src="..."
  alt="Description claire de l'image"
  width="100"
  height="100"
/>
```

### 2. Liens de Secours

Toujours fournir un lien texte en plus du bouton :

```typescript
<Button style={button} href={url}>Cliquez ici</Button>

<Text style={textSmall}>
  Si le bouton ne fonctionne pas, copiez ce lien : {url}
</Text>
```

### 3. Preview Text

Le texte de prévisualisation est crucial :

```typescript
<Preview>
  Un résumé clair et concis de l'email (50-100 caractères)
</Preview>
```

### 4. Responsive

Tous les templates sont responsive par défaut grâce à :
- `maxWidth: '600px'` sur le container
- Tailles de police en pixels
- Padding adaptés

### 5. Tests

Testez toujours sur :
- ✅ Desktop (Gmail, Outlook, Apple Mail)
- ✅ Mobile (iOS Mail, Gmail App)
- ✅ Dark mode
- ✅ Webmail vs Apps

## 🚀 Workflow de Développement

### 1. Développement

```bash
# Terminal 1 : Serveur Next.js
npm run dev

# Terminal 2 : Prévisualisation emails
npm run email
```

### 2. Modification

1. Ouvrez `src/emails/MonTemplate.tsx`
2. Modifiez le code
3. Sauvegardez
4. Le navigateur se recharge automatiquement

### 3. Test d'Envoi

```bash
node test-email-sending.mjs votre@email.com
```

### 4. Export pour Production

```bash
npm run email:export
```

## 📊 Composants React Email Disponibles

Tous les composants sont importés depuis `@react-email/components` :

```typescript
import {
  Body,          // Corps de l'email
  Button,        // Boutons avec liens
  Container,     // Container principal
  Head,          // En-tête HTML
  Heading,       // Titres (h1, h2, etc.)
  Hr,           // Ligne horizontale
  Html,          // Racine HTML
  Img,          // Images
  Link,         // Liens texte
  Preview,       // Texte de prévisualisation
  Section,       // Sections (div)
  Text,          // Paragraphes
  Row,          // Lignes (layout)
  Column,       // Colonnes (layout)
} from '@react-email/components';
```

## 🎨 Exemples de Personnalisation

### Email avec 2 Colonnes

```typescript
import { Row, Column } from '@react-email/components';

<Row>
  <Column>
    <Text>Colonne 1</Text>
  </Column>
  <Column>
    <Text>Colonne 2</Text>
  </Column>
</Row>
```

### Email avec Image Header

```typescript
<Container style={container}>
  <Img
    src="https://votre-domaine.com/banner.jpg"
    alt="Banner"
    width="600"
    height="200"
    style={{ width: '100%', height: 'auto' }}
  />
  <Heading style={h1}>Titre</Heading>
  {/* ... */}
</Container>
```

### Email avec Liste à Puces

```typescript
<Text style={text}>Voici ce que vous obtenez :</Text>
<ul style={{ margin: '0 24px', padding: 0 }}>
  <li style={{ marginBottom: '8px' }}>✅ Avantage 1</li>
  <li style={{ marginBottom: '8px' }}>✅ Avantage 2</li>
  <li style={{ marginBottom: '8px' }}>✅ Avantage 3</li>
</ul>
```

## 🐛 Dépannage

### Problème : Le serveur email ne démarre pas

```bash
# Vérifiez que react-email est installé
npm list react-email

# Réinstallez si nécessaire
npm install -D react-email
```

### Problème : Les styles ne s'appliquent pas

- Utilisez des styles inline (pas de CSS externe)
- Évitez les syntaxes CSS modernes (flexbox limité)
- Testez sur différents clients

### Problème : Le rechargement ne fonctionne pas

- Redémarrez le serveur
- Vérifiez que vous modifiez bien les fichiers dans `src/emails/`

## 📚 Ressources

- **React Email Docs** : https://react.email/docs
- **Composants** : https://react.email/docs/components/html
- **Examples** : https://react.email/examples
- **Best Practices** : https://react.email/docs/best-practices

## ✅ Checklist Template Email

Avant d'utiliser un template en production :

- [ ] Texte de prévisualisation défini
- [ ] Testé sur Gmail, Outlook, Apple Mail
- [ ] Testé sur mobile
- [ ] Testé en dark mode
- [ ] Alt text pour toutes les images
- [ ] Lien de secours fourni
- [ ] Responsive vérifié
- [ ] Contenu sans fautes
- [ ] Envoi de test effectué

---

**Date de création** : 15 novembre 2025  
**Version** : 1.0  
**Dernière mise à jour** : 15 novembre 2025
