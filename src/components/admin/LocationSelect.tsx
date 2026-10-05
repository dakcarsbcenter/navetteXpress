"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface LocationOption {
  id: number
  name: string
}

interface LocationSelectProps {
  value: string
  onChange: (value: string) => void
  locations: LocationOption[]
  /** Placeholder de l'input de saisie libre (ex. « Adresse de départ »). */
  placeholder?: string
  /** Style du select et de l'input, pour coller à l'écran appelant. */
  style?: React.CSSProperties
}

/** Valeur sentinelle de l'option « Autre lieu » — jamais stockée, jamais envoyée. */
const CUSTOM_OPTION = '__custom__'

/**
 * Sélection d'un lieu parmi ceux paramétrés, avec repli en saisie libre.
 *
 * Le mode « saisie libre » est un état propre, et non déduit de la valeur comme
 * le faisaient les trois écrans admin : choisir l'option vidait l'adresse, ce qui
 * refermait aussitôt le champ de saisie et rendait l'option inatteignable.
 * L'appelant, lui, ne manipule qu'une seule chaîne — l'adresse finale.
 */
export function LocationSelect({ value, onChange, locations, placeholder, style }: LocationSelectProps) {
  const names = useMemo(() => locations.map((l) => l.name), [locations])
  const isKnown = Boolean(value) && names.includes(value)
  const [isCustom, setIsCustom] = useState(() => Boolean(value) && !isKnown)
  // Mémorise la dernière valeur reçue de l'extérieur : seul un changement venu du
  // parent (duplication, chargement d'une réservation) doit rouvrir ou refermer la
  // saisie libre, jamais la frappe de l'utilisateur dans le champ.
  const lastExternalValue = useRef(value)

  useEffect(() => {
    if (value === lastExternalValue.current) return
    lastExternalValue.current = value
    // Une adresse hors liste ne peut venir que d'une saisie libre ; une adresse de
    // la liste referme le champ. Une valeur vide laisse le mode courant tel quel,
    // sinon on refermerait le champ au premier effacement.
    if (!value) return
    setIsCustom(!names.includes(value))
  }, [value, names])

  const handleSelect = (next: string) => {
    if (next === CUSTOM_OPTION) {
      setIsCustom(true)
      lastExternalValue.current = ''
      onChange('')
      return
    }
    setIsCustom(false)
    lastExternalValue.current = next
    onChange(next)
  }

  return (
    <>
      <select
        value={isCustom ? CUSTOM_OPTION : value}
        onChange={(e) => handleSelect(e.target.value)}
        style={style}
      >
        <option value="">Choisir un lieu…</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.name}>{loc.name}</option>
        ))}
        <option value={CUSTOM_OPTION}>Autre lieu (saisie libre)…</option>
      </select>
      {isCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => {
            lastExternalValue.current = e.target.value
            onChange(e.target.value)
          }}
          placeholder={placeholder}
          style={{ ...style, marginTop: '8px' }}
        />
      )}
    </>
  )
}

/** Vrai quand l'adresse saisie ne fait pas partie des lieux paramétrés. */
export function isCustomLocation(value: string, locations: LocationOption[]): boolean {
  return Boolean(value) && !locations.some((l) => l.name === value)
}
