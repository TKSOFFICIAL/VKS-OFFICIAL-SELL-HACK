import React from 'react';

interface CutCornerCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'blue' | 'white' | 'red' | 'green' | 'dark';
  glow?: boolean;
  size?: 'normal' | 'large' | 'small';
}

export const CutCornerCard: React.FC<CutCornerCardProps> = ({
  children,
  className = '',
  variant = 'white',
  glow = false,
  size = 'normal'
}) => {
  const roundedClass = size === 'large' 
    ? 'rounded-3xl' 
    : size === 'small' 
    ? 'rounded-xl' 
    : 'rounded-2xl';

  // Pure Luxury White & Blue Theme Card
  let borderStyle = 'border-2 border-[#ddd6fe]';
  let innerBg = 'bg-white';
  let shadowStyle = glow 
    ? 'shadow-[0_15px_35px_rgba(59,130,246,0.15)]' 
    : 'shadow-[0_8px_20px_rgba(139,92,246,0.08)]';
  let textColor = 'text-slate-800';

  if (variant === 'blue') {
    borderStyle = 'border-2 border-blue-300';
    innerBg = 'bg-gradient-to-br from-white to-blue-50/70';
    shadowStyle = 'shadow-[0_12px_30px_rgba(37,99,235,0.12)]';
  } else if (variant === 'red') {
    borderStyle = 'border-2 border-rose-300';
    innerBg = 'bg-gradient-to-br from-white to-rose-50/60';
    shadowStyle = 'shadow-[0_10px_25px_rgba(244,63,94,0.12)]';
  } else if (variant === 'green') {
    borderStyle = 'border-2 border-emerald-300';
    innerBg = 'bg-gradient-to-br from-white to-emerald-50/60';
    shadowStyle = 'shadow-[0_10px_25px_rgba(16,185,129,0.12)]';
  }

  return (
    <div className={`relative ${roundedClass} ${borderStyle} ${innerBg} ${shadowStyle} p-4 sm:p-5 ${textColor} transition-all ${className}`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
