import { notFound } from "next/navigation";

// Toute URL inconnue sous une langue aboutit ici, pour afficher la page 404
// traduite de src/app/[locale]/not-found.tsx (modèle next-intl). Sans ce
// catch-all, Next rendrait sa 404 générique hors du layout de langue.
export default function CatchAllPage() {
  notFound();
}
