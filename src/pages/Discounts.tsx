import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Tag } from 'lucide-react';
import { discountService, waitlistService, clientService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { FormField, iosInputCls } from '../components/ui/FormField';
import toast from 'react-hot-toast';
import type { Discount } from '../types';

export const Discounts = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [assigningDiscount, setAssigningDiscount] = useState<Discount | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openMenuId]);

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

  return (
    <Layout>
      <div>
        <PageHeader
          title="Discounts & Promos"
          subtitle="Create and manage discount codes for customers and waitlist"
          actions={<Button size="sm" onClick={() => setIsCreateOpen(true)}>Create Discount</Button>}
        />

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <ListGroup>
            {discounts?.map((d) => {
              const valueLabel = d.discountType === 'percentage' ? `${d.discountValue}%` : `${d.currency} ${d.discountValue}`;
              const usesLabel = `${d.currentUses}${d.maxUses != null ? `/${d.maxUses}` : ''} uses`;
              const expiryLabel = d.expiresAt ? `Expires ${new Date(d.expiresAt).toLocaleDateString()}` : 'No expiry';
              return (
                <ListRow
                  key={d.id}
                  leading={
                    <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-brand-hover" />
                    </div>
                  }
                  title={`${d.name} · ${d.code}`}
                  subtitle={`${valueLabel} · ${d.targetType} · ${usesLabel} · ${expiryLabel}`}
                  trailing={
                    <>
                      <Switch checked={d.isActive} onChange={() => toggleMutation.mutate({ id: d.id, isActive: !d.isActive })} />
                      <div className="relative" ref={(el) => { dropdownRefs.current[d.id] = el; }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                          className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                          type="button"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === d.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                            <button onClick={() => { setAssigningDiscount(d); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Assign</button>
                            <button onClick={() => { setEditingDiscount(d); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                            <button onClick={() => { if (window.confirm('Delete this discount?')) deleteMutation.mutate(d.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10">Delete</button>
                          </div>
                        )}
                      </div>
                    </>
                  }
                />
              );
            })}
            {(!discounts || discounts.length === 0) && (
              <div className="px-4 py-12 text-center text-ios-gray">No discounts created yet</div>
            )}
          </ListGroup>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Discount" size="large">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Code">
                <input type="text" name="code" required placeholder="WELCOME10" className={iosInputCls} style={{ textTransform: 'uppercase' }} />
              </FormField>
              <FormField label="Name">
                <input type="text" name="name" required placeholder="Welcome Discount" className={iosInputCls} />
              </FormField>
            </div>
            <FormField label="Description">
              <input type="text" name="description" placeholder="Optional description" className={iosInputCls} />
            </FormField>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Type">
                <select name="discountType" required className={iosInputCls}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </FormField>
              <FormField label="Value">
                <input type="number" name="discountValue" required step="0.01" min="0.01" placeholder="10" className={iosInputCls} />
              </FormField>
              <FormField label="Currency">
                <select name="currency" className={iosInputCls}>
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Target">
                <select name="targetType" className={iosInputCls}>
                  <option value="all">Everyone</option>
                  <option value="customer">Specific Customers</option>
                  <option value="waitlist">Waitlist Only</option>
                  <option value="branch">Specific Branch</option>
                </select>
              </FormField>
              <FormField label="Expires At">
                <input type="datetime-local" name="expiresAt" className={iosInputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Max Total Uses">
                <input type="number" name="maxUses" min="1" placeholder="Unlimited" className={iosInputCls} />
              </FormField>
              <FormField label="Max Per Customer">
                <input type="number" name="maxUsesPerCustomer" min="1" defaultValue="1" className={iosInputCls} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Min Order Amount">
                <input type="number" name="minOrderAmount" step="0.01" min="0" placeholder="No minimum" className={iosInputCls} />
              </FormField>
              <FormField label="Max Discount Amount">
                <input type="number" name="maxDiscountAmount" step="0.01" min="0" placeholder="No cap" className={iosInputCls} />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Discount'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={!!editingDiscount} onClose={() => setEditingDiscount(null)} title={`Edit ${editingDiscount?.code || ''}`} size="large">
          {editingDiscount && (
            <form onSubmit={handleEdit} className="space-y-4">
              <FormField label="Name">
                <input type="text" name="name" defaultValue={editingDiscount.name} required className={iosInputCls} />
              </FormField>
              <FormField label="Description">
                <input type="text" name="description" defaultValue={editingDiscount.description} className={iosInputCls} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Value">
                  <input type="number" name="discountValue" defaultValue={editingDiscount.discountValue} step="0.01" min="0.01" className={iosInputCls} />
                </FormField>
                <FormField label="Expires At">
                  <input type="datetime-local" name="expiresAt" defaultValue={editingDiscount.expiresAt?.slice(0, 16)} className={iosInputCls} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Max Total Uses">
                  <input type="number" name="maxUses" defaultValue={editingDiscount.maxUses} min="1" placeholder="Unlimited" className={iosInputCls} />
                </FormField>
                <FormField label="Max Per Customer">
                  <input type="number" name="maxUsesPerCustomer" defaultValue={editingDiscount.maxUsesPerCustomer} min="1" className={iosInputCls} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Min Order Amount">
                  <input type="number" name="minOrderAmount" defaultValue={editingDiscount.minOrderAmount} step="0.01" min="0" className={iosInputCls} />
                </FormField>
                <FormField label="Max Discount Amount">
                  <input type="number" name="maxDiscountAmount" defaultValue={editingDiscount.maxDiscountAmount} step="0.01" min="0" className={iosInputCls} />
                </FormField>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditingDiscount(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
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

  const waitlistIds = waitlistEntries?.map(w => w.id) || [];
  const clientIds = clientsData?.clients?.map((c: any) => c._id || c.id) || [];
  const currentIds = tab === 'waitlist' ? waitlistIds : clientIds;

  return (
    <Modal isOpen={!!discount} onClose={onClose} title={`Assign ${discount?.code || ''}`} size="large">
      <div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setTab('waitlist'); setSelected(new Set()); }}
            className={`px-3 py-1.5 text-sm rounded-full font-medium ${tab === 'waitlist' ? 'bg-brand text-ios-label' : 'bg-ios-gray6 text-ios-secondary-label'}`}
          >
            Waitlist
          </button>
          <button
            onClick={() => { setTab('customers'); setSelected(new Set()); }}
            className={`px-3 py-1.5 text-sm rounded-full font-medium ${tab === 'customers' ? 'bg-brand text-ios-label' : 'bg-ios-gray6 text-ios-secondary-label'}`}
          >
            Customers
          </button>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1 mb-1">
          <input
            type="checkbox"
            className="accent-amber-500"
            onChange={() => selectAll(currentIds)}
            checked={selected.size > 0 && selected.size === currentIds.length}
          />
          <span className="text-xs text-ios-secondary-label">Select all</span>
        </div>

        <div className="max-h-64 overflow-y-auto bg-white rounded-ios shadow-ios divide-y divide-ios-gray5">
          {tab === 'waitlist' ? (
            <>
              {waitlistEntries?.map(w => (
                <ListRow
                  key={w.id}
                  onClick={() => toggle(w.id)}
                  leading={<input type="checkbox" className="accent-amber-500" checked={selected.has(w.id)} readOnly />}
                  title={w.name || '-'}
                  subtitle={w.email}
                  trailing={<Badge variant={w.userType === 'customer' ? 'success' : 'neutral'}>{w.userType}</Badge>}
                />
              ))}
              {waitlistEntries?.length === 0 && (
                <div className="px-4 py-8 text-center text-ios-gray text-sm">No waitlist entries</div>
              )}
            </>
          ) : (
            <>
              {clientsData?.clients?.map((c: any) => {
                const id = c._id || c.id;
                return (
                  <ListRow
                    key={id}
                    onClick={() => toggle(id)}
                    leading={<input type="checkbox" className="accent-amber-500" checked={selected.has(id)} readOnly />}
                    title={c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '-'}
                    subtitle={c.email}
                  />
                );
              })}
              {clientsData?.clients?.length === 0 && (
                <div className="px-4 py-8 text-center text-ios-gray text-sm">No customers found</div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-ios-secondary-label">{selected.size} selected</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={selected.size === 0 || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : `Assign to ${selected.size}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
