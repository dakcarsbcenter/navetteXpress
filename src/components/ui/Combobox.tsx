"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texte secondaire affiché à droite dans la liste (liaison, code IATA...) */
  hint?: string;
  /** Termes supplémentaires pris en compte par le filtre (code IATA, alias...) */
  keywords?: string;
}

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  noResultsLabel: string;
  /** Saisie hors liste conservée telle quelle au blur (sinon : vidée) */
  allowFreeText?: boolean;
  /** Normalisation appliquée à chaque frappe, ex. mise en majuscules */
  transform?: (raw: string) => string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  listClassName?: string;
  /** Contenu rendu à gauche de l'input (icône) */
  leading?: React.ReactNode;
}

const DEFAULT_INPUT_CLASS =
  "w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors";

/**
 * Saisie libre filtrant une liste de suggestions, plutôt qu'un long menu à
 * dérouler. Utilisé pour les marques de véhicules (liste stricte) et pour les
 * numéros de vol / compagnies aériennes (saisie libre autorisée).
 */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder,
  noResultsLabel,
  allowFreeText = false,
  transform,
  id,
  name,
  required = false,
  className = "",
  inputClassName = DEFAULT_INPUT_CLASS,
  listClassName = "",
  leading,
}: ComboboxProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((opt) =>
        `${opt.label} ${opt.keywords ?? ""}`.toLowerCase().includes(needle),
      )
    : options;

  useEffect(() => {
    setHighlighted(0);
  }, [needle]);

  const handleSelect = (opt: ComboboxOption) => {
    onValueChange(opt.value);
    setQuery(opt.label);
    setIsOpen(false);
  };

  const handleBlur = () => {
    const match = options.find(
      (opt) => opt.label.toLowerCase() === query.trim().toLowerCase(),
    );
    if (match) {
      onValueChange(match.value);
      setQuery(match.label);
    } else if (allowFreeText) {
      const kept = query.trim();
      onValueChange(kept);
      setQuery(kept);
    } else {
      onValueChange("");
      setQuery("");
    }
    setIsOpen(false);
  };

  const handleChange = (raw: string) => {
    const next = transform ? transform(raw) : raw;
    setQuery(next);
    setIsOpen(true);
    // En saisie libre, la valeur suit la frappe : pas besoin d'attendre le blur
    // pour que le parent réagisse (ex. déduction de la compagnie aérienne).
    if (allowFreeText) onValueChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filtered.length === 0) return;
      setHighlighted((prev) => {
        const next = e.key === "ArrowDown" ? prev + 1 : prev - 1;
        return (next + filtered.length) % filtered.length;
      });
    } else if (e.key === "Enter") {
      if (isOpen && filtered[highlighted]) {
        e.preventDefault();
        handleSelect(filtered[highlighted]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted, isOpen]);

  const listId = id ? `${id}-listbox` : undefined;

  return (
    <div className={`relative ${className}`}>
      <div className={leading ? "flex items-center gap-2" : undefined}>
        {leading}
        <input
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && filtered[highlighted] && listId
              ? `${listId}-${highlighted}`
              : undefined
          }
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={inputClassName}
        />
      </div>
      {isOpen && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={`absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-white border border-[#d8d2c7] rounded shadow-lg ${listClassName}`}
        >
          {filtered.length > 0 ? (
            filtered.map((opt, index) => (
              <li
                key={opt.value}
                id={listId ? `${listId}-${index}` : undefined}
                role="option"
                aria-selected={index === highlighted}
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`w-full flex items-baseline justify-between gap-3 text-left px-4 py-2.5 text-sm text-foreground transition-colors ${
                    index === highlighted ? "bg-accent/10" : ""
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.hint && (
                    <span className="text-[11px] text-[#6E6A63] shrink-0">{opt.hint}</span>
                  )}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-sm text-[#6E6A63]">{noResultsLabel}</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default Combobox;
