import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { AttributeDef, DefinitionInput, OptionDef, RuleDef } from '../../services/pricingV2Service';
import { toKey } from '../../utils/units';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Label, Section, Warning, inputCls, optionKeysOf, parseNum, smallInputCls } from './shared';
import { sizeAttributeOf } from './SizesStep';

export function OptionsStep({
  def,
  onChange,
  converted,
}: {
  def: DefinitionInput;
  onChange: (d: DefinitionInput) => void;
  /** Set up from today's options: renaming keys breaks app versions that send the old ones */
  converted: boolean;
}) {
  const sizeKey = def.sizeMode === 'preset' || def.sizeMode === 'both' ? sizeAttributeOf(def.attributes)?.key : undefined;
  const setAttr = (i: number, a: AttributeDef) => onChange({ ...def, attributes: def.attributes.map((x, j) => (j === i ? a : x)) });
  const move = (i: number, d: -1 | 1) => {
    const next = [...def.attributes];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...def, attributes: next });
  };
  const addAttr = () => {
    let key = 'choice';
    for (let n = 2; def.attributes.some((a) => a.key === key); n++) key = `choice_${n}`;
    onChange({ ...def, attributes: [...def.attributes, { key, name: '', selection: 'one', required: true, defaultOptionKeys: [], options: [] }] });
  };

  return (
    <div>
      {converted && (
        <div className="mb-4">
          <Warning>
            These choices came from the product’s current setup. Keep their keys until the app’s new configurator ships — the
            current app sends them when customers order.
          </Warning>
        </div>
      )}

      <Section
        title="Choices"
        subtitle="Each is a question the customer answers — paper, sides, finishing, turnaround."
        actions={<Button variant="secondary" size="sm" onClick={addAttr}><Plus className="w-3.5 h-3.5" /> Add a choice</Button>}
      >
        <div className="space-y-3">
          {def.attributes.length === 0 && <p className="text-xs text-ios-secondary-label">No choices — every order is the same product.</p>}
          {def.attributes.map((a, i) => (
            <AttributeCard
              key={i}
              attr={a}
              isSize={a.key === sizeKey}
              keyLocked={converted}
              onChange={(next) => setAttr(i, next)}
              onRemove={() => onChange({ ...def, attributes: def.attributes.filter((_, j) => j !== i) })}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
            />
          ))}
        </div>
      </Section>

      <RulesSection def={def} onChange={onChange} />

      <Section title="What customers see">
        <div className="rounded-ios border border-ios-gray5 p-4 space-y-4 bg-ios-gray6">
          {def.attributes.map((a) => (
            <div key={a.key}>
              <p className="text-xs font-semibold text-ios-label mb-1.5">
                {a.name || 'Untitled'} {!a.required && <span className="font-normal text-ios-gray">· optional</span>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {a.options.map((o) => (
                  <span
                    key={o.key}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      a.defaultOptionKeys.includes(o.key) ? 'bg-white border-brand-hover text-ios-label' : 'bg-white border-ios-gray5 text-ios-secondary-label'
                    }`}
                  >
                    {a.selection === 'any' ? '☐ ' : ''}{o.name || o.key}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {def.attributes.length === 0 && <p className="text-xs text-ios-secondary-label">Just quantity.</p>}
        </div>
      </Section>
    </div>
  );
}

function AttributeCard({
  attr,
  isSize,
  keyLocked,
  onChange,
  onRemove,
  onUp,
  onDown,
}: {
  attr: AttributeDef;
  isSize: boolean;
  keyLocked: boolean;
  onChange: (a: AttributeDef) => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const setOption = (j: number, o: OptionDef) => onChange({ ...attr, options: attr.options.map((x, k) => (k === j ? o : x)) });
  const toggleDefault = (key: string) => {
    const has = attr.defaultOptionKeys.includes(key);
    const next = attr.selection === 'one' ? (has ? [] : [key]) : has ? attr.defaultOptionKeys.filter((k) => k !== key) : [...attr.defaultOptionKeys, key];
    onChange({ ...attr, defaultOptionKeys: next });
  };

  return (
    <div className="rounded-ios border border-ios-gray5">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-ios-gray5 bg-ios-gray6 rounded-t-ios">
        <input
          className={`${smallInputCls} flex-1 font-medium bg-white`}
          placeholder="Name, e.g. Paper"
          value={attr.name}
          onChange={(e) => {
            const name = e.target.value;
            // A new choice's key follows its name until it's saved
            const followKey = !keyLocked && (attr.key === toKey(attr.name) || attr.key.startsWith('choice'));
            onChange({ ...attr, name, ...(followKey && name && { key: toKey(name) }) });
          }}
        />
        <input
          className={`${smallInputCls} w-32 font-mono text-xs bg-white`}
          value={attr.key}
          disabled={keyLocked || isSize}
          title="Key — orders and price lists refer to it"
          onChange={(e) => onChange({ ...attr, key: toKey(e.target.value) })}
        />
        <select
          className={`${smallInputCls} bg-white`}
          value={attr.selection}
          disabled={isSize}
          onChange={(e) => {
            const selection = e.target.value as AttributeDef['selection'];
            onChange({ ...attr, selection, defaultOptionKeys: selection === 'one' ? attr.defaultOptionKeys.slice(0, 1) : attr.defaultOptionKeys });
          }}
        >
          <option value="one">Pick one</option>
          <option value="any">Pick any</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-ios-secondary-label">
          <Switch checked={attr.required} onChange={() => onChange({ ...attr, required: !attr.required })} /> Required
        </label>
        <button type="button" className="p-1 rounded hover:bg-ios-gray5" onClick={onUp} aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
        <button type="button" className="p-1 rounded hover:bg-ios-gray5" onClick={onDown} aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
        <button type="button" className="p-1 rounded hover:bg-ios-red/10 text-ios-red" onClick={onRemove} aria-label="Remove choice"><Trash2 className="w-4 h-4" /></button>
      </div>
      {isSize && <p className="px-3 pt-2 text-xs text-ios-secondary-label">These are the product’s sizes — edit their dimensions in the Sizes step.</p>}
      <div className="divide-y divide-ios-gray5">
        {attr.options.map((o, j) => (
          <div key={j} className="flex items-center gap-2 px-3 py-2">
            <input
              type={attr.selection === 'one' ? 'radio' : 'checkbox'}
              checked={attr.defaultOptionKeys.includes(o.key)}
              onChange={() => toggleDefault(o.key)}
              title="Selected by default"
            />
            <input
              className={`${smallInputCls} flex-1`}
              placeholder="Option name"
              value={o.name}
              onChange={(e) => {
                const name = e.target.value;
                const followKey = !keyLocked && (o.key === toKey(o.name) || o.key.startsWith('option'));
                setOption(j, { ...o, name, ...(followKey && name && { key: toKey(name) }) });
              }}
            />
            <input
              className={`${smallInputCls} w-32 font-mono text-xs`}
              value={o.key}
              disabled={keyLocked}
              onChange={(e) => setOption(j, { ...o, key: toKey(e.target.value) })}
            />
            <select
              className={smallInputCls}
              value={o.specs?.sides ?? ''}
              title="Printed sides — decides per-side prices and sheets"
              onChange={(e) => {
                const sides = parseNum(e.target.value);
                const specs = { ...(o.specs ?? {}) };
                if (sides) specs.sides = sides;
                else delete specs.sides;
                setOption(j, { ...o, specs });
              }}
            >
              <option value="">Sides —</option>
              <option value="1">1 side</option>
              <option value="2">2 sides</option>
            </select>
            <button
              type="button"
              className="p-1 rounded hover:bg-ios-red/10 text-ios-red"
              onClick={() =>
                onChange({ ...attr, options: attr.options.filter((_, k) => k !== j), defaultOptionKeys: attr.defaultOptionKeys.filter((k) => k !== o.key) })
              }
              aria-label="Remove option"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              let key = 'option';
              for (let n = 2; attr.options.some((o) => o.key === key); n++) key = `option_${n}`;
              onChange({ ...attr, options: [...attr.options, { key, name: '' }] });
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add option
          </Button>
        </div>
      </div>
    </div>
  );
}

function RulesSection({ def, onChange }: { def: DefinitionInput; onChange: (d: DefinitionInput) => void }) {
  const options = optionKeysOf(def.attributes);
  const setRule = (i: number, r: RuleDef) => onChange({ ...def, rules: def.rules.map((x, j) => (j === i ? r : x)) });
  return (
    <Section
      title="Rules"
      subtitle="Stop combinations a shop can’t make — the customer sees the reason."
      actions={
        <Button variant="secondary" size="sm" disabled={!options.length} onClick={() => onChange({ ...def, rules: [...def.rules, { kind: 'requires', optionKey: options[0]?.value, targetOptionKey: options[1]?.value ?? options[0]?.value }] })}>
          <Plus className="w-3.5 h-3.5" /> Add a rule
        </Button>
      }
    >
      {def.rules.length === 0 && <p className="text-xs text-ios-secondary-label">No rules.</p>}
      <div className="space-y-2">
        {def.rules.map((r, i) => (
          <div key={i} className="rounded-ios border border-ios-gray5 px-3 py-2 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className={smallInputCls}
                value={r.optionKey ?? ''}
                onChange={(e) => setRule(i, { ...r, optionKey: e.target.value || null })}
              >
                {r.kind === 'quantity' && <option value="">The whole product</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                className={smallInputCls}
                value={r.kind}
                onChange={(e) => setRule(i, { ...r, kind: e.target.value as RuleDef['kind'] })}
              >
                <option value="requires">needs</option>
                <option value="excludes">can’t go with</option>
                <option value="quantity">is ordered in quantities of</option>
              </select>
              {r.kind === 'quantity' ? (
                <>
                  <input className={`${smallInputCls} w-20`} type="number" min="1" placeholder="min" value={r.minQuantity ?? ''} onChange={(e) => setRule(i, { ...r, minQuantity: parseNum(e.target.value) })} />
                  <span className="text-xs text-ios-gray">to</span>
                  <input className={`${smallInputCls} w-20`} type="number" min="1" placeholder="max" value={r.maxQuantity ?? ''} onChange={(e) => setRule(i, { ...r, maxQuantity: parseNum(e.target.value) })} />
                </>
              ) : (
                <select className={smallInputCls} value={r.targetOptionKey ?? ''} onChange={(e) => setRule(i, { ...r, targetOptionKey: e.target.value })}>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              <button type="button" className="p-1 rounded hover:bg-ios-red/10 text-ios-red ml-auto" onClick={() => onChange({ ...def, rules: def.rules.filter((_, j) => j !== i) })} aria-label="Remove rule">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <Label hint="optional">What the customer is told</Label>
              <input className={inputCls} placeholder="e.g. Spot UV needs 350gsm gloss" value={r.message ?? ''} onChange={(e) => setRule(i, { ...r, message: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
