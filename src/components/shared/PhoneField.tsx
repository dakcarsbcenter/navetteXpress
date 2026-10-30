"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import {
  DEFAULT_DIAL,
  FREQUENT_ISOS,
  PHONE_COUNTRIES,
  buildInternationalPhone,
  countryForDial,
  splitInternationalPhone,
  type PhoneCountry,
} from "@/lib/phone-countries";

type Lang = "fr" | "en" | "es";

const UI_TEXT: Record<Lang, { trigger: string; search: string; empty: string }> = {
  fr: { trigger: "Indicatif pays", search: "Pays ou indicatif…", empty: "Aucun pays trouvé" },
  en: { trigger: "Country code", search: "Country or code…", empty: "No country found" },
  es: { trigger: "Prefijo del país", search: "País o prefijo…", empty: "Ningún país encontrado" },
};

/** Minuscules, sans accents ni ponctuation : "Pays-Bas" et "pays bas" se valent. */
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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
  /** Classes du conteneur flex (sélecteur + input). */
  wrapperClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

/**
 * Téléphone avec sélecteur d'indicatif pays (tous les pays, avec recherche).
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
  const lang: Lang = locale === "en" || locale === "es" ? locale : "fr";

  const initial = splitInternationalPhone(value);
  // Le pays (et non l'indicatif) est l'état : +1 couvre États-Unis, Canada, Jamaïque…
  const [iso, setIso] = useState(() => countryForDial(initial.dial).iso);
  const [national, setNational] = useState(initial.national);
  const country = PHONE_COUNTRIES.find((c) => c.iso === iso) ?? countryForDial(DEFAULT_DIAL);
  // Dernière valeur émise : sert à distinguer une édition locale d'un changement venu du
  // parent (réinitialisation du formulaire, pré-remplissage après chargement).
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    const next = splitInternationalPhone(value);
    setIso((current) => countryForDial(next.dial, current).iso);
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
      <Popover className="shrink-0">
        <PopoverButton
          type="button"
          aria-label={`${UI_TEXT[lang].trigger} : ${country.label[lang]} +${country.dial}`}
          disabled={disabled}
          className={`cursor-pointer w-[6.5rem] inline-flex items-center justify-between gap-1 text-left disabled:cursor-not-allowed ${selectClassName}`}
          style={selectStyle ? { ...selectStyle, width: "6.5rem" } : undefined}
        >
          <span className="truncate">
            {country.iso} +{country.dial}
          </span>
          <CaretDown size={12} weight="bold" aria-hidden className="shrink-0 opacity-60" />
        </PopoverButton>
        <PopoverPanel
          focus
          anchor={{ to: "bottom start", gap: 6, padding: 12 }}
          className="z-[1000] w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-black/10 bg-white text-[#12100E] shadow-xl"
        >
          {({ close }) => (
            <CountryList
              lang={lang}
              selectedIso={country.iso}
              onSelect={(c) => {
                setIso(c.iso);
                emit(c.dial, national);
                close();
              }}
            />
          )}
        </PopoverPanel>
      </Popover>
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
          emit(country.dial, e.target.value);
        }}
        className={`min-w-0 ${className}`}
        style={style}
      />
    </div>
  );
}

/**
 * Contenu du panneau : monté à chaque ouverture, donc la recherche repart à vide.
 * Filtre pendant la frappe sur le nom (fr/en/es), le code ISO et l'indicatif.
 */
function CountryList({
  lang,
  selectedIso,
  onSelect,
}: {
  lang: Lang;
  selectedIso: string;
  onSelect: (country: PhoneCountry) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const frequent = PHONE_COUNTRIES.filter((c) => FREQUENT_ISOS.has(c.iso));
    const others = PHONE_COUNTRIES.filter((c) => !FREQUENT_ISOS.has(c.iso)).sort((a, b) =>
      a.label[lang].localeCompare(b.label[lang], lang)
    );
    return { frequent, others };
  }, [lang]);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [...sorted.frequent, ...sorted.others];
    const all = [...sorted.frequent, ...sorted.others];

    // Saisie uniquement chiffrée ("31", "+44", "00 221") : recherche par indicatif.
    if (/^[\d\s+]+$/.test(query.trim())) {
      const digits = query.replace(/\D/g, "").replace(/^00/, "");
      return all.filter((c) => c.dial.startsWith(digits)).sort((a, b) => a.dial.length - b.dial.length);
    }

    const starts: PhoneCountry[] = [];
    const contains: PhoneCountry[] = [];
    for (const c of all) {
      const names = [c.label.fr, c.label.en, c.label.es].map(normalize);
      if (c.iso.toLowerCase() === q || names.some((n) => n.startsWith(q))) starts.push(c);
      else if (names.some((n) => n.includes(q))) contains.push(c);
    }
    return [...starts, ...contains];
  }, [query, sorted]);

  const [active, setActive] = useState(() =>
    Math.max(
      0,
      results.findIndex((c) => c.iso === selectedIso)
    )
  );
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const showSeparator = !normalize(query);
  const text = UI_TEXT[lang];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-black/10 px-3 py-2">
        <MagnifyingGlass size={16} aria-hidden className="shrink-0 text-[#6E6A63]" />
        <input
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${results[active].iso}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={text.search}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              // Ne jamais soumettre le formulaire parent depuis la recherche.
              e.preventDefault();
              if (results[active]) onSelect(results[active]);
            }
          }}
          className="w-full min-w-0 bg-transparent text-sm text-[#12100E] placeholder:text-[#6E6A63] focus:outline-none"
        />
      </div>
      <ul id={listId} role="listbox" aria-label={text.trigger} className="max-h-72 overflow-y-auto py-1">
        {results.length === 0 && <li className="px-3 py-3 text-sm text-[#6E6A63]">{text.empty}</li>}
        {results.map((c, i) => (
          <li
            key={c.iso}
            id={`${listId}-${c.iso}`}
            ref={(el) => {
              optionRefs.current[i] = el;
            }}
            role="option"
            aria-selected={c.iso === selectedIso}
            onMouseEnter={() => setActive(i)}
            onClick={() => onSelect(c)}
            className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${
              i === active ? "bg-[var(--color-accent-subtle)]" : ""
            } ${c.iso === selectedIso ? "font-semibold text-[var(--color-accent)]" : ""} ${
              showSeparator && i === sorted.frequent.length ? "mt-1 border-t border-black/10 pt-2" : ""
            }`}
          >
            <span className="w-7 shrink-0 text-xs text-[#6E6A63]">{c.iso}</span>
            <span className="min-w-0 flex-1 truncate">{c.label[lang]}</span>
            <span className="shrink-0 tabular-nums text-[#6E6A63]">+{c.dial}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
