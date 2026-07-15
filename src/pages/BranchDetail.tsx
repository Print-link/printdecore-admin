import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Layers, MoreVertical, Link2, Search, ChevronRight } from 'lucide-react';
import {
  branchService,
  agentServiceService,
  categoryService,
  subCategoryService,
  serviceTemplateService,
} from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PricingConfigEditor } from '../components/PricingConfigEditor';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { FormField, iosInputCls } from '../components/ui/FormField';
import type { AgentService, ServiceCategory } from '../types';

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
            <div className="flex items-center gap-3 mb-4">
              {branch.coverImage ? (
                <img src={branch.coverImage} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-brand/15 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-hover" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ios-label tracking-tight">{branch.name}</h1>
                  <Badge variant={branch.status === 'active' || !branch.status ? 'success' : 'neutral'}>
                    {branch.status || 'Active'}
                  </Badge>
                </div>
                <p className="text-xs text-ios-secondary-label mt-0.5">{branch.totalServicesCount ?? 0} configured services</p>
              </div>
            </div>

            <ListGroup title="Branch Info">
              <ListRow leading={<Mail className="w-5 h-5 text-brand-hover" />} title="Email" trailing={<span className="text-sm text-ios-secondary-label">{branch.email || '-'}</span>} />
              <ListRow leading={<Phone className="w-5 h-5 text-brand-hover" />} title="Phone" trailing={<span className="text-sm text-ios-secondary-label">{branch.phoneNumber || '-'}</span>} />
              <ListRow leading={<MapPin className="w-5 h-5 text-brand-hover" />} title="Address" trailing={<span className="text-sm text-ios-secondary-label text-right max-w-[60%]">{branch.address || branch.location?.address || '-'}</span>} />
            </ListGroup>

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
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editing, setEditing] = useState<AgentService | null>(null);
  const [configuring, setConfiguring] = useState<AgentService | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subCategoryModalOpen, setSubCategoryModalOpen] = useState(false);

  const invalidateServices = () => queryClient.invalidateQueries({ queryKey: ['agent-services', branchId] });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['agent-services', branchId],
    queryFn: () => agentServiceService.getAll({ branchId }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentService> }) => agentServiceService.update(id, data),
    onSuccess: () => { invalidateServices(); toast.success('Service updated'); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update service'),
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => agentServiceService.update(id, { isActive }),
    onSuccess: invalidateServices,
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update service'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentServiceService.delete(id),
    onSuccess: () => { invalidateServices(); toast.success('Service unlinked from branch'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to unlink service'),
  });
  const savePricingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentService> }) => agentServiceService.update(id, data),
    onSuccess: () => { invalidateServices(); toast.success('Pricing saved'); setConfiguring(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save pricing'),
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editing.id,
      data: {
        pricePerUnit: form.get('pricePerUnit') ? Number(form.get('pricePerUnit')) : undefined,
        constant: form.get('constant') ? Number(form.get('constant')) : undefined,
        colorPriceModifier: form.get('colorPriceModifier') ? Number(form.get('colorPriceModifier')) : undefined,
        supportsPrintCut: form.get('supportsPrintCut') === 'on',
        supportsColor: form.get('supportsColor') === 'on',
        supportsFrontBack: form.get('supportsFrontBack') === 'on',
        supportsFrontOnly: form.get('supportsFrontOnly') === 'on',
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1 px-3.5">
        <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Configured Services</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setCategoryModalOpen(true)}>+ Category</Button>
          <Button size="sm" variant="secondary" onClick={() => setSubCategoryModalOpen(true)}>+ Sub-Category</Button>
          <Button size="sm" onClick={() => setLinkModalOpen(true)}>
            <Link2 className="w-3.5 h-3.5" /> Link Service
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5 [&>*:first-child]:rounded-t-ios [&>*:last-child]:rounded-b-ios">
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => setConfiguring(s)}
              className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-ios-gray6"
            >
              <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-brand-hover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-ios-label truncate">{s.serviceTemplate?.name || s.serviceName || '-'}</p>
                  {!!s.pricingConfig?.baseConfigurations?.length && <Badge variant="warning">Flexible</Badge>}
                </div>
                <p className="text-xs text-ios-secondary-label truncate mt-0.5">
                  {s.category?.name || '-'} {s.subCategory?.name ? `› ${s.subCategory.name}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-sm text-ios-label">
                {s.pricingConfig?.baseConfigurations?.length ? (
                  `From GHS ${Math.min(...s.pricingConfig.baseConfigurations.map((bc) => bc.unitPrice)).toFixed(2)}`
                ) : s.pricePerUnit != null ? (
                  `GHS ${Number(s.pricePerUnit).toFixed(2)}`
                ) : (
                  <span className="text-ios-orange text-xs">Not set</span>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <Switch checked={s.isActive} onChange={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })} />
              </div>
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
                    <button onClick={() => { setEditing(s); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit rate</button>
                    <button
                      onClick={() => { if (confirm(`Unlink "${s.serviceTemplate?.name || s.serviceName}" from this branch?`)) deleteMutation.mutate(s.id); setOpenMenuId(null); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10"
                    >
                      Unlink
                    </button>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-ios-gray3 shrink-0" />
            </div>
          ))}
          {services.length === 0 && (
            <div className="px-4 py-12 text-center text-ios-gray text-sm">No services configured for this branch yet</div>
          )}
        </div>
      )}

      {/* Edit service modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Rate & Capabilities">
        {editing && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Price per unit (GHS)">
                <input name="pricePerUnit" type="number" min="0" step="0.01" defaultValue={editing.pricePerUnit} className={iosInputCls} />
              </FormField>
              <FormField label="Constant">
                <input name="constant" type="number" min="0" step="0.01" defaultValue={editing.constant} className={iosInputCls} />
              </FormField>
              <FormField label="Color modifier">
                <input name="colorPriceModifier" type="number" min="0" step="0.01" defaultValue={editing.colorPriceModifier} className={iosInputCls} />
              </FormField>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-ios-label">
                <input type="checkbox" name="supportsFrontBack" defaultChecked={editing.supportsFrontBack} /> Front &amp; back
              </label>
              <label className="flex items-center gap-2 text-sm text-ios-label">
                <input type="checkbox" name="supportsFrontOnly" defaultChecked={editing.supportsFrontOnly} /> Front only
              </label>
              <label className="flex items-center gap-2 text-sm text-ios-label">
                <input type="checkbox" name="supportsColor" defaultChecked={editing.supportsColor} /> Color
              </label>
              <label className="flex items-center gap-2 text-sm text-ios-label">
                <input type="checkbox" name="supportsPrintCut" defaultChecked={editing.supportsPrintCut} /> Print &amp; cut
              </label>
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-full py-2.5">
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        )}
      </Modal>

      {configuring && (
        <PricingConfigEditor
          title={configuring.serviceTemplate?.name || configuring.serviceName || 'Service'}
          subtitle="Branch pricing configuration"
          initialConfig={configuring.pricingConfig}
          fallbackPrice={configuring.pricePerUnit}
          isOpen
          isSaving={savePricingMutation.isPending}
          onClose={() => setConfiguring(null)}
          onSave={(config, activate) => savePricingMutation.mutate({
            id: configuring.id,
            data: { pricingConfig: config, ...(activate ? { isActive: true } : {}) },
          })}
        />
      )}

      <LinkServiceModal
        branchId={branchId}
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        existingServiceTemplateIds={services.map((s) => s.serviceTemplateId)}
      />
      <CreateBranchCategoryModal branchId={branchId} isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      <CreateBranchSubCategoryModal branchId={branchId} isOpen={subCategoryModalOpen} onClose={() => setSubCategoryModalOpen(false)} />
    </div>
  );
}

// ─── Link an already-configured service template (from the Services catalogue) to this branch ─

function LinkServiceModal({
  branchId,
  isOpen,
  onClose,
  existingServiceTemplateIds,
}: {
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
  existingServiceTemplateIds: string[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => categoryService.getAll(branchId),
    enabled: isOpen,
  });
  const { data: subCategories = [] } = useQuery({
    queryKey: ['sub-categories', branchId],
    queryFn: () => subCategoryService.getAll(undefined, branchId),
    enabled: isOpen,
  });
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['service-templates', branchId],
    queryFn: () => serviceTemplateService.getAll(undefined, branchId),
    enabled: isOpen,
  });

  const subCategoryName = (id: string) => subCategories.find((s) => s.id === id)?.name;
  const categoryName = (subCategoryId: string) => {
    const sub = subCategories.find((s) => s.id === subCategoryId);
    return sub ? categories.find((c) => c.id === sub.categoryId)?.name : undefined;
  };

  const eligibleTemplates = templates
    .filter((t) => !existingServiceTemplateIds.includes(t.id))
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const createMutation = useMutation({
    mutationFn: agentServiceService.create,
    onMutate: (data) => setLinkingId(data.serviceTemplateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-services', branchId] });
      toast.success('Service linked to branch');
      handleClose();
    },
    onError: (e: any) => { toast.error(e.response?.data?.message || 'Failed to link service'); setLinkingId(null); },
  });

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Link Service to Branch" size="large">
      <div className="space-y-3">
        <p className="text-xs text-ios-secondary-label">
          Pick from services already configured in the catalogue — pricing carries over automatically.
        </p>
        <div className="relative">
          <Search className="w-4 h-4 text-ios-gray absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className={`${iosInputCls} pl-9`}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-ios border border-ios-gray5 divide-y divide-ios-gray5 max-h-96 overflow-y-auto">
            {eligibleTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate({ branchId, serviceTemplateId: t.id })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-ios-gray6 disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-brand-hover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ios-label truncate">{t.name}</p>
                  <p className="text-xs text-ios-secondary-label truncate mt-0.5">
                    {categoryName(t.subCategoryId) || '-'} {subCategoryName(t.subCategoryId) ? `› ${subCategoryName(t.subCategoryId)}` : ''}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {t.pricingConfig?.baseConfigurations?.length ? (
                    <>
                      <Badge variant="warning">Flexible</Badge>
                      <span className="text-sm text-ios-label">From GHS {Math.min(...t.pricingConfig.baseConfigurations.map((bc) => bc.unitPrice)).toFixed(2)}</span>
                    </>
                  ) : t.pricePerUnit != null ? (
                    <span className="text-sm text-ios-label">GHS {t.pricePerUnit.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-ios-orange">Not set</span>
                  )}
                  {linkingId === t.id && createMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Link2 className="w-4 h-4 text-ios-gray" />
                  )}
                </div>
              </button>
            ))}
            {eligibleTemplates.length === 0 && (
              <div className="px-4 py-8 text-center text-ios-gray text-sm">
                {templates.length === 0 ? 'No services in the catalogue yet — add one in Services first.' : 'No unlinked services match your search.'}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
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
