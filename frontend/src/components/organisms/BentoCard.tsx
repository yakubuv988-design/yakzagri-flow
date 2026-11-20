import React from 'react';
import { cn } from '../../lib/utils';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  title,
  subtitle,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'rounded-card shadow-card-subtle bg-white p-6',
        onClick && 'cursor-pointer transition-shadow hover:shadow-card',
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default BentoCard;
