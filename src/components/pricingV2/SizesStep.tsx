import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AttributeDef, DefinitionInput, Limits, OptionDef, SizeMode, SizePreset } from '../../services/pricingV2Service';
import { LENGTH_UNITS, equivalents, fmtArea, fmtLength, fromMm, toKey, toMm, wrongUnitHint, type LengthUnit } from '../../utils/units';
import { Button } from '../ui/Button';
import { Label, Section, UNIT_INFO, Warning, inputCls, parseNum, smallInputCls } from './shared';

const MODES: { mode: SizeMode; label: string; help: string }[] = [
  { mode: 'none', label: 'No sizes', help: 'One size, or size doesn’t change the price' },
  { mode: 'preset', label: 'Set sizes', help: 'Customers pick from a list (A4, A3, 85 × 55 mm …)' },
  { mode: 'custom', label: 'Any size', help: 'Customers enter width and height within limits' },
  { mode: 'both', label: 'Set sizes or any size', help: 'A list, plus “custom size”' },
];

/** The pick-one choice whose options are sizes: "size", else a converted product's "base" */
export const sizeAttributeOf = (attributes: AttributeDef[]) =>
  attributes.find((a) => a.key === 'size') ?? attributes.find((a) => a.key === 'base' && a.selection === 'one');

/** An option's dimensions: from the size library when linked, else its own specs */
export const optionSize = (o: OptionDef, library: SizePreset[]) => {
  const lib = o.sizeKey ? library.find((s) => s.key === o.sizeKey) : undefined;
  const w = lib?.widthMm ?? o.specs?.widthMm;
  const h = lib?.heightMm ?? o.specs?.heightMm;
  return w && h ? { widthMm: w, heightMm: h } : null;
};

export function SizesStep({
  def,
  onChange,
  library,
  onAddToLibrary,
}: {
  def: DefinitionInput;
  onChange: (d: DefinitionInput) => void;
  library: SizePreset[];
  onAddToLibrary: (s: { key: string; name: string; widthMm: number; heightMm: number }) => Promise<void>;
}) {
  const [unit, setUnit] = useState<LengthUnit>(def.pricingUnit === 'sqft' ? 'ft' : 'mm');
  const sizeAttr = sizeAttributeOf(def.attributes);
  const showPresets = def.sizeMode === 'preset' || def.sizeMode === 'both';
  const showCustom = def.sizeMode === 'custom' || def.sizeMode === 'both';
  const area = def.pricingUnit === 'sqft' || def.pricingUnit === 'sqm';

  const setSizeAttr = (next: AttributeDef) =>
    onChange({ ...def, attributes: def.attributes.map((a) => (a.key === next.key ? next : a)) });
  const addSizeChoice = () =>
    onChange({
      ...def,
      attributes: [{ key: 'size', name: 'Size', selection: 'one', required: true, defaultOptionKeys: [], options: [] }, ...def.attributes],
    });
  const addOption = (o: OptionDef) => {
    if (!sizeAttr) return;
    if (sizeAttr.options.some((x) => x.key === o.key)) return;
    setSizeAttr({
      ...sizeAttr,
      options: [...sizeAttr.options, o],
      defaultOptionKeys: sizeAttr.defaultOptionKeys.length ? sizeAttr.defaultOptionKeys : [o.key],
    });
  };
  const removeOption = (key: string) =>
    sizeAttr &&
    setSizeAttr({
      ...sizeAttr,
      options: sizeAttr.options.filter((o) => o.key !== key),
      defaultOptionKeys: sizeAttr.defaultOptionKeys.filter((k) => k !== key),
    });
  const updateOption = (key: string, patch: Partial<OptionDef>) =>
    sizeAttr && setSizeAttr({ ...sizeAttr, options: sizeAttr.options.map((o) => (o.key === key ? { ...o, ...patch } : o)) });

  const setLimit = (k: keyof Limits, v: number | null) => onChange({ ...def, limits: { ...def.limits, [k]: v } });

  return (
    <div>
      <Section title="How sizes work">
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => onChange({ ...def, sizeMode: m.mode })}
              className={`text-left px-3 py-2.5 rounded-ios border ${
                def.sizeMode === m.mode ? 'border-brand-hover bg-brand/10' : 'border-ios-gray5 hover:bg-ios-gray6'
              }`}
            >
              <span className="text-sm font-medium text-ios-label">{m.label}</span>
              <p className="text-xs text-ios-secondary-label mt-0.5">{m.help}</p>
            </button>
          ))}
        </div>
        {area && def.sizeMode === 'none' && <div className="mt-2"><Warning>Priced by area needs sizes — choose set sizes, any size, or both.</Warning></div>}
      </Section>

      {def.sizeMode !== 'none' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-ios-secondary-label">Show sizes in</span>
          <div className="inline-flex p-0.5 bg-ios-gray5 rounded-full">
            {LENGTH_UNITS.map((u) => (
              <button
                key={u.unit}
                type="button"
                onClick={() => setUnit(u.unit)}
                className={`px-3 py-1 text-xs font-medium rounded-full ${unit === u.unit ? 'bg-white shadow-ios text-ios-label' : 'text-ios-secondary-label'}`}
              >
                {u.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-ios-gray">Stored in millimetres; every unit is shown underneath.</span>
        </div>
      )}

      {showPresets && (
        <Section
          title="Set sizes"
          subtitle={sizeAttr ? `Customers choose these under “${sizeAttr.name}”.` : 'Add a size choice to list sizes.'}
        >
          {!sizeAttr ? (
            <Button variant="secondary" size="sm" onClick={addSizeChoice}>
              <Plus className="w-3.5 h-3.5" /> Add a size choice
            </Button>
          ) : (
            <>
              <div className="rounded-ios border border-ios-gray5 divide-y divide-ios-gray5 mb-3">
                {sizeAttr.options.length === 0 && <p className="px-3 py-3 text-xs text-ios-secondary-label">No sizes yet — add from the library or enter one.</p>}
                {sizeAttr.options.map((o) => (
                  <SizeRow
                    key={o.key}
                    option={o}
                    unit={unit}
                    library={library}
                    isDefault={sizeAttr.defaultOptionKeys.includes(o.key)}
                    onDefault={() => setSizeAttr({ ...sizeAttr, defaultOptionKeys: [o.key] })}
                    onChange={(patch) => updateOption(o.key, patch)}
                    onRemove={() => removeOption(o.key)}
                    onSaveToLibrary={onAddToLibrary}
                    needsDimensions={area}
                  />
                ))}
              </div>
              <AddSize unit={unit} library={library} existing={sizeAttr.options.map((o) => o.key)} onAdd={addOption} />
            </>
          )}
        </Section>
      )}

      {showCustom && (
        <Section title="Any size — limits" subtitle="What a customer may enter. Leave blank for no limit.">
          <div className="grid grid-cols-2 gap-3">
            <LengthInput label="Smallest width" mm={def.limits.minWidthMm} unit={unit} onChange={(v) => setLimit('minWidthMm', v)} />
            <LengthInput label="Largest width" mm={def.limits.maxWidthMm} unit={unit} onChange={(v) => setLimit('maxWidthMm', v)} />
            <LengthInput label="Smallest height" mm={def.limits.minHeightMm} unit={unit} onChange={(v) => setLimit('minHeightMm', v)} />
            <LengthInput label="Largest height" mm={def.limits.maxHeightMm} unit={unit} onChange={(v) => setLimit('maxHeightMm', v)} />
            <LengthInput label="Steps of" mm={def.limits.stepMm} unit={unit} onChange={(v) => setLimit('stepMm', v)} />
            {def.sizeMode === 'both' && (
              <div>
                <Label>A custom size is priced</Label>
                <select
                  className={inputCls}
                  value={def.customPricingUnit ?? def.pricingUnit}
                  onChange={(e) => onChange({ ...def, customPricingUnit: e.target.value as DefinitionInput['pricingUnit'] })}
                >
                  {(['sqft', 'sqm', 'item'] as const).map((u) => (
                    <option key={u} value={u}>{UNIT_INFO[u].per}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function SizeRow({
  option,
  unit,
  library,
  isDefault,
  onDefault,
  onChange,
  onRemove,
  onSaveToLibrary,
  needsDimensions,
}: {
  option: OptionDef;
  unit: LengthUnit;
  library: SizePreset[];
  isDefault: boolean;
  onDefault: () => void;
  onChange: (patch: Partial<OptionDef>) => void;
  onRemove: () => void;
  onSaveToLibrary: (s: { key: string; name: string; widthMm: number; heightMm: number }) => Promise<void>;
  needsDimensions: boolean;
}) {
  const size = optionSize(option, library);
  const linked = !!option.sizeKey && library.some((s) => s.key === option.sizeKey);
  const inLibrary = library.some((s) => s.key === option.key);
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-3">
        <input type="radio" checked={isDefault} onChange={onDefault} title="Selected by default" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ios-label">
            {option.name} {linked && <span className="text-[11px] text-ios-gray font-normal">· from the size library</span>}
          </p>
          {size ? (
            <p className="text-xs text-ios-secondary-label">
              <span className="text-ios-label">{fmtLength(size.widthMm, unit)} × {fmtLength(size.heightMm, unit)} {unit}</span>
              {' · '}{equivalents(size.widthMm, size.heightMm, unit)} · {fmtArea(size.widthMm, size.heightMm)}
            </p>
          ) : (
            <p className={`text-xs ${needsDimensions ? 'text-ios-orange' : 'text-ios-gray'}`}>
              No dimensions{needsDimensions ? ' — needed to price by area' : ''}
            </p>
          )}
        </div>
        {!linked && size && !inLibrary && (
          <Button variant="ghost" size="sm" onClick={() => onSaveToLibrary({ key: option.key, name: option.name, ...size })}>
            Save to library
          </Button>
        )}
        <button type="button" onClick={onRemove} className="p-1.5 rounded-full hover:bg-ios-red/10 text-ios-red" aria-label={`Remove ${option.name}`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {!linked && (
        <div className="flex items-center gap-2 mt-2 pl-6">
          <DimInput mm={option.specs?.widthMm} unit={unit} placeholder="Width" onChange={(w) => onChange({ specs: { ...option.specs, widthMm: w ?? undefined } })} />
          <span className="text-xs text-ios-gray">×</span>
          <DimInput mm={option.specs?.heightMm} unit={unit} placeholder="Height" onChange={(h) => onChange({ specs: { ...option.specs, heightMm: h ?? undefined } })} />
          <span className="text-xs text-ios-gray">{unit}</span>
          <select
            className={`${smallInputCls} ml-auto`}
            value=""
            onChange={(e) => e.target.value && onChange({ sizeKey: e.target.value })}
          >
            <option value="">Link to a library size…</option>
            {library.map((s) => (
              <option key={s.key} value={s.key}>{s.name} ({fmtLength(s.widthMm, unit)} × {fmtLength(s.heightMm, unit)} {unit})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function AddSize({ unit, library, existing, onAdd }: { unit: LengthUnit; library: SizePreset[]; existing: string[]; onAdd: (o: OptionDef) => void }) {
  const [name, setName] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const hint = wrongUnitHint(Number(w), unit) || wrongUnitHint(Number(h), unit);
  const wMm = w ? toMm(Number(w), unit) : 0;
  const hMm = h ? toMm(Number(h), unit) : 0;
  const available = library.filter((s) => !existing.includes(s.key));

  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <Label>Add from the size library</Label>
        <select
          className={inputCls}
          value=""
          onChange={(e) => {
            const s = library.find((x) => x.key === e.target.value);
            if (s) onAdd({ key: s.key, name: s.name, sizeKey: s.key });
          }}
        >
          <option value="">Choose a size…</option>
          {available.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name} — {fmtLength(s.widthMm, unit)} × {fmtLength(s.heightMm, unit)} {unit}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Or enter a size</Label>
        <div className="flex items-center gap-2">
          <input className={`${inputCls} flex-1`} placeholder="Name, e.g. Roll-up 85 × 200" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={`${inputCls} w-24`} type="number" min="0" step="any" placeholder="Width" value={w} onChange={(e) => setW(e.target.value)} />
          <span className="text-xs text-ios-gray">×</span>
          <input className={`${inputCls} w-24`} type="number" min="0" step="any" placeholder="Height" value={h} onChange={(e) => setH(e.target.value)} />
          <span className="text-xs text-ios-gray w-5">{unit}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!name.trim() || !(wMm > 0 && hMm > 0)}
            onClick={() => {
              onAdd({ key: toKey(name), name: name.trim(), specs: { widthMm: Number(wMm.toFixed(2)), heightMm: Number(hMm.toFixed(2)) } });
              setName('');
              setW('');
              setH('');
            }}
          >
            Add
          </Button>
        </div>
        {wMm > 0 && hMm > 0 && <p className="text-xs text-ios-secondary-label mt-1">{equivalents(wMm, hMm, unit)} · {fmtArea(wMm, hMm)}</p>}
        {hint && <div className="mt-2"><Warning>{hint}</Warning></div>}
      </div>
    </div>
  );
}

function DimInput({ mm, unit, placeholder, onChange }: { mm?: number | null; unit: LengthUnit; placeholder: string; onChange: (mm: number | null) => void }) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      className={`${smallInputCls} w-20`}
      placeholder={placeholder}
      value={mm ? Number(fromMm(mm, unit).toFixed(unit === 'mm' ? 1 : 2)) : ''}
      onChange={(e) => {
        const v = parseNum(e.target.value);
        onChange(v === null ? null : Number(toMm(v, unit).toFixed(2)));
      }}
    />
  );
}

function LengthInput({ label, mm, unit, onChange }: { label: string; mm?: number | null; unit: LengthUnit; onChange: (mm: number | null) => void }) {
  const shown = mm ? Number(fromMm(mm, unit).toFixed(unit === 'mm' ? 1 : 2)) : '';
  const hint = mm ? wrongUnitHint(Number(shown), unit) : null;
  return (
    <div>
      <Label hint={unit}>{label}</Label>
      <input
        type="number"
        min="0"
        step="any"
        className={inputCls}
        placeholder="—"
        value={shown}
        onChange={(e) => {
          const v = parseNum(e.target.value);
          onChange(v === null ? null : Number(toMm(v, unit).toFixed(2)));
        }}
      />
      {mm ? (
        <p className="text-[11px] text-ios-secondary-label mt-1">
          {LENGTH_UNITS.filter((u) => u.unit !== unit).map((u) => `${fmtLength(mm, u.unit)} ${u.unit}`).join(' · ')}
        </p>
      ) : null}
      {hint && <p className="text-[11px] text-ios-orange mt-0.5">{hint}</p>}
    </div>
  );
}
