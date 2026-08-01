import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Store, MapPin, Phone, Mail, Crown } from 'lucide-react';
import { branchService, userService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { getStoreOpenStatus } from '../utils/storeHours';
import toast from 'react-hot-toast';
import type { Branch, User } from '../types';

export const Branches = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) return;
      }
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openDropdownId]);

  const { data, isLoading } = useQuery({
    queryKey: ['branches', page, search],
    queryFn: () => branchService.getAll({ page, limit: 10, search: search || undefined }),
  });

  const { data: managersData } = useQuery({
    queryKey: ['managers'],
    queryFn: () => userService.getAll({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => branchService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); toast.success('Branch created'); setIsCreateModalOpen(false); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to create branch'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => branchService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); toast.success('Branch updated'); setIsEditModalOpen(false); setEditingBranch(null); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to update branch'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); toast.success('Branch deleted'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to delete branch'); },
  });

  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get('operatingHours')) {
      formData.append('operatingHours', JSON.stringify({
        monday: { open: "09:00", close: "17:00" }, tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" }, thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" }, saturday: { open: "10:00", close: "14:00" },
        sunday: { open: "10:00", close: "14:00" }
      }));
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBranch) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({ id: editingBranch.id, data: formData });
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Branches"
          actions={<Button size="sm" onClick={() => setIsCreateModalOpen(true)}>Create Branch</Button>}
        />

        <div className="mb-3">
          <input
            type="text" placeholder="Search branches..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`max-w-sm ${iosInputCls}`}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            {data?.branches.length === 0 ? (
              <div className="bg-white rounded-ios shadow-ios px-4 py-16 text-center text-ios-gray">No branches yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data?.branches.map((branch) => {
                  const open = getStoreOpenStatus(branch.operatingHours);
                  const isActive = branch.status === 'active' || !branch.status;
                  return (
                    <div
                      key={branch.id}
                      onClick={() => navigate(`/branches/${branch.id}`)}
                      className="group cursor-pointer bg-white rounded-ios shadow-ios border border-ios-gray5 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      {/* Storefront banner */}
                      <div className="relative h-28">
                        {branch.branchCoverImage ? (
                          <img src={branch.branchCoverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-brand/40 via-brand/15 to-ios-gray6 flex items-center justify-center">
                            <Store className="w-9 h-9 text-brand-hover/70" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/0 to-black/0" />

                        {branch.isMainBranch && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-brand text-ios-label text-[11px] font-semibold px-2 py-0.5 rounded-full shadow">
                            <Crown className="w-3 h-3" /> Flagship
                          </span>
                        )}

                        <div
                          className="absolute top-2 right-2 relative"
                          ref={(el) => { dropdownRefs.current[branch.id] = el; }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === branch.id ? null : branch.id)}
                            className="p-1.5 rounded-full bg-black/35 text-white hover:bg-black/50 backdrop-blur"
                            type="button"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openDropdownId === branch.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                              <button onClick={() => { setEditingBranch(branch); setIsEditModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                              <button onClick={() => { if (window.confirm('Delete this branch?')) deleteMutation.mutate(branch.id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10">Delete</button>
                            </div>
                          )}
                        </div>

                        {open.isOpen !== null && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full">
                            <span className={`w-1.5 h-1.5 rounded-full ${open.isOpen ? 'bg-ios-green animate-pulse' : 'bg-ios-red'}`} />
                            <span className="text-[11px] font-medium text-white">{open.isOpen ? 'Open now' : 'Closed'}</span>
                          </div>
                        )}
                      </div>

                      {/* Storefront info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-ios-label truncate">{branch.name}</h3>
                          <Badge variant={isActive ? 'success' : 'neutral'}>{branch.status || 'Active'}</Badge>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-ios-secondary-label mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {branch.location?.address || 'No address set'}
                        </p>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ios-gray5 text-xs text-ios-secondary-label">
                          <span className="flex items-center gap-1 min-w-0">
                            <Phone className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{branch.phoneNumber || '-'}</span>
                          </span>
                          <span className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{branch.branchEmailAddress || '-'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Branch">
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <FormField label="Branch Name">
              <input type="text" name="name" required className={iosInputCls} placeholder="e.g. Main Street Branch" />
            </FormField>
            <FormField label="Manager">
              <select name="manager_id" required className={iosInputCls}>
                <option value="">Select Manager</option>
                {(managersData?.users as any)?.map((u: User) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Email">
              <input type="email" name="branchEmailAddress" required className={iosInputCls} />
            </FormField>
            <FormField label="Phone">
              <input type="text" name="phoneNumber" required className={iosInputCls} />
            </FormField>
            <FormField label="Cover Image">
              <input type="file" name="branchCoverImage" accept="image/*" className={iosInputCls} />
            </FormField>
            <FormField label="Paystack Subaccount ID (Optional)">
              <input type="text" name="payStackSubAccountId" className={iosInputCls} />
            </FormField>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingBranch(null); }} title="Edit Branch">
          {editingBranch && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <FormField label="Branch Name">
                <input type="text" name="name" defaultValue={editingBranch.name} required className={iosInputCls} />
              </FormField>
              <FormField label="Manager">
                <select name="manager_id" defaultValue={editingBranch.manager_id} required className={iosInputCls}>
                  {(managersData?.users as any)?.map((u: User) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Email">
                <input type="email" name="branchEmailAddress" defaultValue={editingBranch.branchEmailAddress} required className={iosInputCls} />
              </FormField>
              <FormField label="Phone">
                <input type="text" name="phoneNumber" defaultValue={editingBranch.phoneNumber} required className={iosInputCls} />
              </FormField>
              <FormField label="Cover Image">
                <input type="file" name="branchCoverImage" accept="image/*" className={iosInputCls} />
                {editingBranch.branchCoverImage && <p className="text-xs text-ios-secondary-label mt-1">Leave empty to keep current image</p>}
              </FormField>
              <FormField label="Paystack Subaccount ID">
                <input type="text" name="payStackSubAccountId" defaultValue={editingBranch.payStackSubAccountId || ''} className={iosInputCls} />
              </FormField>
              <FormField label="Status">
                <select name="status" defaultValue={editingBranch.status || 'active'} className={iosInputCls}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setEditingBranch(null); }}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
