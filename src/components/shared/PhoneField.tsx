"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import {
  PHONE_COUNTRIES,
  buildInternationalPhone,
  splitInternationalPhone,
} from "@/lib/phone-countries";

interface PhoneFieldProps {
  /** Valeur au format E.164 ("+221771234567"), ou valeur historique non normalisée. */
  value: string;
  /** Reçoit toujours "+<indicatif><numéro>", ou "" quand le champ est vide. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Classes de l'input (mêmes que les anciens <input type="tel">). */
  className?: string;
  /** Style de l'input, pour les formulaires qui stylent en ligne (dashboards). */
  style?: CSSProperties;
  /**
   * Habillage du sélecteur d'indicatif. Par défaut il est nu (comme les champs sans
   * bordure de la réservation) ; les formulaires à champs encadrés passent ici les mêmes
   * classes/style que l'input pour que les deux restent alignés.
   */
  selectClassName?: string;
  selectStyle?: CSSProperties;
  /** Classes du conteneur flex (select + input). */
  wrapperClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

/**
 * Téléphone avec sélecteur d'indicatif pays.
 *
 * Remplace les <input type="tel"> libres : la saisie nationale ("06 12 34 56 78") est
 * combinée à l'indicatif choisi et émise en E.164, si bien qu'aucun numéro ambigu
 * n'entre en base (voir src/lib/phone.ts). Une saisie qui commence par "+" ou "00"
 * l'emporte sur le sélecteur.
 */
export default function PhoneField({
  value,
  onChange,
  placeholder = "77 123 45 67",
  className = "w-full bg-transparent text-foreground font-medium focus:outline-none",
  style,
  selectClassName = "bg-transparent text-foreground font-medium text-sm focus:outline-none",
  selectStyle,
  wrapperClassName = "flex items-center gap-2 w-full",
  id,
  name,
  required,
  disabled,
  autoComplete = "tel-national",
}: PhoneFieldProps) {
  const locale = useLocale();
  const lang = locale === "en" || locale === "es" ? locale : "fr";

  const initial = splitInternationalPhone(value);
  const [dial, setDial] = useState(initial.dial);
  const [national, setNational] = useState(initial.national);
  // Dernière valeur émise : sert à distinguer une édition locale d'un changement venu du
  // parent (réinitialisation du formulaire, pré-remplissage après chargement).
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = splitInternationalPhone(value);
    setDial(next.dial);
    setNational(next.national);
    lastEmitted.current = value;
  }, [value]);

  const emit = (nextDial: string, nextNational: string) => {
    const next = buildInternationalPhone(nextDial, nextNational);
    lastEmitted.current = next;
    onChange(next);
  };

  return (
    <div className={wrapperClassName}>
      <select
        aria-label="Indicatif pays"
        value={dial}
        disabled={disabled}
        onChange={(e) => {
          setDial(e.target.value);
          emit(e.target.value, national);
        }}
        className={`shrink-0 cursor-pointer w-[6.5rem] ${selectClassName}`}
        style={selectStyle ? { ...selectStyle, width: "6.5rem" } : undefined}
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.iso} +{c.dial} — {c.label[lang]}
          </option>
        ))}
      </select>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={national}
        placeholder={placeholder}
        onChange={(e) => {
          setNational(e.target.value);
          emit(dial, e.target.value);
        }}
        className={`min-w-0 ${className}`}
        style={style}
      />
    </div>
  );
}
