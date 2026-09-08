import React from 'react';
import { Link } from '@/i18n/navigation';
import { getButtonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/button-classes';

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * CTA de simple navigation stylé comme <Button>, mais rendu en <Link>.
 * Utilisable depuis un Server Component : aucune hydratation/JS client
 * requise pour naviguer (contrairement a un onClick={() => router.push(...)}).
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  children,
  className,
  icon,
  iconPosition = 'left',
}: ButtonLinkProps) {
  return (
    <Link href={href} className={getButtonClasses(variant, size, className)}>
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </Link>
  );
}
