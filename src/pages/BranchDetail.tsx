import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Layers, MoreVertical, Star, Crown, Percent, Clock, Pencil } from 'lucide-react';
import {
  branchService,
  agentServiceService,
  categoryService,
  subCategoryService,
} from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { VendorModeCard } from '../components/branch/VendorModeCard';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { getStoreOpenStatus, orderedDays, currentDayKey, formatHourRange, WEEKDAY_LABELS } from '../utils/storeHours';
import type { ServiceCategory } from '../types';
import { Can } from '../components/Can';

const TIER_LABEL: Record<string, string> = {
  '2x': '🔥 2x Performer',
  '3x': '🔥 3x Performer',
  '4x': '🔥 4x Performer',
  '5x': '🔥 5x Performer',
  diamond: '💎 Diamond Partner',
};

export const BranchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const branchId = id!;

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => branchService.getById(branchId),
  });

  return (
    <Layout>
      <div>
        <button onClick={() => navigate('/branches')} className="flex items-center gap-1 text-sm font-medium text-brand-hover hover:opacity-70 mb-3">
          <ArrowLeft className="w-4 h-4" /> Branches
        </button>

        {branchLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : !branch ? (
          <p className="text-sm text-ios-gray">Branch not found.</p>
        ) : (
          <>
            {/* Storefront hero */}
            <div className="relative rounded-ios overflow-hidden shadow-ios mb-4">
              <div className="h-40 sm:h-52 relative">
                {branch.coverImage ? (
                  <img src={branch.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-brand/50 via-brand/20 to-ios-gray6 flex items-center justify-center">
                    <Building2 className="w-14 h-14 text-brand-hover/60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-black/0" />
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full backdrop-blur bg-white/90 ${branch.status === 'active' || !branch.status ? 'text-ios-green' : 'text-ios-secondary-label'}`}>
                  {branch.status || 'Active'}
                </span>
                <Can permission="branches.manage" branchId={branchId}>
                <button
                  onClick={() => navigate(`/branches/${branchId}/edit`)}
                  className="p-1.5 rounded-full bg-white/90 text-ios-label hover:bg-white backdrop-blur"
                  aria-label="Edit branch"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                </Can>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {branch.isMainBranch && (
                    <span className="inline-flex items-center gap-1 bg-brand text-ios-label text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" /> Flagship Store
                    </span>
                  )}
                  {branch.performanceTier && TIER_LABEL[branch.performanceTier] && (
                    <span className="inline-flex items-center gap-1 bg-white/90 text-ios-label text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {TIER_LABEL[branch.performanceTier]}
                    </span>
                  )}
                  {(() => {
                    const open = getStoreOpenStatus(branch.operatingHours);
                    if (open.isOpen === null) return null;
                    return (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${open.isOpen ? 'bg-ios-green text-white' : 'bg-black/40 text-white'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${open.isOpen ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
                        {open.label}
                      </span>
                    );
                  })()}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow">{branch.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-white/90 text-xs">
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5" fill={i <= Math.round(branch.averageRating) ? 'currentColor' : 'none'} />
                    ))}
                    <span className="ml-1">
                      {branch.averageRating ? branch.averageRating.toFixed(1) : 'No ratings yet'}
                      {branch.totalRatings ? ` (${branch.totalRatings})` : ''}
                    </span>
                  </span>
                  <span>{branch.totalServicesCount ?? 0} services</span>
                </div>
              </div>
            </div>

            {branch.activeDiscount && (
              <div className="flex items-center gap-2 bg-linear-to-r from-brand/20 to-brand/5 border border-brand/30 rounded-ios px-4 py-2.5 mb-4">
                <Percent className="w-4 h-4 text-brand-hover shrink-0" />
                <p className="text-sm text-ios-label">
                  <span className="font-semibold">{branch.activeDiscount.name}</span> — code{' '}
                  <span className="font-mono font-semibold">{branch.activeDiscount.code}</span> (
                  {branch.activeDiscount.discountType === 'percentage'
                    ? `${branch.activeDiscount.discountValue}% off`
                    : `${branch.activeDiscount.currency} ${branch.activeDiscount.discountValue} off`}
                  )
                </p>
              </div>
            )}

            <VendorModeCard branchId={branchId} />

            <ListGroup title="Store Info">
              <ListRow leading={<Mail className="w-5 h-5 text-brand-hover" />} title="Email" trailing={<span className="text-sm text-ios-secondary-label">{branch.email || '-'}</span>} />
              <ListRow leading={<Phone className="w-5 h-5 text-brand-hover" />} title="Phone" trailing={<span className="text-sm text-ios-secondary-label">{branch.phoneNumber || '-'}</span>} />
              <ListRow leading={<MapPin className="w-5 h-5 text-brand-hover" />} title="Address" trailing={<span className="text-sm text-ios-secondary-label text-right max-w-[60%]">{branch.address || branch.location?.address || '-'}</span>} />
            </ListGroup>

            {branch.operatingHours && Object.keys(branch.operatingHours).length > 0 && (
              <ListGroup title="Opening Hours">
                {orderedDays().map((day) => {
                  const hours = branch.operatingHours![day];
                  const isToday = day === currentDayKey();
                  return (
                    <ListRow
                      key={day}
                      leading={<Clock className={`w-5 h-5 ${isToday ? 'text-brand-hover' : 'text-ios-gray3'}`} />}
                      title={<span className={isToday ? 'font-semibold text-ios-label' : ''}>{WEEKDAY_LABELS[day]}{isToday ? ' · Today' : ''}</span>}
                      trailing={<span className="text-sm text-ios-secondary-label">{hours ? formatHourRange(hours) : 'Closed'}</span>}
                    />
                  );
                })}
              </ListGroup>
            )}

            <BranchServices branchId={branchId} />
          </>
        )}
      </div>
    </Layout>
  );
};

// ─── Services configured for this branch ──────────────────────────────

function BranchServices({ branchId }: { branchId: string }) {
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subCategoryModalOpen, setSubCategoryModalOpen] = useState(false);

  const invalidateServices = () => queryClient.invalidateQueries({ queryKey: ['agent-services', branchId] });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['agent-services', branchId],
    queryFn: () => agentServiceService.getAll({ branchId }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => agentServiceService.update(id, { isActive }),
    onSuccess: invalidateServices,
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update service'),
  });
  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => agentServiceService.setPrimary(id),
    onSuccess: () => { invalidateServices(); toast.success('Set as primary — this is what customers near this branch see on Home'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to set primary service'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentServiceService.delete(id),
    onSuccess: () => { invalidateServices(); toast.success('Service unlinked from branch'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to unlink service'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1 px-3.5">
        <div>
          <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Products</p>
          <p className="text-xs text-ios-gray mt-0.5">The vendor adds products and sets prices in their app, under Products and prices.</p>
        </div>
        <Can permission="catalog.manage">
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setCategoryModalOpen(true)}>+ Category</Button>
          <Button size="sm" variant="secondary" onClick={() => setSubCategoryModalOpen(true)}>+ Sub-Category</Button>
        </div>
        </Can>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5 [&>*:first-child]:rounded-t-ios [&>*:last-child]:rounded-b-ios">
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3.5 py-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-brand-hover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-ios-label truncate">{s.serviceTemplate?.name || s.serviceName || '-'}</p>
                </div>
                <p className="text-xs text-ios-secondary-label truncate mt-0.5">
                  {s.category?.name || '-'} {s.subCategory?.name ? `› ${s.subCategory.name}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-xs text-ios-secondary-label">
                {s.isActive ? 'On sale' : 'Not on sale'}
              </div>
              <Can permission="catalog.manage">
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <Switch checked={s.isActive} onChange={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (!s.isPrimary) setPrimaryMutation.mutate(s.id); }}
                className={`p-1.5 rounded-full shrink-0 ${s.isPrimary ? 'text-ios-orange' : 'text-ios-gray hover:bg-ios-gray6'}`}
                title={s.isPrimary ? 'Primary service for this branch' : 'Set as primary (shown on the mobile Home screen)'}
                type="button"
              >
                <Star className="w-4 h-4" fill={s.isPrimary ? 'currentColor' : 'none'} />
              </button>
              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                  className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                  type="button"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuId === s.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                    <button
                      onClick={() => { if (confirm(`Unlink "${s.serviceTemplate?.name || s.serviceName}" from this branch?`)) deleteMutation.mutate(s.id); setOpenMenuId(null); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10"
                    >
                      Unlink
                    </button>
                  </div>
                )}
              </div>
              </Can>
            </div>
          ))}
          {services.length === 0 && (
            <div className="px-4 py-12 text-center text-ios-gray text-sm">No services configured for this branch yet</div>
          )}
        </div>
      )}



      <CreateBranchCategoryModal branchId={branchId} isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      <CreateBranchSubCategoryModal branchId={branchId} isOpen={subCategoryModalOpen} onClose={() => setSubCategoryModalOpen(false)} />
    </div>
  );
}

// ─── Create a new category owned by this branch ───────────────────────

function CreateBranchCategoryModal({ branchId, isOpen, onClose }: { branchId: string; isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: FormData) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', branchId] });
      toast.success('Branch category created');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create category'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('branchId', branchId);
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Branch Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-ios-secondary-label">
          Creates a category owned only by this branch — it won't be available to other branches.
        </p>
        <FormField label="Name">
          <input name="name" required className={iosInputCls} />
        </FormField>
        <FormField label="Description">
          <textarea name="description" rows={2} className={iosInputCls} />
        </FormField>
        <FormField label="Image">
          <input name="image" type="file" accept="image/*" className={iosInputCls} />
        </FormField>
        <Button type="submit" disabled={createMutation.isPending} className="w-full py-2.5">
          {createMutation.isPending ? 'Saving…' : 'Create category'}
        </Button>
      </form>
    </Modal>
  );
}

// ─── Create a new sub-category owned by this branch ────────────────────

function CreateBranchSubCategoryModal({ branchId, isOpen, onClose }: { branchId: string; isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['categories', branchId],
    queryFn: () => categoryService.getAll(branchId),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => subCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-categories', branchId] });
      toast.success('Branch sub-category created');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create sub-category'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('branchId', branchId);
    createMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Branch Sub-Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-ios-secondary-label">
          Creates a sub-category owned only by this branch — it won't be available to other branches.
        </p>
        <FormField label="Category">
          <select name="categoryId" required className={iosInputCls}>
            <option value="">Select a category</option>
            {categories.map((c: ServiceCategory) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Name">
          <input name="name" required className={iosInputCls} />
        </FormField>
        <FormField label="Pricing type">
          <select name="pricingType" defaultValue="UNIT_BASED" required className={iosInputCls}>
            <option value="AREA_BASED">Area based</option>
            <option value="UNIT_BASED">Unit based</option>
            <option value="MIXED">Mixed</option>
            <option value="CUSTOM_QUOTE">Custom quote</option>
          </select>
        </FormField>
        <FormField label="Description">
          <textarea name="description" rows={2} className={iosInputCls} />
        </FormField>
        <FormField label="Image">
          <input name="image" type="file" accept="image/*" className={iosInputCls} />
        </FormField>
        <Button type="submit" disabled={createMutation.isPending} className="w-full py-2.5">
          {createMutation.isPending ? 'Saving…' : 'Create sub-category'}
        </Button>
      </form>
    </Modal>
  );
}
