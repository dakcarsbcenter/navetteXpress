// Les quatre cartes de la home affichent les quatre premiers segments actifs de la
// table pricing_segments, dans l'ordre defini par l'admin
// (/admin/dashboard?tab=pricing). Les donnees sont lues cote serveur par
// src/app/[locale]/page.tsx : la section reste du HTML pur, sans JS ni
// clignotement entre une valeur de repli et le tarif reel.

export interface HomeSegment {
  id?: number;
  route: string;
  distance: string;
  duree: string;
  berline: number;
  suv: number;
}

interface SegmentsShowcaseProps {
  segments: HomeSegment[];
}

const stripePattern = {
  backgroundImage: "repeating-linear-gradient(45deg, #E8DCC8 0 10px, #E0D2B9 10px 20px)",
};

export function SegmentsShowcase({ segments }: SegmentsShowcaseProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {segments.map((seg) => (
        <div
          key={seg.id ?? seg.route}
          className="bg-white border border-[#e2dacd] rounded-lg overflow-hidden"
        >
          <div className="h-24" style={stripePattern} />
          <div className="p-4 flex flex-col gap-2">
            <div className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.1em] text-text-muted">
              {seg.route.toUpperCase()}
            </div>
            <div className="text-xl font-semibold text-foreground tracking-tight">
              {seg.berline.toLocaleString("fr-FR")}{' '}
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-normal text-text-muted">
                FCFA
              </span>
            </div>
            <div className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-text-muted">
              {`${seg.distance} · ${seg.duree}`.toUpperCase()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
