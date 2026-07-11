import type { ReactNode } from 'react';

export const iosInputCls =
  'w-full px-3 py-2 bg-ios-gray6 border-none rounded-ios text-sm text-ios-label placeholder:text-ios-gray focus:outline-none focus:ring-2 focus:ring-brand-hover';

export const FormField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-ios-secondary-label block mb-1">{label}</label>
    {children}
  </div>
);
