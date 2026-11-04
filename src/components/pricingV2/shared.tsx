import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AttributeDef, PricingUnit } from '../../services/pricingV2Service';

export const inputCls =
  'w-full px-3 py-2 bg-ios-gray6 rounded-ios text-sm text-ios-label placeholder:text-ios-gray focus:outline-none focus:ring-2 focus:ring-brand-hover disabled:opacity-50';
export const smallInputCls =
  'px-2 py-1.5 bg-ios-gray6 rounded-lg text-sm text-ios-label placeholder:text-ios-gray focus:outline-none focus:ring-2 focus:ring-brand-hover';

export const Label = ({ children, hint }: { children: ReactNode; hint?: ReactNode }) => (
  <div className="mb-1">
    <span className="text-xs font-medium text-ios-secondary-label">{children}</span>
    {hint && <span className="text-xs text-ios-gray ml-1.5">{hint}</span>}
  </div>
);

export const Section = ({ title, subtitle, children, actions }: { title: string; subtitle?: ReactNode; children: ReactNode; actions?: ReactNode }) => (
  <section className="mb-6">
    <div className="flex items-start justify-between gap-3 mb-2">
      <div>
        <h3 className="text-sm font-semibold text-ios-label">{title}</h3>
        {subtitle && <p className="text-xs text-ios-secondary-label mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
    {children}
  </section>
);

export const Warning = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2 px-3 py-2 rounded-ios bg-ios-orange/10 text-xs text-ios-label">
    <AlertTriangle className="w-4 h-4 text-ios-orange shrink-0 mt-px" />
    <div>{children}</div>
  </div>
);

export const Problems = ({ message, problems }: { message?: string | null; problems?: string[] }) => {
  if (!message && !problems?.length) return null;
  const list = problems?.length ? problems : [message!];
  return (
    <div className="px-3 py-2 rounded-ios bg-ios-red/10 text-xs text-ios-red space-y-0.5">
      {list.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
};

/** Pricing units, explained with what they're for */
export const UNIT_INFO: Record<PricingUnit, { label: string; per: string; examples: string }> = {
  item: { label: 'Per item', per: 'per item', examples: 'Business cards, mugs, T-shirts, chromo codes' },
  sqft: { label: 'Per square foot', per: 'per sq ft', examples: 'Flexi banners, stickers, vinyl, canvas' },
  sqm: { label: 'Per square metre', per: 'per m²', examples: 'Large-format jobs quoted in metres' },
  side: { label: 'Per printed side', per: 'per printed side', examples: 'Document printing — both sides count as two' },
  sheet: { label: 'Per sheet', per: 'per sheet', examples: 'Documents where front & back is one sheet' },
};

export const optionKeysOf = (attributes: AttributeDef[]) =>
  attributes.flatMap((a) => a.options.map((o) => ({ value: `${a.key}:${o.key}`, label: `${a.name}: ${o.name}` })));

export const parseNum = (s: string): number | null => {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
