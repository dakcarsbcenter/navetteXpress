import React from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
  price?: string;
  priceNote?: string;
  isPopular?: boolean;
  isAvailable?: boolean;
  onBook?: () => void;
  onLearnMore?: () => void;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon,
  features,
  price,
  priceNote,
  isPopular = false,
  isAvailable = true,
  onBook,
  onLearnMore,
  className
}) => {
  return (
    <Card 
      variant="service" 
      hover 
      className={cn(
        "relative h-full flex flex-col",
        isPopular && "ring-2 ring-orange-500 shadow-2xl",
        !isAvailable && "opacity-60",
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="luxury" size="md">
            ⭐ Plus Populaire
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center text-3xl">
          {icon}
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {description}
        </p>
        
        {price && (
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {price}
            </div>
            {priceNote && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {priceNote}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {feature}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-auto space-y-3">
          {!isAvailable && (
            <Badge variant="error" size="sm" className="w-full justify-center">
              Temporairement indisponible
            </Badge>
          )}
          
          {isAvailable && onBook && (
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full"
              onClick={onBook}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              Réserver Maintenant
            </Button>
          )}
          
          {onLearnMore && (
            <Button 
              variant="outline" 
              size="md" 
              className="w-full"
              onClick={onLearnMore}
            >
              En savoir plus
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { ServiceCard };
export type { ServiceCardProps };
