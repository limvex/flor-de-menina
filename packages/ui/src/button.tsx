import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded font-medium transition-colors';
  const variants = {
    default: 'bg-amber-900 text-white hover:bg-amber-800',
    outline: 'border border-amber-900 text-amber-900 hover:bg-amber-50',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
