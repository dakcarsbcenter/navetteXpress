import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from '@/components/icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'luxury' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    children, 
    className, 
    loading = false,
    icon,
    iconPosition = 'left',
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded font-[family-name:var(--font-archivo)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-[#1F5245] hover:bg-[#19433B] text-white focus:ring-[#1F5245]/50",
      secondary: "bg-[#B4643A] hover:bg-[#96502D] text-white focus:ring-[#B4643A]/50",
      luxury: "bg-[#12100E] hover:bg-[#2a2620] text-[#F7F3EC] uppercase tracking-wide focus:ring-[#12100E]/50",
      outline: "border border-[#12100E] text-[#12100E] hover:bg-[#12100E] hover:text-[#F7F3EC] focus:ring-[#12100E]/50",
      ghost: "text-[#1F5245] border-b-2 border-[#1F5245] rounded-none hover:text-[#12100E] hover:border-[#12100E] focus:ring-[#1F5245]/50"
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      xl: "px-10 py-5 text-xl"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

