import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'luxury' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

// Module volontairement sans dependance a des icones/composants : il doit
// pouvoir etre importe depuis un Server Component (via ButtonLink) sans
// tirer de code client-only dans le bundle serveur.
const buttonBaseClasses = "inline-flex items-center justify-center font-semibold rounded font-[family-name:var(--font-archivo)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#1F5245] hover:bg-[#19433B] text-white focus:ring-[#1F5245]/50",
  secondary: "bg-[#B4643A] hover:bg-[#96502D] text-white focus:ring-[#B4643A]/50",
  luxury: "bg-[#12100E] hover:bg-[#2a2620] text-[#F7F3EC] uppercase tracking-wide focus:ring-[#12100E]/50",
  outline: "border border-[#12100E] text-[#12100E] hover:bg-[#12100E] hover:text-[#F7F3EC] focus:ring-[#12100E]/50",
  ghost: "text-[#1F5245] border-b-2 border-[#1F5245] rounded-none hover:text-[#12100E] hover:border-[#12100E] focus:ring-[#1F5245]/50"
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
  xl: "px-10 py-5 text-xl"
};

export function getButtonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(buttonBaseClasses, buttonVariantClasses[variant], buttonSizeClasses[size], className);
}
