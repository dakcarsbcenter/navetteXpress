import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  color = 'blue',
  className
}) => {
  const colorClasses = {
    blue: {
      icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      trend: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      icon: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
      trend: 'text-green-600 dark:text-green-400'
    },
    orange: {
      icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
      trend: 'text-orange-600 dark:text-orange-400'
    },
    purple: {
      icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
      trend: 'text-purple-600 dark:text-purple-400'
    },
    red: {
      icon: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
      trend: 'text-red-600 dark:text-red-400'
    }
  };

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <svg 
                  className={cn(
                    "w-4 h-4",
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {trend.isPositive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  )}
                </svg>
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  vs mois dernier
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              colorClasses[color].icon
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { StatsCard };
export type { StatsCardProps };
