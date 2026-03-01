import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
  service?: string;
  date?: string;
  isVerified?: boolean;
  className?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  role,
  content,
  rating,
  avatar,
  service,
  date,
  isVerified = false,
  className
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77 5.06 16.16 6 10.66 2 6.76l5.61-.92L10 1z"
          fill={index < rating ? 'var(--color-gold)' : 'rgba(201,168,76,0.2)'}
        />
      </svg>
    ));
  };

  const initiales = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div
      className={cn(
        "break-inside-avoid rounded-2xl p-6 mb-5 transition-all duration-300 group select-none",
        "bg-surface-2/50 backdrop-blur-xl border border-border",
        "hover:border-gold/20 hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] hover:-translate-y-0.5",
        className
      )}
    >
      {/* EN-TÊTE : Avatar + Nom + Badge service */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {avatar ? (
            <div
              className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-gold/30"
            >
              <Image
                src={avatar}
                alt={name}
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 bg-gold/15 text-gold font-sans">
              {initiales}
            </div>
          )}

          <div>
            <p className="font-medium text-sm text-foreground font-sans">
              {name}
            </p>
            <p className="text-xs mt-0.5 text-foreground/40">
              {role}
            </p>
          </div>
        </div>

        {/* Badge service */}
        {service && (
          <span className="text-[10px] px-2.5 py-1 rounded-full shrink-0 bg-gold/10 text-gold border border-gold/20 font-sans tracking-wider">
            {service}
          </span>
        )}
      </div>

      {/* ÉTOILES */}
      <div className="flex items-center gap-0.5 mb-3">
        {renderStars(rating)}
        <span className="ml-1.5 text-xs font-mono text-foreground/40">
          {rating}/5
        </span>
      </div>

      {/* GUILLEMET DÉCORATIF */}
      <p className="text-5xl leading-none mb-1 -mt-1 select-none text-gold/20 font-serif">
        &quot;
      </p>

      {/* TEXTE DU TÉMOIGNAGE */}
      <blockquote className="text-sm sm:text-base leading-relaxed text-foreground/70 font-serif italic font-light">
        {content}
      </blockquote>

      {/* PIED : Date + Vérifié */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/10">
        <p className="text-xs text-foreground/40">
          {date}
        </p>
        {isVerified && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Avis vérifié</span>
          </div>
        )}
      </div>
    </div>
  );
};

export { TestimonialCard };
export type { TestimonialCardProps };

