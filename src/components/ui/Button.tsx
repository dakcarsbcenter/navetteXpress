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
    const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-gradient-to-r from-[#FF7E38] to-[#E6682F] hover:from-[#E6682F] hover:to-[#D4571F] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-[#FF7E38]/50",
      secondary: "bg-gradient-to-r from-[#0F5B8A] to-[#0A4B73] hover:from-[#0A4B73] hover:to-[#083A5C] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-[#0F5B8A]/50",
      luxury: "bg-gradient-to-r from-[#1E293B] to-[#334155] hover:from-[#334155] hover:to-[#475569] text-white shadow-2xl hover:shadow-3xl hover:-translate-y-1 focus:ring-[#1E293B]/50 uppercase tracking-wide",
      outline: "border-2 border-[#0F5B8A] text-[#0F5B8A] hover:bg-[#0F5B8A] hover:text-white focus:ring-[#0F5B8A]/50",
      ghost: "text-[#1E293B] hover:bg-[#F1F5F9] hover:text-[#1E293B] focus:ring-[#64748B]/50"
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
