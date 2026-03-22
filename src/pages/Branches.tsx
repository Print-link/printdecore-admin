import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService, userService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import toast from 'react-hot-toast';
import type { Branch, User } from '../types';

export const Branches = () => {
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

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
            Create Branch
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text" placeholder="Search branches..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Branch Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Manager</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {branch.branchCoverImage && <img src={branch.branchCoverImage} alt="" className="w-7 h-7 rounded object-cover" />}
                          <span className="font-medium text-gray-900">{branch.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{branch.manager_id}</td>
                      <td className="px-4 py-3 text-gray-600">{branch.branchEmailAddress}</td>
                      <td className="px-4 py-3 text-gray-600">{branch.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${branch.status === 'active' || !branch.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {branch.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block" ref={(el) => { dropdownRefs.current[branch.id] = el; }}>
                          <button onClick={() => setOpenDropdownId(openDropdownId === branch.id ? null : branch.id)} className="p-1 text-gray-400 hover:text-gray-600" type="button">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                          </button>
                          {openDropdownId === branch.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button onClick={() => { setEditingBranch(branch); setIsEditModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                              <button onClick={() => { if (window.confirm('Delete this branch?')) deleteMutation.mutate(branch.id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Branch">
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
              <input type="text" name="name" required className={inputCls} placeholder="e.g. Main Street Branch" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
              <select name="manager_id" required className={inputCls}>
                <option value="">Select Manager</option>
                {(managersData?.users as any)?.map((u: User) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="branchEmailAddress" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phoneNumber" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <input type="file" name="branchCoverImage" accept="image/*" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paystack Subaccount ID (Optional)</label>
              <input type="text" name="payStackSubAccountId" className={inputCls} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingBranch(null); }} title="Edit Branch">
          {editingBranch && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input type="text" name="name" defaultValue={editingBranch.name} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                <select name="manager_id" defaultValue={editingBranch.manager_id} required className={inputCls}>
                  {(managersData?.users as any)?.map((u: User) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="branchEmailAddress" defaultValue={editingBranch.branchEmailAddress} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" name="phoneNumber" defaultValue={editingBranch.phoneNumber} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <input type="file" name="branchCoverImage" accept="image/*" className={inputCls} />
                {editingBranch.branchCoverImage && <p className="text-xs text-gray-400 mt-1">Leave empty to keep current image</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paystack Subaccount ID</label>
                <input type="text" name="payStackSubAccountId" defaultValue={editingBranch.payStackSubAccountId || ''} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" defaultValue={editingBranch.status || 'active'} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingBranch(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
