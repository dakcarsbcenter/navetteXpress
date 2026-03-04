import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'luxury' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', children, className, icon, ...props }, ref) => {
    const baseClasses = "inline-flex items-center font-medium rounded-full transition-colors duration-200";
    
    const variants = {
      default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
      success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      error: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      luxury: "bg-linear-to-r from-slate-900 to-slate-800 text-white shadow-lg",
      outline: "border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
    };
    
    const sizes = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-base"
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };

