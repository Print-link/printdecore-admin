import type { ReactNode } from 'react';

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white rounded-ios shadow-ios ${className}`}>{children}</div>
);
