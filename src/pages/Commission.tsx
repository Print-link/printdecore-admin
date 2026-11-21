import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HandCoins, Search } from 'lucide-react';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { commissionService, withCommission, type BranchCommission } from '../services/commissionService';

const money = (n: number) => `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const errorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const validRate = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100;

/**
 * Printdecore's commission. It's added on top of every quote — a shop asks
 * GHS 100 at 10%, the customer pays GHS 110 and the shop is paid GHS 100.
 * One platform rate; any shop can have its own.
 */
export const Commission = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['commission'], queryFn: commissionService.getOverview });

  return (
    <Layout>
      <PageHeader
        title="Platform service fee"
        subtitle="Added on top of every quote: the customer pays the shop's price plus this fee, and the shop is paid its price."
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : isError || !data ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ios-label">Couldn't load the service fee settings.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => refetch()}>Try again</Button>
        </Card>
      ) : (
        <div className="space-y-5">
          <PlatformRate rate={data.rate} onSaved={() => queryClient.invalidateQueries({ queryKey: ['commission'] })} />
          <ShopRates platformRate={data.rate} branches={data.branches} />
        </div>
      )}
    </Layout>
  );
};

/* ─── The platform rate ─────────────────────────────────────────────────── */

const PlatformRate = ({ rate, onSaved }: { rate: number; onSaved: () => void }) => {
  const [value, setValue] = useState(String(rate));
  const save = useMutation({
    mutationFn: () => commissionService.setRate(Number(value)),
    onSuccess: () => {
      toast.success(`Platform service fee is now ${Number(value)}%`);
      onSaved();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't save the rate")),
  });
  const valid = validRate(value);
  const changed = valid && Number(value) !== rate;
  const example = withCommission(100, valid ? Number(value) : rate);

  return (
    <Card className="p-5">
      <div className="flex flex-col md:flex-row md:items-end gap-5">
        <div className="flex items-start gap-3 flex-1">
          <span className="h-10 w-10 shrink-0 rounded-ios bg-brand/15 text-brand-hover flex items-center justify-center">
            <HandCoins size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ios-label">Platform service fee</h2>
            <p className="text-sm text-ios-secondary-label">Every shop's quotes carry this fee unless the shop has its own rate below.</p>
          </div>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (changed) save.mutate();
          }}
        >
          <FormField label="Rate (%)">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`w-28 text-lg font-semibold ${iosInputCls}`}
              aria-invalid={!valid}
            />
          </FormField>
          <Button type="submit" disabled={!changed || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-xs text-ios-secondary-label bg-ios-gray6 rounded-ios px-3 py-2">
        Example: a shop quotes <span className="font-medium text-ios-label">{money(100)}</span> → the customer pays{' '}
        <span className="font-medium text-ios-label">{money(example.customerPrice)}</span>, the service fee is{' '}
        <span className="font-medium text-ios-label">{money(example.commission)}</span>, the shop is paid{' '}
        <span className="font-medium text-ios-label">{money(100)}</span>.
        {!valid && <span className="text-ios-red"> Enter a rate between 0 and 100.</span>}
      </p>
    </Card>
  );
};

/* ─── Each shop's rate ──────────────────────────────────────────────────── */

const ShopRates = ({ platformRate, branches }: { platformRate: number; branches: BranchCommission[] }) => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const custom = branches.filter((b) => b.customRate !== null).length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? branches.filter((b) => b.name.toLowerCase().includes(q)) : branches;
    // Shops with their own rate first, then by name
    return [...list].sort((a, b) => Number(b.customRate !== null) - Number(a.customRate !== null) || a.name.localeCompare(b.name));
  }, [branches, search]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-ios-gray5">
        <div>
          <h2 className="text-base font-semibold text-ios-label">Shop rates</h2>
          <p className="text-xs text-ios-secondary-label">
            {custom ? `${custom} shop${custom === 1 ? ' has its' : 's have their'} own rate` : `All shops pay the platform fee (${platformRate}%)`}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a shop"
            className={`pl-8 ${iosInputCls}`}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ios-secondary-label">No shops match “{search}”.</p>
      ) : (
        <ul className="divide-y divide-ios-gray5">
          {shown.map((b) => (
            <ShopRow
              key={b.id}
              branch={b}
              platformRate={platformRate}
              editing={editing === b.id}
              onEdit={() => setEditing(b.id)}
              onDone={() => setEditing(null)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
};

const ShopRow = ({
  branch,
  platformRate,
  editing,
  onEdit,
  onDone,
}: {
  branch: BranchCommission;
  platformRate: number;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) => {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState(String(branch.customRate ?? platformRate));
  const [reason, setReason] = useState(branch.reason ?? '');
  const [expires, setExpires] = useState(branch.expiresAt ? branch.expiresAt.slice(0, 10) : '');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['commission'] });
  const save = useMutation({
    mutationFn: () =>
      commissionService.setBranchRate(branch.id, {
        rate: Number(rate),
        reason: reason.trim() || undefined,
        // End of the chosen day
        expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success(`${branch.name} now pays ${Number(rate)}%`);
      refresh();
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't save this shop's rate")),
  });
  const reset = useMutation({
    mutationFn: () => commissionService.clearBranchRate(branch.id),
    onSuccess: () => {
      toast.success(`${branch.name} pays the platform rate again`);
      refresh();
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't reset this shop's rate")),
  });

  const own = branch.customRate !== null;
  const busy = save.isPending || reset.isPending;

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex-1 min-w-[12rem]">
          <p className="text-sm font-medium text-ios-label">{branch.name}</p>
          <p className="text-xs text-ios-secondary-label">
            {branch.selfManaged ? 'Runs its own orders' : 'Managed by Printdecore'}
            {branch.listed && ' · On the marketplace'}
            {branch.status !== 'active' && ` · ${branch.status.replace(/_/g, ' ')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-ios-label w-14 text-right">{branch.effectiveRate}%</span>
          {own ? <Badge variant="warning">Own rate</Badge> : <Badge variant="neutral">Platform</Badge>}
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {own ? 'Change' : 'Set own rate'}
          </Button>
        )}
      </div>
      {own && !editing && (branch.reason || branch.expiresAt) && (
        <p className="mt-1 text-xs text-ios-gray">
          {branch.reason}
          {branch.reason && branch.expiresAt && ' · '}
          {branch.expiresAt && `until ${new Date(branch.expiresAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </p>
      )}

      {editing && (
        <form
          className="mt-3 grid grid-cols-1 sm:grid-cols-[7rem_1fr_10rem] gap-3 items-end bg-ios-gray6/60 rounded-ios p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (validRate(rate)) save.mutate();
          }}
        >
          <FormField label="Rate (%)">
            <input type="number" inputMode="decimal" min="0" max="100" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={`bg-white ${iosInputCls}`} autoFocus />
          </FormField>
          <FormField label="Reason (optional)">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Launch promotion" maxLength={500} className={`bg-white ${iosInputCls}`} />
          </FormField>
          <FormField label="Until (optional)">
            <input type="date" value={expires} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExpires(e.target.value)} className={`bg-white ${iosInputCls}`} />
          </FormField>
          <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ios-secondary-label">
              {validRate(rate)
                ? `On a GHS 100 quote the customer pays ${money(withCommission(100, Number(rate)).customerPrice)}.`
                : 'Enter a rate between 0 and 100.'}
              {expires && ' After that date the shop goes back to the platform rate.'}
            </p>
            <div className="flex gap-2">
              {own && (
                <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => reset.mutate()}>
                  Use platform rate
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onDone}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={busy || !validRate(rate)}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </li>
  );
};
