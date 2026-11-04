import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import {
  editorError,
  pricingV2Service,
  type DefinitionInput,
  type PreviewRequest,
  type QuoteResult,
  type RequoteSummary,
  type SizePreset,
} from '../../services/pricingV2Service';
import { money } from '../../utils/units';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Label, Problems, Section, Warning, smallInputCls } from './shared';
import { optionSize, sizeAttributeOf } from './SizesStep';

const usesPages = (d: DefinitionInput) => d.pricingUnit === 'side' || d.pricingUnit === 'sheet';

/** A sample order: the defaults, a size if one is needed, and a quantity */
function sampleRequest(def: DefinitionInput, library: SizePreset[], quantity: number): PreviewRequest {
  const choices: Record<string, string | string[]> = {};
  for (const a of def.attributes) {
    if (a.selection === 'one') {
      const key = a.defaultOptionKeys[0] ?? (a.required ? a.options[0]?.key : undefined);
      if (key) choices[a.key] = key;
    } else if (a.defaultOptionKeys.length) choices[a.key] = a.defaultOptionKeys;
  }
  const req: PreviewRequest = { quantity, choices };
  const sizeAttr = sizeAttributeOf(def.attributes);
  const hasPreset = (def.sizeMode === 'preset' || def.sizeMode === 'both') && sizeAttr?.options.some((o) => optionSize(o, library));
  if (def.sizeMode === 'custom' || (def.sizeMode === 'both' && !hasPreset)) {
    // 3 × 6 ft, inside the limits
    const w = Math.max(def.limits.minWidthMm ?? 0, Math.min(def.limits.maxWidthMm ?? Infinity, 914.4));
    const h = Math.max(def.limits.minHeightMm ?? 0, Math.min(def.limits.maxHeightMm ?? Infinity, 1828.8));
    req.size = { widthMm: w, heightMm: h };
  }
  if (usesPages(def)) req.pages = 10;
  return req;
}

const sampleQuantities = (def: DefinitionInput) => {
  const min = def.limits.minQuantity ?? 1;
  const max = def.limits.maxQuantity ?? Infinity;
  return [...new Set([min, 100, 1000].map((q) => Math.min(max, Math.max(min, q))))];
};

const describe = (r: PreviewRequest) =>
  [
    ...Object.values(r.choices ?? {}).flat(),
    r.size && `${(r.size.widthMm / 304.8).toFixed(1)} × ${(r.size.heightMm / 304.8).toFixed(1)} ft`,
    r.pages && `${r.pages} pages`,
    `× ${r.quantity}`,
  ].filter(Boolean).join(' · ');

async function tryPreview(productId: string, versionId: string | undefined, req: PreviewRequest): Promise<QuoteResult | { ok: false; errors: { code: string; message: string }[] }> {
  try {
    return await pricingV2Service.preview(productId, versionId, req);
  } catch (e) {
    return { ok: false, errors: [{ code: 'error', message: editorError(e).message }] };
  }
}

export function CheckStep({
  productId,
  def,
  library,
  pricingModel,
  draftVersionId,
  liveVersionId,
}: {
  productId: string;
  def: DefinitionInput;
  library: SizePreset[];
  pricingModel: 'legacy' | 'v2';
  draftVersionId: string | null;
  liveVersionId: string | null;
}) {
  const qc = useQueryClient();
  const [custom, setCustom] = useState<PreviewRequest>(() => sampleRequest(def, library, sampleQuantities(def)[0]));

  const samples = useQuery({
    queryKey: ['pricingV2', 'samples', productId, draftVersionId, liveVersionId, JSON.stringify(def)],
    queryFn: async () =>
      Promise.all(
        sampleQuantities(def).map(async (q) => {
          const req = sampleRequest(def, library, q);
          const [draft, live] = await Promise.all([
            draftVersionId ? tryPreview(productId, draftVersionId, req) : null,
            liveVersionId ? tryPreview(productId, liveVersionId, req) : null,
          ]);
          return { req, draft, live };
        }),
      ),
  });

  const [customResult, setCustomResult] = useState<QuoteResult | null>(null);
  const runCustom = async () => setCustomResult(await tryPreview(productId, draftVersionId ?? liveVersionId ?? undefined, custom) as QuoteResult);

  return (
    <div>
      <Section
        title="Sample orders"
        subtitle={draftVersionId ? 'Draft prices next to what customers pay today.' : 'What customers pay with the live prices.'}
        actions={<Button variant="ghost" size="sm" onClick={() => samples.refetch()}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>}
      >
        {samples.isLoading && <p className="text-xs text-ios-secondary-label">Pricing samples…</p>}
        <div className="rounded-ios border border-ios-gray5 divide-y divide-ios-gray5">
          {samples.data?.map(({ req, draft, live }, i) => {
            const d = draft?.ok ? draft.total : null;
            const l = live?.ok ? live.total : null;
            const ratio = d != null && l != null && l > 0 ? d / l : null;
            const off = ratio != null && (ratio >= 3 || ratio <= 1 / 3);
            return (
              <div key={i} className="px-3 py-2 text-sm flex items-center gap-3">
                <span className="flex-1 text-xs text-ios-secondary-label">{describe(req)}</span>
                {liveVersionId && <Total label="Live" result={live} />}
                {draftVersionId && <Total label="Draft" result={draft} />}
                {off && <Badge variant="warning">{ratio! >= 3 ? `${ratio!.toFixed(1)}× live` : `${(ratio! * 100).toFixed(0)}% of live`}</Badge>}
              </div>
            );
          })}
        </div>
        {samples.data?.some((s) => {
          const d = s.draft?.ok ? s.draft.total : null;
          const l = s.live?.ok ? s.live.total : null;
          return d != null && l != null && l > 0 && (d / l >= 3 || d / l <= 1 / 3);
        }) && (
          <div className="mt-2"><Warning>A draft price is over 3× or under a third of today’s — check for a unit mix-up (per sq ft vs per m², mm vs cm).</Warning></div>
        )}
      </Section>

      <Section title="Try an order">
        <div className="flex flex-wrap items-end gap-2">
          {def.attributes.map((a) => (
            <div key={a.key}>
              <Label>{a.name || a.key}</Label>
              <select
                className={smallInputCls}
                value={Array.isArray(custom.choices?.[a.key]) ? (custom.choices![a.key] as string[])[0] ?? '' : (custom.choices?.[a.key] as string) ?? ''}
                onChange={(e) => {
                  const choices = { ...(custom.choices ?? {}) };
                  if (e.target.value) choices[a.key] = a.selection === 'any' ? [e.target.value] : e.target.value;
                  else delete choices[a.key];
                  setCustom({ ...custom, choices });
                }}
              >
                <option value="">—</option>
                {a.options.map((o) => <option key={o.key} value={o.key}>{o.name || o.key}</option>)}
              </select>
            </div>
          ))}
          {(def.sizeMode === 'custom' || def.sizeMode === 'both') && (
            <>
              <div>
                <Label hint="mm">Width</Label>
                <input type="number" className={`${smallInputCls} w-20`} value={custom.size?.widthMm ?? ''}
                  onChange={(e) => setCustom({ ...custom, size: e.target.value ? { widthMm: Number(e.target.value), heightMm: custom.size?.heightMm ?? 0 } : undefined })} />
              </div>
              <div>
                <Label hint="mm">Height</Label>
                <input type="number" className={`${smallInputCls} w-20`} value={custom.size?.heightMm ?? ''}
                  onChange={(e) => setCustom({ ...custom, size: { widthMm: custom.size?.widthMm ?? 0, heightMm: Number(e.target.value) } })} />
              </div>
            </>
          )}
          {usesPages(def) && (
            <div>
              <Label>Pages</Label>
              <input type="number" min="1" className={`${smallInputCls} w-16`} value={custom.pages ?? ''}
                onChange={(e) => setCustom({ ...custom, pages: Number(e.target.value) || undefined })} />
            </div>
          )}
          <div>
            <Label>Quantity</Label>
            <input type="number" min="1" className={`${smallInputCls} w-20`} value={custom.quantity}
              onChange={(e) => setCustom({ ...custom, quantity: Number(e.target.value) || 1 })} />
          </div>
          <Button size="sm" onClick={runCustom}>Price it</Button>
        </div>
        {customResult && <QuoteBreakdown result={customResult} />}
      </Section>

      <GoLive productId={productId} pricingModel={pricingModel} liveVersionId={liveVersionId} onChanged={() => qc.invalidateQueries({ queryKey: ['pricingV2'] })} />
      {liveVersionId && <MarginsSection productId={productId} />}
    </div>
  );
}

function Total({ label, result }: { label: string; result: QuoteResult | { ok: false; errors: { message: string }[] } | null }) {
  return (
    <div className="text-right w-28">
      <p className="text-[10px] uppercase tracking-wide text-ios-gray">{label}</p>
      {result?.ok ? (
        <p className="text-sm font-medium text-ios-label">{money(result.total, result.currency)}</p>
      ) : (
        <p className="text-[11px] text-ios-red truncate" title={result?.errors?.[0]?.message}>{result?.errors?.[0]?.message ?? '—'}</p>
      )}
    </div>
  );
}

function QuoteBreakdown({ result }: { result: QuoteResult }) {
  if (!result.ok) return <div className="mt-2"><Problems problems={result.errors.map((e) => e.message)} /></div>;
  return (
    <div className="mt-2 rounded-ios border border-ios-gray5 p-3 text-sm space-y-1">
      {result.lines.map((l, i) => (
        <div key={i} className="flex justify-between gap-3">
          <span className="text-ios-label">
            {l.label} {l.detail && <span className="text-xs text-ios-gray">· {l.detail}</span>}
          </span>
          <span className="text-ios-label tabular-nums">{money(l.amount, result.currency)}</span>
        </div>
      ))}
      <div className="flex justify-between pt-1 border-t border-ios-gray5 font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{money(result.total, result.currency)}</span>
      </div>
      <p className="text-xs text-ios-gray">{money(result.unitPrice, result.currency)} each</p>
    </div>
  );
}

function RequoteReport({ report }: { report: RequoteSummary[] }) {
  return (
    <div className="mt-2 rounded-ios border border-ios-gray5 p-3 text-xs space-y-1">
      {report.map((r) => (
        <div key={r.productId}>
          <p className="text-ios-label">
            {r.productName}: {r.checked} recent orders checked · {r.flagged.length} differ {r.flagged.length ? `(up to ${money(r.maxDiff)})` : ''}
          </p>
          {r.flagged.slice(0, 8).map((f) => (
            <p key={f.orderItemId} className="text-ios-secondary-label">
              Order {f.orderId.slice(0, 8)} · charged {money(f.charged)} → {f.requoted == null ? 'can’t price' : money(f.requoted)} · {f.reason}
            </p>
          ))}
        </div>
      ))}
      {report.length === 0 && <p className="text-ios-secondary-label">No recent orders to compare.</p>}
    </div>
  );
}

function GoLive({ productId, pricingModel, liveVersionId, onChanged }: { productId: string; pricingModel: 'legacy' | 'v2'; liveVersionId: string | null; onChanged: () => void }) {
  const [report, setReport] = useState<RequoteSummary[] | null>(null);
  const [blocked, setBlocked] = useState<{ message: string; problems: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    try {
      const r = await pricingV2Service.requote(productId);
      setReport(r ? [r] : []);
    } catch (e) {
      toast.error(editorError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const switchTo = async (to: 'v2' | 'legacy', force = false) => {
    setBusy(true);
    setBlocked(null);
    try {
      const res = await pricingV2Service.switchModel(productId, to, force);
      setReport(res.report);
      toast.success(to === 'v2' ? 'Customers are now priced with the new setup' : 'Back on the old pricing');
      onChanged();
    } catch (e) {
      // A 409 lists the orders that would be priced differently
      setBlocked(editorError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title="Go live"
      subtitle={
        pricingModel === 'v2'
          ? 'Customers are priced with this setup and the live price list.'
          : 'Customers are still priced the old way. Switch once the live prices match recent orders.'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={pricingModel === 'v2' ? 'success' : 'neutral'}>{pricingModel === 'v2' ? 'New pricing' : 'Old pricing'}</Badge>
        <Button variant="secondary" size="sm" disabled={busy || !liveVersionId} onClick={check}>Re-price recent orders</Button>
        {pricingModel === 'legacy' ? (
          <Button size="sm" disabled={busy || !liveVersionId} onClick={() => switchTo('v2')} title={!liveVersionId ? 'Publish prices first' : undefined}>
            Switch to new pricing
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => switchTo('legacy')}>Switch back</Button>
        )}
      </div>
      {!liveVersionId && <p className="text-xs text-ios-gray mt-1">Publish the draft before switching.</p>}
      {blocked && (
        <div className="mt-2 space-y-2">
          <Problems message={blocked.message} problems={blocked.problems} />
          <Button variant="destructive" size="sm" disabled={busy} onClick={() => switchTo('v2', true)}>Switch anyway</Button>
        </div>
      )}
      {report && <RequoteReport report={report} />}
    </Section>
  );
}

function MarginsSection({ productId }: { productId: string }) {
  const { data, isLoading, error } = useQuery({ queryKey: ['pricingV2', 'margins', productId], queryFn: () => pricingV2Service.margins(productId) });
  return (
    <Section title="Margin on recent orders" subtitle="What customers paid minus what the shop’s own rate would charge.">
      {isLoading && <p className="text-xs text-ios-secondary-label">Loading…</p>}
      {error && <Problems message={editorError(error).message} />}
      {data && (
        <>
          <p className="text-sm text-ios-label mb-2">
            {data.totals.orders} orders · {money(data.totals.revenue)} paid · {money(data.totals.margin)} margin
            {data.totals.marginPct != null && ` (${data.totals.marginPct.toFixed(1)}%)`}
          </p>
          <div className="rounded-ios border border-ios-gray5 divide-y divide-ios-gray5 text-xs">
            {data.items.slice(0, 10).map((m) => (
              <div key={m.orderItemId} className="px-3 py-1.5 flex gap-3">
                <span className="flex-1 text-ios-secondary-label">{m.branchName} · {new Date(m.createdAt).toLocaleDateString()}</span>
                <span className="w-24 text-right">{money(m.charged)}</span>
                <span className={`w-24 text-right ${m.margin != null && m.margin < 0 ? 'text-ios-red' : 'text-ios-label'}`}>
                  {m.margin == null ? m.note ?? '—' : money(m.margin)}
                </span>
              </div>
            ))}
            {data.items.length === 0 && <p className="px-3 py-2 text-ios-secondary-label">No orders yet.</p>}
          </div>
        </>
      )}
    </Section>
  );
}
