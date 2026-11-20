import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Tag } from 'lucide-react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProductEditor } from '../components/pricingV2/ProductEditor';
import { Problems, smallInputCls } from '../components/pricingV2/shared';
import { editorError, pricingV2Service, type EditorProduct, type PriceList, type VersionSummary } from '../services/pricingV2Service';

const ROUNDING = [
  { value: '', label: 'No rounding' },
  { value: '0.1', label: 'Nearest 0.10' },
  { value: '0.5', label: 'Nearest 0.50' },
  { value: '1', label: 'Nearest 1.00' },
];

export const ProductPricing = () => {
  const { data, isLoading } = useQuery({ queryKey: ['pricingV2', 'products'], queryFn: pricingV2Service.products });
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const editingProduct = data?.products.find((p) => p.id === editing);

  const products = (data?.products ?? []).filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <PageHeader
        title="Product pricing"
        subtitle="Set up each product’s choices and price it from the platform price list. Prices change through drafts you publish."
      />
      <PriceListPanel />

      <div className="flex items-center justify-between gap-3 mb-2 mt-6">
        <h2 className="text-sm font-semibold text-ios-label">Products</h2>
        <input className={`${smallInputCls} w-64`} placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5">
          {products.map((p) => <ProductRow key={p.id} product={p} hasDraft={!!data?.draftVersionId} onEdit={() => setEditing(p.id)} />)}
          {products.length === 0 && <p className="px-4 py-6 text-sm text-ios-secondary-label text-center">No products.</p>}
        </div>
      )}

      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          liveVersionId={data?.liveVersionId ?? null}
          draftVersionId={data?.draftVersionId ?? null}
          onClose={() => setEditing(null)}
        />
      )}
    </Layout>
  );
};

function ProductRow({ product: p, hasDraft, onEdit }: { product: EditorProduct; hasDraft: boolean; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Tag className="w-4 h-4 text-ios-gray shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ios-label truncate">
          {p.name} {!p.isActive && <span className="text-xs text-ios-gray font-normal">· hidden</span>}
        </p>
        <p className="text-xs text-ios-secondary-label">
          {p.category} · {p.hasDefinition ? `${p.attributes} choices` : `old ${p.formulaType.replace(/_/g, ' ').toLowerCase()} setup`}
          {' · '}{p.livePrices} live prices{hasDraft && p.draftPrices !== p.livePrices ? ` · ${p.draftPrices} in draft` : ''}
          {p.orderItems > 0 && ` · ${p.orderItems} orders`}
        </p>
      </div>
      <Badge variant={p.pricingModel === 'v2' ? 'success' : p.hasDefinition ? 'warning' : 'neutral'}>
        {p.pricingModel === 'v2' ? 'New pricing' : p.hasDefinition ? 'Set up, not live' : 'Old pricing'}
      </Badge>
      <Button variant="secondary" size="sm" onClick={onEdit}>{p.hasDefinition ? 'Edit' : 'Set up'}</Button>
    </div>
  );
}

function PriceListPanel() {
  const qc = useQueryClient();
  const { data: lists } = useQuery({ queryKey: ['pricingV2', 'priceLists'], queryFn: pricingV2Service.priceLists });
  const list: PriceList | undefined = lists?.find((l) => l.isDefault) ?? lists?.[0];
  const [showAll, setShowAll] = useState(false);
  if (!list) return null;

  const draft = list.versions.find((v) => v.status === 'draft');
  const live = list.versions.find((v) => v.id === list.liveVersionId);
  const scheduled = list.versions.filter((v) => v.status === 'published' && v.effectiveFrom && new Date(v.effectiveFrom) > new Date());
  const refresh = () => qc.invalidateQueries({ queryKey: ['pricingV2'] });

  return (
    <div className="bg-white rounded-ios shadow-ios p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ios-label">{list.name}</p>
          <p className="text-xs text-ios-secondary-label">
            {live ? `Version ${live.version} live since ${new Date(live.effectiveFrom ?? live.publishedAt ?? live.createdAt).toLocaleDateString()}` : 'Nothing published yet'}
            {live?.roundingStep ? ` · totals rounded to ${live.roundingStep.toFixed(2)}` : ''}
            {scheduled.map((v) => ` · version ${v.version} starts ${new Date(v.effectiveFrom!).toLocaleString()}`).join('')}
          </p>
        </div>
        {!draft && (
          <Button size="sm" onClick={async () => {
            try { await pricingV2Service.openDraft(list.id); refresh(); } catch (e) { toast.error(editorError(e).message); }
          }}>Open a draft</Button>
        )}
      </div>

      {draft && <DraftControls draft={draft} onChanged={refresh} />}

      {list.versions.length > 1 && (
        <div className="mt-3">
          <button className="text-xs text-brand-hover font-medium" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Hide history' : `History (${list.versions.length} versions)`}
          </button>
          {showAll && (
            <div className="mt-2 rounded-ios border border-ios-gray5 divide-y divide-ios-gray5 text-xs">
              {list.versions.map((v) => (
                <div key={v.id} className="px-3 py-1.5 flex gap-3">
                  <span className="w-20 text-ios-label font-medium">Version {v.version}</span>
                  <span className="w-20">
                    <Badge variant={v.id === list.liveVersionId ? 'success' : v.status === 'draft' ? 'warning' : 'neutral'}>
                      {v.id === list.liveVersionId ? 'Live' : v.status === 'draft' ? 'Draft' : v.effectiveFrom && new Date(v.effectiveFrom) > new Date() ? 'Scheduled' : 'Past'}
                    </Badge>
                  </span>
                  <span className="flex-1 text-ios-secondary-label">
                    {v.effectiveFrom ? `from ${new Date(v.effectiveFrom).toLocaleString()}` : `created ${new Date(v.createdAt).toLocaleDateString()}`}
                    {v.products != null && ` · ${v.products} products`}
                    {v.notes && ` · ${v.notes}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftControls({ draft, onChanged }: { draft: VersionSummary; onChanged: () => void }) {
  const [notes, setNotes] = useState(draft.notes ?? '');
  const [when, setWhen] = useState('');
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      toast.success(done);
      onChanged();
    } catch (e) {
      setError(editorError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-ios bg-ios-orange/5 border border-ios-orange/30 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Draft · version {draft.version}</Badge>
        <span className="text-xs text-ios-secondary-label">{draft.products ?? 0} products priced · customers don’t see it until it’s published</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={smallInputCls}
          value={draft.roundingStep == null ? '' : String(draft.roundingStep)}
          onChange={(e) => act(() => pricingV2Service.updateVersion(draft.id, { roundingStep: e.target.value ? Number(e.target.value) : null }), 'Rounding updated')}
        >
          {ROUNDING.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <input
          className={`${smallInputCls} flex-1 min-w-[180px]`}
          placeholder="What changed (for the history)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (draft.notes ?? '') && act(() => pricingV2Service.updateVersion(draft.id, { notes: notes || null }), 'Notes saved')}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ios-secondary-label">Starts</span>
        <input type="datetime-local" className={smallInputCls} value={when} onChange={(e) => setWhen(e.target.value)} />
        <span className="text-xs text-ios-gray">{when ? '' : 'now'}</span>
        <Button
          size="sm"
          disabled={busy}
          onClick={() => {
            if (!window.confirm(when ? `Publish version ${draft.version} from ${new Date(when).toLocaleString()}?` : `Publish version ${draft.version} now? Customers pay these prices straight away.`)) return;
            act(() => pricingV2Service.publish(draft.id, when ? new Date(when).toISOString() : undefined), 'Published');
          }}
        >
          Publish
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() => window.confirm('Discard this draft and every price change in it?') && act(() => pricingV2Service.discard(draft.id), 'Draft discarded')}
        >
          Discard draft
        </Button>
      </div>
      <Problems message={error?.message} problems={error?.problems} />
    </div>
  );
}
