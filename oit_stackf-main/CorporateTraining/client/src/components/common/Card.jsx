import React from 'react';

const Card = ({
  children,
  className = '',
  hover = true,
  glass = false,
  onClick,
  padding = 'p-6',
  ...props
}) => {
  const baseStyle = 'rounded-2xl border transition-all duration-300';

  const glassStyle = glass
    ? 'bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-white/20 dark:border-slate-800/50'
    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80';

  const hoverStyle = hover
    ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-none hover:border-slate-200 dark:hover:border-slate-700/60'
    : 'shadow-sm';

  const clickableStyle = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${glassStyle} ${hoverStyle} ${clickableStyle} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

