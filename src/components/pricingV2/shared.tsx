import { useId, useState, type ReactNode } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import type { AttributeDef, PricingUnit } from '../../services/pricingV2Service';

export const inputCls =
  'w-full px-3 py-2 bg-ios-gray6 rounded-ios text-sm text-ios-label placeholder:text-ios-gray focus:outline-none focus:ring-2 focus:ring-brand-hover disabled:opacity-50';
export const smallInputCls =
  'px-2 py-1.5 bg-ios-gray6 rounded-lg text-sm text-ios-label placeholder:text-ios-gray focus:outline-none focus:ring-2 focus:ring-brand-hover';

/** A ? icon that explains a field; opens on hover, tap or keyboard focus */
export const InfoTip = ({ children, label = 'More info', align = 'center' }: { children: ReactNode; label?: string; align?: 'center' | 'start' | 'end' }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const position = { center: 'left-1/2 -translate-x-1/2', start: 'left-0', end: 'right-0' }[align];
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="text-ios-gray hover:text-ios-secondary-label cursor-help rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-hover"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span id={id} role="tooltip"
          className={`absolute z-50 bottom-full ${position} mb-2 w-64 p-2.5 rounded-lg shadow-lg border border-ios-gray5 bg-white text-xs font-normal leading-relaxed text-ios-label text-left whitespace-normal`}>
          {children}
        </span>
      )}
    </span>
  );
};

export const Label = ({ children, hint, tip, tipAlign }: { children: ReactNode; hint?: ReactNode; tip?: ReactNode; tipAlign?: 'center' | 'start' | 'end' }) => (
  <div className="mb-1 flex items-center gap-1">
    <span className="text-xs font-medium text-ios-secondary-label">{children}</span>
    {tip && <InfoTip label={`About ${typeof children === 'string' ? children.toLowerCase() : 'this field'}`} align={tipAlign}>{tip}</InfoTip>}
    {hint && <span className="text-xs text-ios-gray ml-0.5">{hint}</span>}
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
