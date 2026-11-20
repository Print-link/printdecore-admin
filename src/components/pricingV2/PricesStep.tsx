import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload } from 'lucide-react';
import {
  editorError,
  pricingV2Service,
  type DefinitionInput,
  type ModifierKind,
  type PriceEntry,
  type PriceModifier,
  type QuantityBreak,
} from '../../services/pricingV2Service';
import { money, perSqftFromSqm, perSqmFromSqft } from '../../utils/units';
import { Button } from '../ui/Button';
import { Label, Problems, Section, UNIT_INFO, Warning, optionKeysOf, parseNum, smallInputCls } from './shared';

const KINDS: { kind: ModifierKind; label: string }[] = [
  { kind: 'per_item', label: 'per item' },
  { kind: 'per_measure', label: 'per unit priced' },
  { kind: 'per_side', label: 'per printed side' },
  { kind: 'per_order', label: 'once per order' },
  { kind: 'percent', label: '% of the price so far' },
];

const breaksToText = (b: QuantityBreak[]) => b.map((x) => `${x.min}:${x.unitPrice}`).join('; ');
const textToBreaks = (s: string): QuantityBreak[] | null => {
  if (!s.trim()) return [];
  const out: QuantityBreak[] = [];
  for (const part of s.split(/[;,]/).map((p) => p.trim()).filter(Boolean)) {
    const [min, price] = part.split(':').map((x) => Number(x.trim()));
    if (!(min > 0) || !(price >= 0)) return null;
    out.push({ min, unitPrice: price });
  }
  return out.sort((a, b) => a.min - b.min);
};

/** What each price-row field does, shown next to its label */
const PRICE_TIPS = {
  bulk: (
    <>
      A lower price for bigger orders. Write <b>from:price</b> pairs separated by “;”. For example, <b>100:0.85; 250:0.70</b> charges
      0.85 each from 100 and 0.70 each from 250. The highest step reached prices the <b>whole</b> order, so 250 can cost less than 249.
      Leave empty to always use the main price.
    </>
  ),
  breakBasis: (
    <>
      What the “from” numbers in <b>Cheaper in bulk</b> count: the number of items ordered, or the total measure across the order (for
      example, 10 banners of 5 sq ft each count as 50 sq ft).
    </>
  ),
  setup: (
    <>
      A one-off fee added <b>once per order</b>, however many copies. Use it for file prep, plates or machine setup. Leave 0 if
      there isn’t one.
    </>
  ),
  minimum: (
    <>
      The least an order can cost. If the order comes to less (after add-ons and setup), it’s raised to this amount before VAT.
      For example, with a minimum of 10, a 1.80 job costs 10. Leave 0 for no minimum.
    </>
  ),
};

const emptyEntry = (): PriceEntry =>({ match: {}, unitPrice: 0, breaks: [], breakBasis: 'quantity', setupFee: 0, minimumCharge: 0 });

export function PricesStep({
  productId,
  def,
  draftVersionId,
  liveVersionId,
  onOpenDraft,
}: {
  productId: string;
  def: DefinitionInput;
  draftVersionId: string | null;
  liveVersionId: string | null;
  onOpenDraft: () => Promise<void>;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['pricingV2', 'prices', draftVersionId, productId],
    queryFn: () => pricingV2Service.productPrices(draftVersionId!, productId),
    enabled: !!draftVersionId,
  });
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [modifiers, setModifiers] = useState<PriceModifier[]>([]);
  const [breakText, setBreakText] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);

  useEffect(() => {
    if (!data) return;
    setEntries(data.entries);
    setModifiers(data.modifiers);
    setBreakText(data.entries.map((e) => breaksToText(e.breaks)));
    setDirty(false);
  }, [data]);

  if (!draftVersionId) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-ios-label font-medium">Prices are changed in a draft</p>
        <p className="text-xs text-ios-secondary-label mt-1 mb-4">
          A draft copies today’s live prices. Customers keep paying live prices until you publish it.
        </p>
        <Button onClick={() => onOpenDraft()}>Open a draft</Button>
      </div>
    );
  }
  if (isLoading) return <p className="text-sm text-ios-secondary-label">Loading prices…</p>;

  const unit = UNIT_INFO[def.pricingUnit];
  const matchable = def.attributes.filter((a) => a.selection === 'one' && a.options.length);
  const options = optionKeysOf(def.attributes);
  const touch = () => setDirty(true);
  const setEntry = (i: number, e: PriceEntry) => { setEntries(entries.map((x, j) => (j === i ? e : x))); touch(); };
  const setModifier = (i: number, m: PriceModifier) => { setModifiers(modifiers.map((x, j) => (j === i ? m : x))); touch(); };

  const save = async () => {
    const parsed = breakText.map(textToBreaks);
    const bad = parsed.findIndex((b) => b === null);
    if (bad >= 0) {
      setError({ message: `Row ${bad + 1}: write quantity breaks as "100:0.85; 250:0.70"`, problems: [] });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await pricingV2Service.saveProductPrices(draftVersionId, productId, {
        entries: entries.map((e, i) => ({ ...e, breaks: parsed[i]! })),
        modifiers,
      });
      toast.success('Draft prices saved');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['pricingV2'] });
    } catch (e) {
      setError(editorError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {!liveVersionId && (
        <div className="mb-4">
          <Warning>Nothing is published yet — this draft becomes the first live price list when you publish it.</Warning>
        </div>
      )}

      <Section
        title={`Prices ${unit.per}`}
        subtitle="The most specific row that fits the customer’s choices is used. Leave a choice on “Any” to cover all its options."
        actions={
          <Button variant="secondary" size="sm" onClick={() => { setEntries([...entries, emptyEntry()]); setBreakText([...breakText, '']); touch(); }}>
            <Plus className="w-3.5 h-3.5" /> Add a price
          </Button>
        }
      >
        {entries.length === 0 && <p className="text-xs text-ios-secondary-label">No prices — customers can’t order this product.</p>}
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div key={i} className="rounded-ios border border-ios-gray5 p-3 space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                {matchable.map((a) => (
                  <div key={a.key}>
                    <Label>{a.name || a.key}</Label>
                    <select
                      className={smallInputCls}
                      value={e.match[a.key] ?? ''}
                      onChange={(ev) => {
                        const match = { ...e.match };
                        if (ev.target.value) match[a.key] = ev.target.value;
                        else delete match[a.key];
                        setEntry(i, { ...e, match });
                      }}
                    >
                      <option value="">Any</option>
                      {a.options.map((o) => <option key={o.key} value={o.key}>{o.name || o.key}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <Label hint={unit.per}>Price</Label>
                  <input type="number" min="0" step="0.01" className={`${smallInputCls} w-24`} value={e.unitPrice}
                    onChange={(ev) => setEntry(i, { ...e, unitPrice: parseNum(ev.target.value) ?? 0 })} />
                </div>
                <button type="button" className="p-1.5 rounded hover:bg-ios-red/10 text-ios-red ml-auto" aria-label="Remove price"
                  onClick={() => { setEntries(entries.filter((_, j) => j !== i)); setBreakText(breakText.filter((_, j) => j !== i)); touch(); }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {def.pricingUnit === 'sqft' && e.unitPrice > 0 && (
                <p className="text-[11px] text-ios-gray">= {money(perSqmFromSqft(e.unitPrice))} per m²</p>
              )}
              {def.pricingUnit === 'sqm' && e.unitPrice > 0 && (
                <p className="text-[11px] text-ios-gray">= {money(perSqftFromSqm(e.unitPrice))} per sq ft</p>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[200px]">
                  <Label hint="from:price, e.g. 100:0.85; 250:0.70" tip={PRICE_TIPS.bulk} tipAlign="start">Cheaper in bulk</Label>
                  <input className={`${smallInputCls} w-full`} value={breakText[i] ?? ''} placeholder="No breaks"
                    onChange={(ev) => { setBreakText(breakText.map((t, j) => (j === i ? ev.target.value : t))); touch(); }} />
                </div>
                <div>
                  <Label tip={PRICE_TIPS.breakBasis}>Breaks count</Label>
                  <select className={smallInputCls} value={e.breakBasis} onChange={(ev) => setEntry(i, { ...e, breakBasis: ev.target.value as PriceEntry['breakBasis'] })}>
                    <option value="quantity">items</option>
                    <option value="measure">total {def.pricingUnit === 'item' ? 'items' : unit.per.replace('per ', '')}</option>
                  </select>
                </div>
                <div>
                  <Label tip={PRICE_TIPS.setup} tipAlign="end">Setup</Label>
                  <input type="number" min="0" step="0.01" className={`${smallInputCls} w-20`} value={e.setupFee}
                    onChange={(ev) => setEntry(i, { ...e, setupFee: parseNum(ev.target.value) ?? 0 })} />
                </div>
                <div>
                  <Label tip={PRICE_TIPS.minimum} tipAlign="end">Minimum</Label>
                  <input type="number" min="0" step="0.01" className={`${smallInputCls} w-20`} value={e.minimumCharge}
                    onChange={(ev) => setEntry(i, { ...e, minimumCharge: parseNum(ev.target.value) ?? 0 })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Add-ons"
        subtitle="Extra charges when the customer picks an option. Percentages apply to the price so far, in the order shown."
        actions={
          <Button variant="secondary" size="sm" disabled={!options.length}
            onClick={() => { setModifiers([...modifiers, { optionKey: options[0].value, kind: 'per_item', amount: 0 }]); touch(); }}>
            <Plus className="w-3.5 h-3.5" /> Add an add-on
          </Button>
        }
      >
        {modifiers.length === 0 && <p className="text-xs text-ios-secondary-label">No add-ons.</p>}
        <div className="space-y-1.5">
          {modifiers.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select className={smallInputCls} value={m.optionKey} onChange={(ev) => setModifier(i, { ...m, optionKey: ev.target.value })}>
                {!options.some((o) => o.value === m.optionKey) && <option value={m.optionKey}>{m.optionKey} (missing)</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="text-xs text-ios-gray">adds</span>
              <input type="number" step="0.01" className={`${smallInputCls} w-20`} value={m.amount}
                onChange={(ev) => setModifier(i, { ...m, amount: parseNum(ev.target.value) ?? 0 })} />
              <select className={smallInputCls} value={m.kind} onChange={(ev) => setModifier(i, { ...m, kind: ev.target.value as ModifierKind })}>
                {KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.kind === 'percent' ? k.label : `GHS ${k.label}`}</option>)}
              </select>
              <input className={`${smallInputCls} flex-1 min-w-[120px]`} placeholder="Label on the quote (optional)" value={m.label ?? ''}
                onChange={(ev) => setModifier(i, { ...m, label: ev.target.value || undefined })} />
              <button type="button" className="p-1 rounded hover:bg-ios-red/10 text-ios-red" aria-label="Remove add-on"
                onClick={() => { setModifiers(modifiers.filter((_, j) => j !== i)); touch(); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <CsvImport productId={productId} versionId={draftVersionId} def={def} dirty={dirty} />

      <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-ios-gray5 flex items-center gap-3">
        <div className="flex-1"><Problems message={error?.message} problems={error?.problems} /></div>
        {dirty && <span className="text-xs text-ios-orange">Unsaved changes</span>}
        <Button onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save draft prices'}</Button>
      </div>
    </div>
  );
}

function CsvImport({ productId, versionId, def, dirty }: { productId: string; versionId: string; def: DefinitionInput; dirty: boolean }) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState('');
  const [diff, setDiff] = useState<Awaited<ReturnType<typeof pricingV2Service.importCsv>>['diff'] | null>(null);
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const header = [...def.attributes.filter((a) => a.selection === 'one').map((a) => a.key), 'unit_price', 'setup_fee', 'minimum_charge', 'breaks', 'break_basis'].join(',');

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await pricingV2Service.importCsv(versionId, productId, csv, dryRun);
      setDiff(res.diff);
      if (!dryRun) {
        toast.success('Prices imported into the draft');
        setCsv('');
        setDiff(null);
        qc.invalidateQueries({ queryKey: ['pricingV2'] });
      }
    } catch (e) {
      setError(editorError(e));
      setDiff(null);
    } finally {
      setBusy(false);
    }
  };

  const fmtMatch = (m: Record<string, string>) => Object.entries(m).map(([k, v]) => `${k}=${v}`).join(', ') || 'everything';

  return (
    <Section title="Import from a spreadsheet" subtitle="Replaces this product’s price rows in the draft. Add-ons are kept.">
      <p className="text-[11px] text-ios-gray mb-1 font-mono break-all">{header}</p>
      <textarea
        className={`${smallInputCls} w-full font-mono text-xs h-24`}
        placeholder="Paste CSV, or choose a file"
        value={csv}
        onChange={(e) => { setCsv(e.target.value); setDiff(null); }}
      />
      <div className="flex items-center gap-2 mt-2">
        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ios-label px-3 py-1.5 rounded-lg bg-ios-gray6 hover:bg-ios-gray5 cursor-pointer">
          <Upload className="w-3.5 h-3.5" /> Choose file
          <input type="file" accept=".csv,text/csv" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setCsv(await f.text()); setDiff(null); } }} />
        </label>
        <Button variant="secondary" size="sm" disabled={!csv.trim() || busy} onClick={() => run(true)}>Check changes</Button>
        {diff && (
          <Button size="sm" disabled={busy || dirty} onClick={() => run(false)} title={dirty ? 'Save or undo your edits first' : undefined}>
            Import
          </Button>
        )}
      </div>
      {error && <div className="mt-2"><Problems message={error.message} problems={error.problems} /></div>}
      {diff && (
        <div className="mt-2 rounded-ios border border-ios-gray5 p-3 text-xs space-y-1">
          <p className="text-ios-label">
            {diff.added.length} new · {diff.changed.length} changed · {diff.removed.length} removed · {diff.unchanged} unchanged
          </p>
          {diff.changed.map((c, i) => (
            <p key={i} className="text-ios-secondary-label">{fmtMatch(c.match)}: {c.from} → <span className="text-ios-label font-medium">{c.to}</span></p>
          ))}
          {(diff.removed as Record<string, string>[]).map((m, i) => (
            <p key={i} className="text-ios-red">Removed: {fmtMatch(m)}</p>
          ))}
          {dirty && <p className="text-ios-orange">Save or undo your edits above before importing.</p>}
        </div>
      )}
    </Section>
  );
}
