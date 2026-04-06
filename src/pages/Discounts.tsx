import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountService, waitlistService, clientService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import type { Discount } from '../types';

export const Discounts = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [assigningDiscount, setAssigningDiscount] = useState<Discount | null>(null);
  const queryClient = useQueryClient();

  const { data: discounts, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Discount>) => discountService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Discount created'); setIsCreateOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Discount> }) => discountService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Discount updated'); setEditingDiscount(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => discountService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Discount deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => discountService.update(id, { isActive } as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      code: fd.get('code') as string,
      name: fd.get('name') as string,
      description: fd.get('description') as string || undefined,
      discountType: fd.get('discountType') as 'percentage' | 'fixed',
      discountValue: Number(fd.get('discountValue')),
      currency: fd.get('currency') as string || 'GHS',
      targetType: fd.get('targetType') as any || 'all',
      maxUses: fd.get('maxUses') ? Number(fd.get('maxUses')) : undefined,
      maxUsesPerCustomer: Number(fd.get('maxUsesPerCustomer')) || 1,
      minOrderAmount: fd.get('minOrderAmount') ? Number(fd.get('minOrderAmount')) : undefined,
      maxDiscountAmount: fd.get('maxDiscountAmount') ? Number(fd.get('maxDiscountAmount')) : undefined,
      expiresAt: fd.get('expiresAt') as string || undefined,
    } as any);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDiscount) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingDiscount.id,
      data: {
        name: fd.get('name') as string,
        description: fd.get('description') as string || undefined,
        discountValue: Number(fd.get('discountValue')),
        maxUses: fd.get('maxUses') ? Number(fd.get('maxUses')) : undefined,
        maxUsesPerCustomer: Number(fd.get('maxUsesPerCustomer')) || 1,
        minOrderAmount: fd.get('minOrderAmount') ? Number(fd.get('minOrderAmount')) : undefined,
        maxDiscountAmount: fd.get('maxDiscountAmount') ? Number(fd.get('maxDiscountAmount')) : undefined,
        expiresAt: fd.get('expiresAt') as string || undefined,
      } as any,
    });
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discounts & Promos</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for customers and waitlist</p>
          </div>
          <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
            Create Discount
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Target</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Usage</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {discounts?.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">{d.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${d.discountType === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {d.discountType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{d.discountType === 'percentage' ? `${d.discountValue}%` : `${d.currency} ${d.discountValue}`}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{d.targetType}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.currentUses}{d.maxUses != null ? `/${d.maxUses}` : ''}</td>
                    <td className="px-4 py-3 text-gray-500">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: d.id, isActive: !d.isActive })}
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {d.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setAssigningDiscount(d)} className="text-xs text-blue-600 hover:text-blue-800">Assign</button>
                        <button onClick={() => setEditingDiscount(d)} className="text-xs text-gray-600 hover:text-gray-900">Edit</button>
                        <button onClick={() => { if (window.confirm('Delete this discount?')) deleteMutation.mutate(d.id); }} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!discounts || discounts.length === 0) && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No discounts created yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Discount" size="large">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input type="text" name="code" required placeholder="WELCOME10" className={inputCls} style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" name="name" required placeholder="Welcome Discount" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" name="description" placeholder="Optional description" className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="discountType" required className={inputCls}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input type="number" name="discountValue" required step="0.01" min="0.01" placeholder="10" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select name="currency" className={inputCls}>
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <select name="targetType" className={inputCls}>
                  <option value="all">Everyone</option>
                  <option value="customer">Specific Customers</option>
                  <option value="waitlist">Waitlist Only</option>
                  <option value="branch">Specific Branch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input type="datetime-local" name="expiresAt" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Uses</label>
                <input type="number" name="maxUses" min="1" placeholder="Unlimited" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Per Customer</label>
                <input type="number" name="maxUsesPerCustomer" min="1" defaultValue="1" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                <input type="number" name="minOrderAmount" step="0.01" min="0" placeholder="No minimum" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount</label>
                <input type="number" name="maxDiscountAmount" step="0.01" min="0" placeholder="No cap" className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Discount'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={!!editingDiscount} onClose={() => setEditingDiscount(null)} title={`Edit ${editingDiscount?.code || ''}`} size="large">
          {editingDiscount && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" name="name" defaultValue={editingDiscount.name} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" name="description" defaultValue={editingDiscount.description} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input type="number" name="discountValue" defaultValue={editingDiscount.discountValue} step="0.01" min="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                  <input type="datetime-local" name="expiresAt" defaultValue={editingDiscount.expiresAt?.slice(0, 16)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Uses</label>
                  <input type="number" name="maxUses" defaultValue={editingDiscount.maxUses} min="1" placeholder="Unlimited" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Per Customer</label>
                  <input type="number" name="maxUsesPerCustomer" defaultValue={editingDiscount.maxUsesPerCustomer} min="1" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                  <input type="number" name="minOrderAmount" defaultValue={editingDiscount.minOrderAmount} step="0.01" min="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount</label>
                  <input type="number" name="maxDiscountAmount" defaultValue={editingDiscount.maxDiscountAmount} step="0.01" min="0" className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingDiscount(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Assign Modal */}
        <AssignModal discount={assigningDiscount} onClose={() => setAssigningDiscount(null)} />
      </div>
    </Layout>
  );
};

// --- Assign Discount Modal ---
function AssignModal({ discount, onClose }: { discount: Discount | null; onClose: () => void }) {
  const [tab, setTab] = useState<'waitlist' | 'customers'>('waitlist');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: waitlistEntries } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => waitlistService.getAll(),
    enabled: !!discount && tab === 'waitlist',
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-assign'],
    queryFn: () => clientService.getAll({ limit: 200 }),
    enabled: !!discount && tab === 'customers',
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      if (!discount) return Promise.reject();
      const ids = Array.from(selected);
      if (tab === 'waitlist') {
        return discountService.assign(discount.id, { waitlistIds: ids });
      }
      return discountService.assign(discount.id, { customerIds: ids });
    },
    onSuccess: (data) => {
      toast.success(`Assigned to ${data.assigned} recipient(s)`);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setSelected(new Set());
      onClose();
    },
    onError: () => toast.error('Failed to assign discount'),
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelected(prev => {
      if (prev.size === ids.length) return new Set();
      return new Set(ids);
    });
  };

  return (
    <Modal isOpen={!!discount} onClose={onClose} title={`Assign ${discount?.code || ''}`} size="large">
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setTab('waitlist'); setSelected(new Set()); }} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${tab === 'waitlist' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Waitlist</button>
          <button onClick={() => { setTab('customers'); setSelected(new Set()); }} className={`px-3 py-1.5 text-sm rounded-lg font-medium ${tab === 'customers' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Customers</button>
        </div>

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          {tab === 'waitlist' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">
                    <input type="checkbox" onChange={() => selectAll(waitlistEntries?.map(w => w.id) || [])} checked={selected.size > 0 && selected.size === waitlistEntries?.length} />
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waitlistEntries?.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggle(w.id)}>
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.has(w.id)} readOnly /></td>
                    <td className="px-3 py-2">{w.name || '-'}</td>
                    <td className="px-3 py-2 text-gray-600">{w.email}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${w.userType === 'vendor' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{w.userType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">
                    <input type="checkbox" onChange={() => selectAll(clientsData?.clients?.map((c: any) => c._id || c.id) || [])} checked={selected.size > 0 && selected.size === clientsData?.clients?.length} />
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientsData?.clients?.map((c: any) => {
                  const id = c._id || c.id;
                  return (
                    <tr key={id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggle(id)}>
                      <td className="px-3 py-2"><input type="checkbox" checked={selected.has(id)} readOnly /></td>
                      <td className="px-3 py-2">{c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{c.email}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">{selected.size} selected</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => assignMutation.mutate()}
              disabled={selected.size === 0 || assignMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning...' : `Assign to ${selected.size}`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
