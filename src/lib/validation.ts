/**
 * Fragments zod partagés entre les routes d'écriture du back-office.
 *
 * Extraits de api/admin/bookings pour que la création et la modification d'une
 * réservation traitent l'email exactement de la même façon : la création
 * l'acceptait vide, la modification le refusait, si bien qu'une réservation
 * saisie sans email n'était plus modifiable du tout (400 « Format d'email
 * invalide » sur un simple changement de statut).
 */

import { z } from 'zod';

/** Une chaîne vide vaut « champ non renseigné », pas « valeur invalide ». */
export const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/**
 * Email client optionnel à la création : un client analphabète ou joint par
 * téléphone n'en a souvent pas. La colonne étant NOT NULL, l'appelant stocke
 * une chaîne vide et les envois d'email sont sautés côté notifications.
 */
export const optionalCustomerEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Format d'email invalide").max(255).optional()
);

/**
 * Email client optionnel à la modification. Différence avec la création : une
 * chaîne vide est conservée telle quelle, car elle exprime un effacement
 * volontaire (admin qui retire une adresse erronée) et non une absence de
 * champ — `undefined` laisserait l'ancienne valeur en base.
 */
export const erasableCustomerEmail = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim() : v),
  z
    .union([z.literal(''), z.string().email("Format d'email invalide").max(255)])
    .optional()
);
