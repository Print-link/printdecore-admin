import type { ReactNode } from 'react';

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 mb-4">
    <div>
      <h1 className="text-xl font-bold text-ios-label tracking-tight">{title}</h1>
      {subtitle && <div className="text-xs text-ios-secondary-label mt-0.5">{subtitle}</div>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
