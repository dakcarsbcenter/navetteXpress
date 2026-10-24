import Link from "next/link";
import { RootShell } from "@/components/layout/RootShell";

// 404 hors des pages localisées (le layout racine ne rend pas de <html>,
// cf. src/components/layout/RootShell.tsx). Les URL publiques inconnues passent
// par src/app/[locale]/not-found.tsx, traduite ; celle-ci est le dernier filet.
export default function RootNotFound() {
  return (
    <RootShell locale="fr" skipLabel="Aller au contenu">
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-32 space-y-6 text-center">
        <h1 className="text-4xl font-semibold text-foreground">Page introuvable</h1>
        <p className="text-body">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="inline-block px-5 py-3 rounded bg-accent text-white font-semibold">Retour à l&apos;accueil</Link>
      </main>
    </RootShell>
  );
}
