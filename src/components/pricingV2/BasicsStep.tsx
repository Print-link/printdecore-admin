import type { DefinitionInput, PricingUnit } from '../../services/pricingV2Service';
import { Label, Section, UNIT_INFO, inputCls, parseNum } from './shared';

const UNITS: PricingUnit[] = ['item', 'sqft', 'sqm', 'side', 'sheet'];

/** Today's formula → the unit it becomes, so the editor can suggest one */
const SUGGESTED: Record<string, PricingUnit> = {
  AREA_FEET: 'sqft',
  AREA_INCH: 'sqft',
  UNIT_ONLY: 'item',
  AREA_OR_UNIT: 'item',
  PAGE_BASED: 'sheet',
};

export function BasicsStep({
  def,
  onChange,
  formulaType,
}: {
  def: DefinitionInput;
  onChange: (d: DefinitionInput) => void;
  formulaType?: string;
}) {
  const suggested = formulaType ? SUGGESTED[formulaType] : undefined;
  const art = (def.artworkSpec ?? {}) as { fileTypes?: string[]; minDpi?: number; bleedMm?: number };
  const setArt = (patch: Partial<typeof art>) => onChange({ ...def, artworkSpec: { ...art, ...patch } });

  return (
    <div>
      <Section title="What one price applies to" subtitle="Every price in the price list is for one of these. Pick how print shops quote this product.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {UNITS.map((u) => {
            const active = def.pricingUnit === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => onChange({ ...def, pricingUnit: u })}
                className={`text-left px-3 py-2.5 rounded-ios border transition-colors ${
                  active ? 'border-brand-hover bg-brand/10' : 'border-ios-gray5 hover:bg-ios-gray6'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ios-label">{UNIT_INFO[u].label}</span>
                  {suggested === u && <span className="text-[11px] text-brand-hover font-medium">Suggested</span>}
                </div>
                <p className="text-xs text-ios-secondary-label mt-0.5">{UNIT_INFO[u].examples}</p>
              </button>
            );
          })}
        </div>
        {formulaType && <p className="text-xs text-ios-gray mt-2">Priced today with the {formulaType.replace(/_/g, ' ').toLowerCase()} formula.</p>}
      </Section>

      <Section title="Quantity" subtitle="Leave blank for no limit.">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Smallest order</Label>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={def.limits.minQuantity ?? ''}
              placeholder="1"
              onChange={(e) => onChange({ ...def, limits: { ...def.limits, minQuantity: parseNum(e.target.value) } })}
            />
          </div>
          <div>
            <Label>Largest order</Label>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={def.limits.maxQuantity ?? ''}
              placeholder="No limit"
              onChange={(e) => onChange({ ...def, limits: { ...def.limits, maxQuantity: parseNum(e.target.value) } })}
            />
          </div>
        </div>
      </Section>

      <Section title="Artwork" subtitle="Simple checks before a customer sends their file.">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>File types</Label>
            <input
              className={inputCls}
              value={(art.fileTypes ?? []).join(', ')}
              placeholder="pdf, png, jpg"
              onChange={(e) =>
                setArt({ fileTypes: e.target.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) })
              }
            />
          </div>
          <div>
            <Label hint="at print size">Minimum DPI</Label>
            <input type="number" min="0" className={inputCls} value={art.minDpi ?? ''} placeholder="—" onChange={(e) => setArt({ minDpi: parseNum(e.target.value) ?? undefined })} />
          </div>
          <div>
            <Label>Bleed (mm)</Label>
            <input type="number" min="0" step="0.5" className={inputCls} value={art.bleedMm ?? ''} placeholder="—" onChange={(e) => setArt({ bleedMm: parseNum(e.target.value) ?? undefined })} />
          </div>
        </div>
      </Section>
    </div>
  );
}
