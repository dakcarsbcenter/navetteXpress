import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  name: string;
  type: string;
  capacity: number;
  features: string[];
  price: string;
  image?: string;
  isAvailable?: boolean;
  isLuxury?: boolean;
  rating?: number;
  onSelect?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  name,
  type,
  capacity,
  features,
  price,
  image,
  isAvailable = true,
  isLuxury = false,
  rating,
  onSelect,
  onViewDetails,
  className
}) => {
  return (
    <Card 
      variant="vehicle" 
      hover 
      className={cn(
        "group relative overflow-hidden",
        !isAvailable && "opacity-60",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
        {image ? (
          <Image 
            src={image} 
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🚗
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {isLuxury && (
            <Badge variant="luxury" size="sm">
              👑 Luxe
            </Badge>
          )}
          {rating && (
            <Badge variant="success" size="sm">
              ⭐ {rating}
            </Badge>
          )}
        </div>
        
        {/* Availability Status */}
        <div className="absolute top-4 right-4">
          <Badge 
            variant={isAvailable ? "success" : "error"} 
            size="sm"
          >
            {isAvailable ? "Disponible" : "Indisponible"}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {name}
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#FF7E38]">
              {price}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              par trajet
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{capacity} passagers</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{type}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Features */}
        <div className="space-y-2 mb-6">
          {features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="w-1.5 h-1.5 bg-[#FF7E38] rounded-full flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
          {features.length > 3 && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              +{features.length - 3} autres équipements
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="space-y-2">
          {isAvailable && onSelect && (
            <Button 
              variant="primary" 
              size="md" 
              className="w-full"
              onClick={onSelect}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Sélectionner
            </Button>
          )}
          
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onViewDetails}
            >
              Voir les détails
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { VehicleCard };
export type { VehicleCardProps };
