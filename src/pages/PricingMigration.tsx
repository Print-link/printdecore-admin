import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Problems, Section, smallInputCls } from '../components/pricingV2/shared';
import {
  editorError,
  pricingV2Service,
  type MigrationOverview,
  type ProductStage,
  type VendorPlan,
  type VendorStage,
} from '../services/pricingV2Service';

/**
 * Phase 6 of the new pricing: every product switched over, and every vendor's
 * old setup moved onto a shop listing. Vendor options that don't match
 * Printdecore's by id or name wait here for a decision.
 */

const PRODUCT_STAGE: Record<ProductStage, { label: string; variant: 'success' | 'warning' | 'neutral' | 'danger'; hint: string }> = {
  switched: { label: 'On new pricing', variant: 'success', hint: '' },
  switched_shops_only: { label: 'On new pricing · shops’ prices', variant: 'success', hint: 'No Printdecore price yet — shops sell it at their own prices' },
  ready_to_switch: { label: 'Ready to switch', variant: 'warning', hint: 'Prices are live — switch it over in Product pricing' },
  ready_shops_only: { label: 'Ready for shops', variant: 'warning', hint: 'No price yet — switch it in Product pricing so shops can sell it at their own prices' },
  needs_prices: { label: 'Needs prices', variant: 'warning', hint: 'Set up — add its prices to the draft and publish' },
  not_set_up: { label: 'Old pricing', variant: 'neutral', hint: 'Set it up from its current setup in Product pricing' },
};

const VENDOR_STAGE: Record<VendorStage, { label: string; variant: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  migrated: { label: 'Moved', variant: 'success' },
  ready: { label: 'Ready', variant: 'warning' },
  prices_differ: { label: 'Prices would change', variant: 'danger' },
  needs_review: { label: 'Options to match', variant: 'danger' },
  blocked: { label: 'Can’t move', variant: 'danger' },
  waiting: { label: 'Waiting for product', variant: 'neutral' },
  nothing_to_move: { label: 'Nothing to move', variant: 'neutral' },
};

export const PricingMigration = () => {
  const { data, isLoading } = useQuery({ queryKey: ['pricingV2', 'migration'], queryFn: pricingV2Service.migration });

  return (
    <Layout>
      <PageHeader
        title="Pricing migration"
        subtitle="Move every product and every shop’s old setup onto the new pricing. Each move is checked by pricing jobs both ways first."
      />
      {isLoading || !data ? (
        <LoadingSpinner />
      ) : (
        <>
          <Summary data={data} />
          <ReviewQueue data={data} />
          <Vendors vendors={data.vendors} />
          <Products products={data.products} />
        </>
      )}
    </Layout>
  );
};

function Summary({ data }: { data: MigrationOverview }) {
  const switched = data.products.filter((p) => p.stage === 'switched' || p.stage === 'switched_shops_only').length;
  const moved = data.vendors.filter((v) => v.stage === 'migrated').length;
  const toMove = data.vendors.filter((v) => v.stage !== 'nothing_to_move').length;
  const stats = [
    { label: 'Products on new pricing', value: `${switched} / ${data.products.length}` },
    { label: 'Shop setups moved', value: `${moved} / ${toMove}` },
    { label: 'Options to match', value: String(data.review.length) },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-ios shadow-ios px-4 py-3">
          <p className="text-xs text-ios-secondary-label">{s.label}</p>
          <p className="text-xl font-semibold text-ios-label">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Review queue ──

function ReviewQueue({ data }: { data: MigrationOverview }) {
  const byService = new Map<string, MigrationOverview['review']>();
  for (const r of data.review) byService.set(r.agentServiceId, [...(byService.get(r.agentServiceId) ?? []), r]);
  if (!byService.size) return null;
  return (
    <Section title="Options to match" subtitle="A shop’s option that isn’t on Printdecore’s product by id or name. Pick the option it is, or drop it — the shop stays on its old setup until every option is decided.">
      <div className="space-y-3">
        {[...byService.entries()].map(([id, items]) => <ReviewCard key={id} agentServiceId={id} items={items} />)}
      </div>
    </Section>
  );
}

function ReviewCard({ agentServiceId, items }: { agentServiceId: string; items: MigrationOverview['review'] }) {
  const qc = useQueryClient();
  const { data: product } = useQuery({ queryKey: ['pricingV2', 'product', items[0].productId], queryFn: () => pricingV2Service.product(items[0].productId) });
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);
  const targets = (product?.attributes ?? []).flatMap((a) => a.options.map((o) => ({ key: `${a.key}:${o.key}`, label: `${a.name}: ${o.name}` })));
  const decided = items.every((i) => choice[i.vendorKey]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await pricingV2Service.saveMappings(
        agentServiceId,
        items.map((i) => ({
          vendorOptionKey: i.vendorKey,
          vendorOptionName: i.vendorName,
          action: choice[i.vendorKey] === 'drop' ? 'drop' : 'map',
          targetOptionKey: choice[i.vendorKey] === 'drop' ? null : choice[i.vendorKey],
        })),
      );
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['pricingV2', 'migration'] });
    } catch (e) {
      setError(editorError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-ios shadow-ios p-4">
      <p className="text-sm font-medium text-ios-label">{items[0].branchName} · {items[0].productName}</p>
      <div className="mt-2 divide-y divide-ios-gray5">
        {items.map((i) => (
          <div key={i.vendorKey} className="flex flex-wrap items-center gap-3 py-2">
            <span className="flex-1 min-w-[160px] text-sm text-ios-label">
              {i.vendorName} <span className="text-xs text-ios-gray">({i.vendorKey.split(':')[0] === 'base' ? 'size' : 'option'})</span>
            </span>
            <select className={smallInputCls} value={choice[i.vendorKey] ?? ''} onChange={(e) => setChoice({ ...choice, [i.vendorKey]: e.target.value })}>
              <option value="">Choose…</option>
              {targets.map((t) => <option key={t.key} value={t.key}>Is {t.label}</option>)}
              <option value="drop">Drop it — the shop stops offering it</option>
            </select>
          </div>
        ))}
      </div>
      <p className="text-xs text-ios-secondary-label mt-2">
        Not on the list? Add it to {items[0].productName} in <Link to="/pricing" className="text-brand-hover font-medium">Product pricing</Link> first, then match it here.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" disabled={!decided || busy} onClick={save}>Save decisions</Button>
      </div>
      <Problems message={error?.message} problems={error?.problems} />
    </div>
  );
}

// ── Shop setups ──

function Vendors({ vendors }: { vendors: VendorPlan[] }) {
  return (
    <Section title="Shop setups" subtitle="Each shop’s old setup for a product. Moving it creates the shop’s listing — Printdecore’s price when its prices are the same, its own price list otherwise.">
      <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5">
        {vendors.map((v) => <VendorRow key={v.agentServiceId} plan={v} />)}
        {vendors.length === 0 && <p className="px-4 py-6 text-sm text-ios-secondary-label text-center">No shop setups.</p>}
      </div>
    </Section>
  );
}

function VendorRow({ plan: v }: { plan: VendorPlan }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);
  const stage = VENDOR_STAGE[v.stage];
  const canMove = v.stage === 'ready' || v.stage === 'prices_differ';

  const move = async () => {
    const force = v.stage === 'prices_differ';
    const what = v.strategy === 'same' ? 'Printdecore’s price (theirs is the same)' : 'its own price list, carrying its current prices across';
    const msg = force
      ? `${v.checks.flagged.length} price(s) would change for ${v.branchName}. Move it anyway, on ${what}?`
      : `Move ${v.branchName}’s ${v.productName} onto the new pricing, on ${what}?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      await pricingV2Service.migrateVendor(v.agentServiceId, force);
      toast.success('Moved');
      qc.invalidateQueries({ queryKey: ['pricingV2'] });
    } catch (e) {
      setError(editorError(e));
    } finally {
      setBusy(false);
    }
  };

  const reviewed = v.matches.filter((m) => m.how !== 'same_key');
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ios-label truncate">
            {v.branchName} · {v.productName} {!v.isActive && <span className="text-xs text-ios-gray font-normal">· switched off</span>}
          </p>
          <p className="text-xs text-ios-secondary-label">
            {v.strategy && `${v.strategy === 'same' ? 'Same as Printdecore' : 'Own prices'} · `}
            {v.checks.checked > 0 && `${v.checks.checked} jobs priced both ways${v.checks.flagged.length ? `, ${v.checks.flagged.length} differ` : ', all the same'}`}
            {v.stage === 'waiting' && 'Printdecore’s product has to switch over first'}
            {v.problems[0] && ` ${v.problems[0]}`}
          </p>
        </div>
        <Badge variant={stage.variant}>{stage.label}</Badge>
        {(v.checks.checked > 0 || reviewed.length > 0 || v.disabledOptionKeys.length > 0) && (
          <button className="text-xs text-brand-hover font-medium" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Details'}</button>
        )}
        {canMove && <Button size="sm" variant={v.stage === 'ready' ? 'primary' : 'secondary'} disabled={busy} onClick={move}>Move</Button>}
      </div>
      {open && (
        <div className="mt-2 space-y-2 text-xs">
          {reviewed.length > 0 && (
            <div>
              <p className="font-medium text-ios-label">Matched other than by id</p>
              {reviewed.map((m) => (
                <p key={m.vendorKey} className="text-ios-secondary-label">
                  {m.vendorName} → {m.targetKey ?? '—'} <span className="text-ios-gray">({m.how.replace('_', ' ')})</span>
                </p>
              ))}
            </div>
          )}
          {v.disabledOptionKeys.length > 0 && (
            <p className="text-ios-secondary-label">
              <span className="font-medium text-ios-label">Switched off (the shop didn’t offer them):</span> {v.disabledOptionKeys.join(', ')}
            </p>
          )}
          {v.checks.flagged.length > 0 && (
            <div className="rounded-ios border border-ios-gray5 divide-y divide-ios-gray5">
              {v.checks.flagged.map((f, i) => (
                <div key={i} className="px-3 py-1.5 flex gap-3">
                  <span className="flex-1 text-ios-label">{f.label}</span>
                  <span className="text-ios-secondary-label">
                    {f.before?.toFixed(2)} → {f.after === null ? `can’t be priced${f.note ? ` (${f.note})` : ''}` : f.after.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Problems message={error?.message} problems={error?.problems} />
    </div>
  );
}

// ── Products ──

function Products({ products }: { products: MigrationOverview['products'] }) {
  return (
    <Section
      title="Products"
      subtitle="Printdecore’s products. Set each up and price it in Product pricing, then switch it over — the switch re-prices its recent orders first."
      actions={<Link to="/pricing"><Button size="sm" variant="secondary">Open Product pricing</Button></Link>}
    >
      <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5">
        {products.map((p) => {
          const s = PRODUCT_STAGE[p.stage];
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ios-label truncate">{p.name}</p>
                <p className="text-xs text-ios-secondary-label">
                  {p.category}{p.orderItems > 0 && ` · ${p.orderItems} orders`}{s.hint && ` · ${s.hint}`}
                </p>
              </div>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
