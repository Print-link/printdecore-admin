import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  categoryService,
  subCategoryService,
  serviceTemplateService,
  pricingFormulaService,
} from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import type { ServiceCategory, ServiceSubCategory, ServiceTemplate } from '../types';

type Tab = 'categories' | 'subcategories' | 'templates';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent';
const labelCls = 'text-xs font-medium text-gray-500 block mb-1';

export const Services = () => {
  const [tab, setTab] = useState<Tab>('categories');

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Services</h1>
        <p className="text-sm text-gray-500 mb-6">
          The customer-facing catalogue — categories, sub-categories, and the price Printdecore charges for each service.
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['categories', 'subcategories', 'templates'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
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

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
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
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.description || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(c)} className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                    <button onClick={() => confirm(`Delete "${c.name}"?`) && deleteMutation.mutate(c.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-400">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input name="name" defaultValue={editing?.name} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" defaultValue={editing?.description} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Image</label>
            <input name="image" type="file" accept="image/*" className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-40"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
          </button>
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

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getAll });
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
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} disabled={categories.length === 0} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40">
          Add Sub-Category
        </button>
      </div>
      {categories.length === 0 && <p className="text-sm text-gray-400 mb-4">Add a category first.</p>}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pricing Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subCategories.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{categoryName(s.categoryId)}</td>
                  <td className="px-4 py-3 text-gray-600">{s.pricingType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(s)} className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                    <button onClick={() => confirm(`Delete "${s.name}"?`) && deleteMutation.mutate(s.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {subCategories.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No sub-categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Sub-Category' : 'Add Sub-Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Category</label>
            <select name="categoryId" defaultValue={editing?.categoryId} required className={inputCls}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input name="name" defaultValue={editing?.name} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Pricing type</label>
            <select name="pricingType" defaultValue={editing?.pricingType || 'UNIT_BASED'} required className={inputCls}>
              <option value="AREA_BASED">Area based</option>
              <option value="UNIT_BASED">Unit based</option>
              <option value="MIXED">Mixed</option>
              <option value="CUSTOM_QUOTE">Custom quote</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" defaultValue={editing?.description} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Image</label>
            <input name="image" type="file" accept="image/*" className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-40"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create sub-category'}
          </button>
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
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} disabled={subCategories.length === 0} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40">
          Add Service
        </button>
      </div>
      {subCategories.length === 0 && <p className="text-sm text-gray-400 mb-4">Add a sub-category first.</p>}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sub-Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Customer Price</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Active</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{subCategoryName(t.subCategoryId)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {t.pricePerUnit != null ? `GHS ${t.pricePerUnit.toFixed(2)}` : <span className="text-amber-600">Not set</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: t.id, isActive: !t.isActive })}
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(t)} className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                    <button onClick={() => confirm(`Delete "${t.name}"?`) && deleteMutation.mutate(t.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No services yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Service' : 'Add Service'} size="large">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sub-Category</label>
              <select name="subCategoryId" defaultValue={editing?.subCategoryId} required className={inputCls}>
                <option value="">Select a sub-category</option>
                {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Name</label>
              <input name="name" defaultValue={editing?.name} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Measurement unit</label>
              <select name="measurementUnit" defaultValue={editing?.measurementUnit || 'UNIT'} required className={inputCls}>
                <option value="UNIT">Unit</option>
                <option value="FEET">Feet</option>
                <option value="INCH">Inch</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Pricing formula</label>
              <select name="pricingFormulaId" defaultValue={editing?.pricingFormulaId} required className={inputCls}>
                <option value="">Select a formula</option>
                {formulas.map((f) => <option key={f.id} value={f.id}>{f.code} ({f.formulaType})</option>)}
              </select>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer price</p>
            <p className="text-xs text-gray-400 -mt-2">
              What the customer pays. Separate from any vendor's own production rate.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Price per unit (GHS)</label>
                <input name="pricePerUnit" type="number" min="0" step="0.01" defaultValue={editing?.pricePerUnit} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Constant</label>
                <input name="constant" type="number" min="0" step="0.01" defaultValue={editing?.constant} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color modifier</label>
                <input name="colorPriceModifier" type="number" min="0" step="0.01" defaultValue={editing?.colorPriceModifier} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="allowsCustomSize" defaultChecked={editing?.allowsCustomSize} /> Custom size
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="supportsFrontBack" defaultChecked={editing?.supportsFrontBack} /> Front &amp; back
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="supportsColor" defaultChecked={editing?.supportsColor} /> Color
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="supportsPrintCut" defaultChecked={editing?.supportsPrintCut} /> Print &amp; cut
            </label>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-40"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create service'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
