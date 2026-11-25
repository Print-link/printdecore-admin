import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { promoBannerService, type PromoBanner, type PromoBannerInput } from '../services/promoBannerService';

const KEY = ['promo-banners'];
const DEFAULT_COLOR = '#14532D';
const SWATCHES = ['#14532D', '#1E3A8A', '#7C2D12', '#581C87', '#0F172A', '#B45309'];

const errorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Where a banner stands for customers right now */
function status(b: PromoBanner): { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' } {
  if (!b.isActive) return { label: 'Off', variant: 'neutral' };
  const now = Date.now();
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return { label: `Starts ${new Date(b.startsAt).toLocaleDateString()}`, variant: 'warning' };
  if (b.endsAt && new Date(b.endsAt).getTime() <= now) return { label: 'Ended', variant: 'danger' };
  return { label: 'Live', variant: 'success' };
}

/** ISO → the value a datetime-local input shows (local time) */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

/** The card as the customer app draws it: coloured panel with text, image on the right */
const BannerPreview = ({ banner, small }: { banner: Pick<PromoBanner, 'headline' | 'subline' | 'imageUrl' | 'backgroundColor'>; small?: boolean }) => (
  <div
    className={`relative overflow-hidden rounded-ios-lg flex ${small ? 'w-40 h-[68px]' : 'w-full aspect-[2.4/1]'}`}
    style={{ backgroundColor: banner.backgroundColor || DEFAULT_COLOR }}
  >
    <div className={`relative z-10 flex flex-col justify-center ${small ? 'w-[60%] px-2' : 'w-[58%] px-5'}`}>
      <p className={`font-bold text-white leading-tight ${small ? 'text-[9px] line-clamp-2' : 'text-xl line-clamp-3'}`}>{banner.headline || 'Headline'}</p>
      {banner.subline && !small && <p className="mt-1.5 text-sm text-white/75 leading-snug line-clamp-2">{banner.subline}</p>}
    </div>
    {banner.imageUrl && (
      <img
        src={banner.imageUrl}
        alt=""
        className="absolute inset-y-0 right-0 w-[48%] h-full object-cover"
        style={{ clipPath: 'ellipse(100% 100% at 100% 50%)' }}
      />
    )}
  </div>
);

export const PromoBanners = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PromoBanner | 'new' | null>(null);
  const { data: banners = [], isLoading } = useQuery({ queryKey: KEY, queryFn: promoBannerService.getAll });
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  const toggle = useMutation({
    mutationFn: (b: PromoBanner) => promoBannerService.update(b.id, { isActive: !b.isActive }),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e, "Couldn't change it")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => promoBannerService.delete(id),
    onSuccess: () => {
      refresh();
      toast.success('Banner deleted');
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't delete it")),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => promoBannerService.reorder(ids),
    onMutate: (ids) => {
      // Move it on screen straight away
      const byId = new Map(banners.map((b) => [b.id, b]));
      queryClient.setQueryData(KEY, ids.map((id) => byId.get(id)!));
    },
    onSettled: refresh,
    onError: (e) => toast.error(errorMessage(e, "Couldn't reorder")),
  });

  const move = (index: number, by: -1 | 1) => {
    const ids = banners.map((b) => b.id);
    const target = index + by;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <Layout>
      <PageHeader
        title="Promo banners"
        subtitle="Wide cards in their own row on the customer app's home page, shown in this order"
        actions={<Button size="sm" onClick={() => setEditing('new')}>New banner</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <ListGroup>
          {banners.map((b, i) => {
            const s = status(b);
            const when = [b.startsAt && `from ${new Date(b.startsAt).toLocaleDateString()}`, b.endsAt && `until ${new Date(b.endsAt).toLocaleDateString()}`]
              .filter(Boolean)
              .join(' ');
            return (
              <ListRow
                key={b.id}
                onClick={() => setEditing(b)}
                leading={<BannerPreview banner={b} small />}
                title={b.headline}
                subtitle={
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <span className="truncate">{b.linkUrl}{when && ` · ${when}`}</span>
                  </span>
                }
                trailing={
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button type="button" aria-label="Move up" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6 disabled:opacity-30">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label="Move down" disabled={i === banners.length - 1 || reorder.isPending} onClick={() => move(i, 1)} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6 disabled:opacity-30">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <Switch checked={b.isActive} disabled={toggle.isPending} onChange={() => toggle.mutate(b)} />
                    <button type="button" aria-label="Edit" onClick={() => setEditing(b)} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => window.confirm(`Delete "${b.headline}"? Customers stop seeing it straight away.`) && remove.mutate(b.id)}
                      className="p-1.5 rounded-full text-ios-red hover:bg-ios-red/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                }
              />
            );
          })}
          {banners.length === 0 && (
            <div className="px-4 py-12 text-center text-ios-gray text-sm">
              No promo banners yet. Customers see the row once one is live.
            </div>
          )}
        </ListGroup>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New promo banner' : 'Edit promo banner'} size="large">
        {editing && (
          <BannerForm
            key={editing === 'new' ? 'new' : editing.id}
            banner={editing === 'new' ? null : editing}
            onDone={() => {
              setEditing(null);
              refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </Layout>
  );
};

function BannerForm({ banner, onDone, onCancel }: { banner: PromoBanner | null; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<PromoBannerInput>({
    headline: banner?.headline ?? '',
    subline: banner?.subline ?? '',
    imageUrl: banner?.imageUrl ?? '',
    backgroundColor: banner?.backgroundColor ?? DEFAULT_COLOR,
    linkUrl: banner?.linkUrl ?? '/home/shops',
    isActive: banner?.isActive ?? true,
    startsAt: banner?.startsAt ?? null,
    endsAt: banner?.endsAt ?? null,
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof PromoBannerInput>(k: K, v: PromoBannerInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, subline: form.subline || null, imageUrl: form.imageUrl || null };
      return banner ? promoBannerService.update(banner.id, body) : promoBannerService.create(body);
    },
    onSuccess: () => {
      toast.success(banner ? 'Banner saved' : 'Banner created');
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Couldn't save the banner")),
  });

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Keep the image under 5 MB');
    setUploading(true);
    try {
      set('imageUrl', await promoBannerService.uploadImage(file));
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't upload the image"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <BannerPreview banner={{ ...form, subline: form.subline || null, imageUrl: form.imageUrl || null }} />

      <FormField label="Headline">
        <input required maxLength={80} value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Flyers from GHS 50" className={iosInputCls} />
      </FormField>
      <FormField label="Subline (optional)">
        <input maxLength={160} value={form.subline ?? ''} onChange={(e) => set('subline', e.target.value)} placeholder="Tap to find a shop near you" className={iosInputCls} />
      </FormField>

      <FormField label="Image">
        <div className="flex items-center gap-2">
          <input
            value={form.imageUrl ?? ''}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://… or upload"
            className={iosInputCls}
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload'}
          </Button>
          {form.imageUrl && (
            <button type="button" aria-label="Remove image" onClick={() => set('imageUrl', '')} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </FormField>

      <FormField label="Background colour">
        <div className="flex items-center gap-2 flex-wrap">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use ${c}`}
              onClick={() => set('backgroundColor', c)}
              className={`w-7 h-7 rounded-full ring-offset-2 ${form.backgroundColor.toUpperCase() === c ? 'ring-2 ring-brand-hover' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input type="color" aria-label="Pick a colour" value={form.backgroundColor} onChange={(e) => set('backgroundColor', e.target.value.toUpperCase())} className="w-9 h-7 rounded cursor-pointer bg-transparent" />
          <span className="text-xs text-ios-secondary-label font-mono">{form.backgroundColor}</span>
        </div>
      </FormField>

      <FormField label="Link">
        <input required value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="/home/shops or https://…" className={iosInputCls} />
        <p className="mt-1 text-xs text-ios-secondary-label">An app page such as /home/shops, /home/shops/&lt;shop id&gt; or /home/category/&lt;id&gt;, or a full https:// link.</p>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Starts (optional)">
          <input type="datetime-local" value={toLocalInput(form.startsAt)} onChange={(e) => set('startsAt', fromLocalInput(e.target.value))} className={iosInputCls} />
        </FormField>
        <FormField label="Ends (optional)">
          <input type="datetime-local" value={toLocalInput(form.endsAt)} onChange={(e) => set('endsAt', fromLocalInput(e.target.value))} className={iosInputCls} />
        </FormField>
      </div>

      <label className="flex items-center justify-between gap-3 py-1">
        <span className="text-sm text-ios-label">Show to customers</span>
        <Switch checked={form.isActive} onChange={() => set('isActive', !form.isActive)} />
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={save.isPending || uploading}>
          {save.isPending ? 'Saving…' : banner ? 'Save changes' : 'Create banner'}
        </Button>
      </div>
    </form>
  );
}
