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
        className={cn(
          "w-4 h-4",
          index < rating 
            ? "text-yellow-400 fill-current" 
            : "text-gray-300 dark:text-gray-600"
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <Card 
      variant="testimonial" 
      className={cn("h-full", className)}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              {avatar ? (
                <div className="relative w-full h-full">
                  <Image 
                    src={avatar} 
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {name}
                </h4>
                {isVerified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {role}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              {renderStars(rating)}
            </div>
            {date && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {date}
              </p>
            )}
          </div>
        </div>
        
        {/* Service Badge */}
        {service && (
          <div className="mb-4">
            <Badge variant="info" size="sm">
              {service}
            </Badge>
          </div>
        )}
        
        {/* Content */}
        <blockquote className="text-slate-700 dark:text-slate-300 leading-relaxed">
          &quot;{content}&quot;
        </blockquote>
        
        {/* Quote Icon */}
        <div className="mt-4 flex justify-end">
          <svg className="w-6 h-6 text-blue-200 dark:text-blue-800" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V8a1 1 0 112 0v2.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export { TestimonialCard };
export type { TestimonialCardProps };

