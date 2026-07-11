import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Building2 } from 'lucide-react';
import { branchService, userService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
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
            <ListGroup>
              {data?.branches.map((branch) => (
                <ListRow
                  key={branch.id}
                  onClick={() => navigate(`/branches/${branch.id}`)}
                  leading={
                    branch.branchCoverImage ? (
                      <img src={branch.branchCoverImage} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-brand-hover" />
                      </div>
                    )
                  }
                  title={branch.name}
                  subtitle={branch.branchEmailAddress || branch.phoneNumber}
                  trailing={
                    <>
                      <Badge variant={branch.status === 'active' || !branch.status ? 'success' : 'neutral'}>
                        {branch.status || 'Active'}
                      </Badge>
                      <div className="relative" ref={(el) => { dropdownRefs.current[branch.id] = el; }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === branch.id ? null : branch.id)}
                          className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
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
                    </>
                  }
                  chevron
                />
              ))}
              {data?.branches.length === 0 && (
                <div className="px-4 py-12 text-center text-ios-gray">No branches yet</div>
              )}
            </ListGroup>
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
