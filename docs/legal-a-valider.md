# Pages légales : brouillon à valider avant mise en prod

Textes : `messages/{fr,en,es}/legal.json` (CGV, mentions légales, confidentialité).
Rendu : `src/components/legal/LegalPage.tsx`, routes `/cgv`, `/mentions-legales`, `/confidentialite`.

Le brouillon n'utilise que des données réelles du dépôt (`src/lib/pdf/brand.ts`, mentions des PDF).
Ce qui suit n'a **pas** pu être déduit du code et doit être tranché :

1. **Annulation gratuite** : la FAQ (`messages/fr/faq.json`) dit « 2 h avant », le PDF de devis
   (`src/lib/pdf/quote-pdf.ts`) dit « 24 h ». Les CGV renvoient au devis/à la confirmation
   sans chiffrer ; à harmoniser, puis à écrire dans les CGV.
2. **Mentions légales** : directeur de la publication, hébergeur (nom, adresse), adresse postale complète
   absents. `src/lib/schema.ts` indique `foundingDate: '2023'` alors que le RCCM date de 2014.
3. **Confidentialité** : durées de conservation précises, liste exacte des sous-traitants, existence
   éventuelle d'une déclaration auprès de la CDP.
4. **CGV** : droit sénégalais et tribunaux de Dakar (choix par défaut), responsabilité (bagages, objets
   oubliés), politique de remboursement.
5. Faire relire l'ensemble par un juriste avant publication large.
