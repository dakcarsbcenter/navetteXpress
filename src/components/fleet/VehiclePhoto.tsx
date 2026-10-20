"use client";

import { useState } from "react";
import Image from "next/image";
import { Van } from "@phosphor-icons/react";

interface VehiclePhotoProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

/**
 * Photo de véhicule qui remplit son parent (`relative`). Une URL Cloudinary
 * périmée (404) donnerait sinon une zone vide : on affiche alors un repère
 * neutre plutôt qu'une photo d'un autre véhicule.
 */
export function VehiclePhoto({ src, alt, sizes, className }: VehiclePhotoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-[#ece6da] text-text-muted"
      >
        <Van size={48} weight="light" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
