import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { editorError, pricingV2Service, type DefinitionInput, type EditorProduct, type ProductDefinition } from '../../services/pricingV2Service';
import { Button } from '../ui/Button';
import { BasicsStep } from './BasicsStep';
import { CheckStep } from './CheckStep';
import { OptionsStep } from './OptionsStep';
import { PricesStep } from './PricesStep';
import { SizesStep } from './SizesStep';
import { Problems } from './shared';

const STEPS = [
  { id: 'basics', label: 'Basics', hint: 'What a price is for' },
  { id: 'sizes', label: 'Sizes', hint: 'Presets and custom sizes' },
  { id: 'options', label: 'Options', hint: 'Choices and rules' },
  { id: 'prices', label: 'Prices', hint: 'Draft price list' },
  { id: 'check', label: 'Check & go live', hint: 'Samples, publish, switch' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

const blank = (): DefinitionInput => ({ pricingUnit: 'item', sizeMode: 'none', limits: {}, attributes: [], rules: [] });

const toInput = (p: ProductDefinition): DefinitionInput => ({
  pricingUnit: p.pricingUnit,
  customPricingUnit: p.customPricingUnit ?? null,
  sizeMode: p.sizeMode,
  limits: p.limits ?? {},
  attributes: p.attributes ?? [],
  rules: p.rules ?? [],
  artworkSpec: p.artworkSpec,
});

export function ProductEditor({
  product,
  liveVersionId,
  draftVersionId,
  onClose,
}: {
  product: EditorProduct;
  liveVersionId: string | null;
  draftVersionId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: loaded, isLoading } = useQuery({ queryKey: ['pricingV2', 'product', product.id], queryFn: () => pricingV2Service.product(product.id) });
  const { data: sizes = [] } = useQuery({ queryKey: ['pricingV2', 'sizes'], queryFn: pricingV2Service.sizes });

  const [step, setStep] = useState<StepId>('basics');
  const [def, setDef] = useState<DefinitionInput | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    if (loaded && !def) setDef(loaded.hasDefinition ? toInput(loaded) : null);
  }, [loaded, def]);

  // Keys matter once orders or the current app refer to them
  const keysLocked = product.orderItems > 0 || product.pricingModel === 'v2';
  const change = (d: DefinitionInput) => { setDef(d); setDirty(true); };

  const save = async (): Promise<boolean> => {
    if (!def || !dirty) return true;
    setSaving(true);
    setError(null);
    try {
      const saved = await pricingV2Service.saveDefinition(product.id, def);
      setDef(toInput(saved));
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['pricingV2'] });
      toast.success(product.pricingModel === 'v2' ? 'Saved — customers see the change now' : 'Product setup saved');
      return true;
    } catch (e) {
      setError(editorError(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const go = async (to: StepId) => {
    // Prices and checks read the saved setup
    if ((to === 'prices' || to === 'check') && dirty && !(await save())) return;
    setStep(to);
  };

  const convert = async () => {
    setSaving(true);
    try {
      const res = await pricingV2Service.convert(product.id);
      setNotes(res.notes);
      const fresh = await pricingV2Service.product(product.id);
      setDef(toInput(fresh));
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['pricingV2'] });
      toast.success('Set up from the current options, with draft prices');
    } catch (e) {
      setError(editorError(e));
    } finally {
      setSaving(false);
    }
  };

  const openDraft = async () => {
    try {
      const lists = await pricingV2Service.priceLists();
      const list = lists.find((l) => l.isDefault) ?? lists[0];
      if (!list) throw new Error('No platform price list');
      await pricingV2Service.openDraft(list.id);
      qc.invalidateQueries({ queryKey: ['pricingV2'] });
    } catch (e) {
      toast.error(editorError(e).message);
    }
  };

  const close = () => {
    if (dirty && !window.confirm('Leave without saving your changes?')) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={close}>
      <div className="bg-white rounded-ios-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ios-gray5">
          <div>
            <h2 className="text-lg font-semibold text-ios-label">{product.name}</h2>
            <p className="text-xs text-ios-secondary-label">
              {product.pricingModel === 'v2' ? 'On the new pricing — setup changes apply straight away; prices go through a draft.' : 'Still priced the old way until you switch it.'}
            </p>
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-ios-gray6 text-ios-secondary-label hover:bg-ios-gray5" onClick={close} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading || (loaded?.hasDefinition && !def) ? (
          <p className="p-6 text-sm text-ios-secondary-label">Loading…</p>
        ) : !def ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-medium text-ios-label">This product isn’t set up for the new pricing yet</p>
            <p className="text-xs text-ios-secondary-label mt-1 mb-4 max-w-md">
              Start from its current options and prices — they’re copied into a draft you can check before anything changes for customers.
            </p>
            <div className="flex gap-2">
              <Button onClick={convert} disabled={saving}>{saving ? 'Setting up…' : 'Set up from current setup'}</Button>
              <Button variant="secondary" onClick={() => { setDef(blank()); setDirty(true); }}>Start blank</Button>
            </div>
            {error && <div className="mt-4"><Problems message={error.message} problems={error.problems} /></div>}
          </div>
        ) : (
          <div className="flex-1 flex min-h-0">
            <nav className="w-52 shrink-0 border-r border-ios-gray5 p-3 space-y-1 bg-ios-gray6/50">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-ios transition-colors ${step === s.id ? 'bg-white shadow-ios' : 'hover:bg-white/60'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ios-label">
                    <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${step === s.id ? 'bg-brand text-ios-label' : 'bg-ios-gray5 text-ios-secondary-label'}`}>
                      {STEPS.findIndex((x) => x.id === step) > i ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-ios-secondary-label ml-7">{s.hint}</span>
                </button>
              ))}
            </nav>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {notes.length > 0 && (
                  <div className="mb-4 rounded-ios bg-ios-gray6 px-3 py-2 text-xs text-ios-secondary-label space-y-0.5">
                    {notes.map((n, i) => <p key={i}>{n}</p>)}
                  </div>
                )}
                {step === 'basics' && <BasicsStep def={def} onChange={change} formulaType={product.formulaType} />}
                {step === 'sizes' && (
                  <SizesStep
                    def={def}
                    onChange={change}
                    library={sizes}
                    onAddToLibrary={async (s) => {
                      try {
                        await pricingV2Service.addSize(s);
                        qc.invalidateQueries({ queryKey: ['pricingV2', 'sizes'] });
                        toast.success(`${s.name} added to the size library`);
                      } catch (e) {
                        toast.error(editorError(e).message);
                      }
                    }}
                  />
                )}
                {step === 'options' && <OptionsStep def={def} onChange={change} converted={keysLocked} />}
                {step === 'prices' && (
                  <PricesStep productId={product.id} def={def} draftVersionId={draftVersionId} liveVersionId={liveVersionId} onOpenDraft={openDraft} />
                )}
                {step === 'check' && (
                  <CheckStep
                    productId={product.id}
                    def={def}
                    library={sizes}
                    pricingModel={product.pricingModel}
                    draftVersionId={draftVersionId}
                    liveVersionId={liveVersionId}
                  />
                )}
              </div>
              {(step === 'basics' || step === 'sizes' || step === 'options') && (
                <div className="px-6 py-3 border-t border-ios-gray5 flex items-center gap-3">
                  <div className="flex-1">{error && <Problems message={error.message} problems={error.problems} />}</div>
                  {dirty && <span className="text-xs text-ios-orange">Unsaved changes</span>}
                  <Button variant="secondary" onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save'}</Button>
                  <Button onClick={() => go(STEPS[STEPS.findIndex((s) => s.id === step) + 1].id)} disabled={saving}>Next</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
