import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FolderOpen, Layers, MoreVertical, SlidersHorizontal } from 'lucide-react';
import {
  categoryService,
  subCategoryService,
  serviceTemplateService,
  pricingFormulaService,
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
import type { ServiceCategory, ServiceSubCategory, ServiceTemplate } from '../types';

type Tab = 'categories' | 'subcategories' | 'templates';

export const Services = () => {
  const [tab, setTab] = useState<Tab>('categories');

  return (
    <Layout>
      <div>
        <PageHeader
          title="Services"
          subtitle="The customer-facing catalogue — categories, sub-categories, and the price Printdecore charges for each service."
        />

        <div className="flex gap-1 mb-6 border-b border-ios-gray5">
          {(['categories', 'subcategories', 'templates'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-brand-hover text-brand-hover' : 'border-transparent text-ios-secondary-label hover:text-ios-label'
              }`}
            >
              {t === 'categories' ? 'Categories' : t === 'subcategories' ? 'Sub-Categories' : 'Service Templates'}
            </button>
          ))}
        </div>

        {tab === 'categories' && <CategoriesTab />}
        {tab === 'subcategories' && <SubCategoriesTab />}
        {tab === 'templates' && <TemplatesTab />}
      </div>
    </Layout>
  );
};

// ─── Categories ──────────────────────────────────────────────────────

function CategoriesTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => categoryService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); setModalOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create category'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => categoryService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated'); setModalOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update category'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete category'),
  });
  const setPopularMutation = useMutation({
    mutationFn: ({ id, isPopular }: { id: string; isPopular: boolean }) => categoryService.setPopular(id, isPopular),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update category'),
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: ServiceCategory) => { setEditing(c); setModalOpen(true); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={openCreate}>Add Category</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <ListGroup>
          {categories.map((c) => (
            <ListRow
              key={c.id}
              leading={
                <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-brand-hover" />
                </div>
              }
              title={c.name}
              subtitle={c.description || '-'}
              trailing={
                <>
                <div onClick={(e) => e.stopPropagation()} title="Popular (shown on the mobile Home screen)">
                  <Switch checked={!!c.isPopular} onChange={() => setPopularMutation.mutate({ id: c.id, isPopular: !c.isPopular })} />
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                    className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                    type="button"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === c.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                      <button onClick={() => { openEdit(c); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                      <button
                        onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id); setOpenMenuId(null); }}
                        className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                </>
              }
            />
          ))}
          {categories.length === 0 && (
            <div className="px-4 py-12 text-center text-ios-gray text-sm">No categories yet</div>
          )}
        </ListGroup>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name">
            <input name="name" defaultValue={editing?.name} required className={iosInputCls} />
          </FormField>
          <FormField label="Description">
            <textarea name="description" defaultValue={editing?.description} rows={2} className={iosInputCls} />
          </FormField>
          <FormField label="Image">
            <input name="image" type="file" accept="image/*" className={iosInputCls} />
          </FormField>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

// ─── Sub-Categories ──────────────────────────────────────────────────

function SubCategoriesTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceSubCategory | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoryService.getAll() });
  const { data: subCategories = [], isLoading } = useQuery({
    queryKey: ['sub-categories'],
    queryFn: () => subCategoryService.getAll(),
  });

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name || id;

  const createMutation = useMutation({
    mutationFn: (data: FormData) => subCategoryService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sub-categories'] }); toast.success('Sub-category created'); setModalOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create sub-category'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => subCategoryService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sub-categories'] }); toast.success('Sub-category updated'); setModalOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update sub-category'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subCategoryService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sub-categories'] }); toast.success('Sub-category deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete sub-category'),
  });
  const setPopularMutation = useMutation({
    mutationFn: ({ id, isPopular }: { id: string; isPopular: boolean }) => subCategoryService.setPopular(id, isPopular),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-categories'] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update sub-category'),
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: ServiceSubCategory) => { setEditing(s); setModalOpen(true); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={openCreate} disabled={categories.length === 0}>Add Sub-Category</Button>
      </div>
      {categories.length === 0 && <p className="text-sm text-ios-gray mb-3">Add a category first.</p>}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <ListGroup>
          {subCategories.map((s) => (
            <ListRow
              key={s.id}
              leading={
                <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-brand-hover" />
                </div>
              }
              title={s.name}
              subtitle={categoryName(s.categoryId)}
              trailing={
                <>
                  <Badge variant="neutral">{s.pricingType.replace(/_/g, ' ')}</Badge>
                  <div onClick={(e) => e.stopPropagation()} title="Popular (shown on the mobile Home screen)">
                    <Switch checked={!!s.isPopular} onChange={() => setPopularMutation.mutate({ id: s.id, isPopular: !s.isPopular })} />
                  </div>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                        <button onClick={() => { openEdit(s); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                        <button
                          onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); setOpenMenuId(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              }
            />
          ))}
          {subCategories.length === 0 && (
            <div className="px-4 py-12 text-center text-ios-gray text-sm">No sub-categories yet</div>
          )}
        </ListGroup>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Sub-Category' : 'Add Sub-Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Category">
            <select name="categoryId" defaultValue={editing?.categoryId} required className={iosInputCls}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Name">
            <input name="name" defaultValue={editing?.name} required className={iosInputCls} />
          </FormField>
          <FormField label="Pricing type">
            <select name="pricingType" defaultValue={editing?.pricingType || 'UNIT_BASED'} required className={iosInputCls}>
              <option value="AREA_BASED">Area based</option>
              <option value="UNIT_BASED">Unit based</option>
              <option value="MIXED">Mixed</option>
              <option value="CUSTOM_QUOTE">Custom quote</option>
            </select>
          </FormField>
          <FormField label="Description">
            <textarea name="description" defaultValue={editing?.description} rows={2} className={iosInputCls} />
          </FormField>
          <FormField label="Image">
            <input name="image" type="file" accept="image/*" className={iosInputCls} />
          </FormField>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create sub-category'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

// ─── Service Templates (the priced catalogue entries) ───────────────

function TemplatesTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTemplate | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<ServiceTemplate | null>(null);

  const { data: subCategories = [] } = useQuery({ queryKey: ['sub-categories'], queryFn: () => subCategoryService.getAll() });
  const { data: formulas = [] } = useQuery({ queryKey: ['pricing-formulas'], queryFn: pricingFormulaService.getAll });
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['service-templates'],
    queryFn: () => serviceTemplateService.getAll(),
  });

  const subCategoryName = (id: string) => subCategories.find((s) => s.id === id)?.name || id;

  const createMutation = useMutation({
    mutationFn: (data: Partial<ServiceTemplate>) => serviceTemplateService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-templates'] }); toast.success('Service created'); setModalOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create service'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceTemplate> }) => serviceTemplateService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-templates'] }); toast.success('Service updated'); setModalOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update service'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceTemplateService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-templates'] }); toast.success('Service deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete service'),
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => serviceTemplateService.update(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-templates'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update service'),
  });
  const savePricingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceTemplate> }) => serviceTemplateService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-templates'] }); toast.success('Pricing saved'); setConfiguring(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save pricing'),
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: ServiceTemplate) => { setEditing(t); setModalOpen(true); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Partial<ServiceTemplate> = {
      subCategoryId: String(form.get('subCategoryId')),
      name: String(form.get('name')),
      measurementUnit: form.get('measurementUnit') as ServiceTemplate['measurementUnit'],
      pricingFormulaId: String(form.get('pricingFormulaId')),
      pricePerUnit: form.get('pricePerUnit') ? Number(form.get('pricePerUnit')) : undefined,
      constant: form.get('constant') ? Number(form.get('constant')) : undefined,
      colorPriceModifier: form.get('colorPriceModifier') ? Number(form.get('colorPriceModifier')) : undefined,
      supportsFrontBack: form.get('supportsFrontBack') === 'on',
      supportsColor: form.get('supportsColor') === 'on',
      supportsPrintCut: form.get('supportsPrintCut') === 'on',
      allowsCustomSize: form.get('allowsCustomSize') === 'on',
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={openCreate} disabled={subCategories.length === 0}>Add Service</Button>
      </div>
      {subCategories.length === 0 && <p className="text-sm text-ios-gray mb-3">Add a sub-category first.</p>}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5 [&>*:first-child]:rounded-t-ios [&>*:last-child]:rounded-b-ios">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-brand-hover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-ios-label truncate">{t.name}</p>
                  {!!t.pricingConfig?.baseConfigurations?.length && <Badge variant="warning">Flexible</Badge>}
                </div>
                <p className="text-xs text-ios-secondary-label truncate mt-0.5">{subCategoryName(t.subCategoryId)}</p>
              </div>
              <div className="shrink-0 text-sm text-ios-label">
                {t.pricingConfig?.baseConfigurations?.length ? (
                  `From GHS ${Math.min(...t.pricingConfig.baseConfigurations.map((bc) => bc.unitPrice)).toFixed(2)}`
                ) : t.pricePerUnit != null ? (
                  `GHS ${t.pricePerUnit.toFixed(2)}`
                ) : (
                  <span className="text-ios-orange text-xs">Not set</span>
                )}
              </div>
              <Switch checked={t.isActive} onChange={() => toggleActiveMutation.mutate({ id: t.id, isActive: !t.isActive })} />
              <div className="relative shrink-0">
                <button
                  onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                  className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                  type="button"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuId === t.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                    <button
                      onClick={() => { setConfiguring(t); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Configure Pricing
                    </button>
                    <button onClick={() => { openEdit(t); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                    <button
                      onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteMutation.mutate(t.id); setOpenMenuId(null); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="px-4 py-12 text-center text-ios-gray text-sm">No services yet</div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Service' : 'Add Service'} size="large">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sub-Category">
              <select name="subCategoryId" defaultValue={editing?.subCategoryId} required className={iosInputCls}>
                <option value="">Select a sub-category</option>
                {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Name">
              <input name="name" defaultValue={editing?.name} required className={iosInputCls} />
            </FormField>
            <FormField label="Measurement unit">
              <select name="measurementUnit" defaultValue={editing?.measurementUnit || 'UNIT'} required className={iosInputCls}>
                <option value="UNIT">Unit</option>
                <option value="FEET">Feet</option>
                <option value="INCH">Inch</option>
              </select>
            </FormField>
            <FormField label="Pricing formula">
              <select name="pricingFormulaId" defaultValue={editing?.pricingFormulaId} required className={iosInputCls}>
                <option value="">Select a formula</option>
                {formulas.map((f) => <option key={f.id} value={f.id}>{f.code} ({f.formulaType})</option>)}
              </select>
            </FormField>
          </div>

          <div className="border border-ios-gray5 rounded-ios p-4 bg-ios-gray6 space-y-3">
            <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Customer price</p>
            <p className="text-xs text-ios-gray -mt-2">
              What the customer pays. Separate from any vendor's own production rate.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Price per unit (GHS)">
                <input name="pricePerUnit" type="number" min="0" step="0.01" defaultValue={editing?.pricePerUnit} className={iosInputCls} />
              </FormField>
              <FormField label="Constant">
                <input name="constant" type="number" min="0" step="0.01" defaultValue={editing?.constant} className={iosInputCls} />
              </FormField>
              <FormField label="Color modifier">
                <input name="colorPriceModifier" type="number" min="0" step="0.01" defaultValue={editing?.colorPriceModifier} className={iosInputCls} />
              </FormField>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ios-label">
              <input type="checkbox" name="allowsCustomSize" defaultChecked={editing?.allowsCustomSize} /> Custom size
            </label>
            <label className="flex items-center gap-2 text-sm text-ios-label">
              <input type="checkbox" name="supportsFrontBack" defaultChecked={editing?.supportsFrontBack} /> Front &amp; back
            </label>
            <label className="flex items-center gap-2 text-sm text-ios-label">
              <input type="checkbox" name="supportsColor" defaultChecked={editing?.supportsColor} /> Color
            </label>
            <label className="flex items-center gap-2 text-sm text-ios-label">
              <input type="checkbox" name="supportsPrintCut" defaultChecked={editing?.supportsPrintCut} /> Print &amp; cut
            </label>
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-2.5"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create service'}
          </Button>
        </form>
      </Modal>

      {configuring && (
        <PricingConfigEditor
          title={configuring.name}
          source={{ serviceTemplateId: configuring.id }}
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
    </div>
  );
}
