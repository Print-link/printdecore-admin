import type { ReactNode } from 'react';

type Variant = 'success' | 'neutral' | 'warning' | 'danger';

const variantCls: Record<Variant, string> = {
  success: 'bg-ios-green/15 text-ios-green',
  neutral: 'bg-ios-gray5 text-ios-secondary-label',
  warning: 'bg-ios-orange/15 text-ios-orange',
  danger: 'bg-ios-red/15 text-ios-red',
};

export const Badge = ({ variant = 'neutral', children }: { variant?: Variant; children: ReactNode }) => (
  <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${variantCls[variant]}`}>
    {children}
  </span>
);
