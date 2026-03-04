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
      primary: "bg-[#FF2C2C] hover:bg-[#E01F1F] text-white shadow-lg hover:shadow-2xl hover:shadow-[rgba(255,44,44,0.3)] hover:-translate-y-0.5 focus:ring-[#FF2C2C]/50",
      secondary: "bg-linear-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E40AF] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-[#3B82F6]/50",
      luxury: "bg-linear-to-r from-[#1E293B] to-[#334155] hover:from-[#334155] hover:to-[#475569] text-white shadow-2xl hover:shadow-3xl hover:-translate-y-1 focus:ring-[#1E293B]/50 uppercase tracking-wide",
      outline: "border-2 border-[#FF2C2C] text-[#FF2C2C] hover:bg-[#FF2C2C] hover:text-white focus:ring-[#FF2C2C]/50",
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

