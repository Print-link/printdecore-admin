import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantCls: Record<Variant, string> = {
  primary: 'bg-brand text-ios-label hover:bg-brand-hover disabled:opacity-40',
  secondary: 'bg-ios-gray6 text-ios-label hover:bg-ios-gray5 disabled:opacity-40',
  destructive: 'bg-ios-red/10 text-ios-red hover:bg-ios-red/15 disabled:opacity-40',
  ghost: 'text-brand-hover hover:bg-brand/10 disabled:opacity-40',
};

const sizeCls: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export const Button = ({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors ${variantCls[variant]} ${sizeCls[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
