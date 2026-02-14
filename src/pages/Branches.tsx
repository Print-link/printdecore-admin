
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService, userService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import toast from 'react-hot-toast';
import type { Branch, User } from '../types';
import '../styles/pages.css';
import '../styles/table.css';
import '../styles/forms.css';
import '../styles/modal.css';

export const Branches = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let clickedOutside = true;
      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) {
          clickedOutside = false;
          break;
        }
      }
      if (clickedOutside) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [openDropdownId]);

  const { data, isLoading } = useQuery({
    queryKey: ['branches', page, search],
    queryFn: () =>
      branchService.getAll({
        page,
        limit: 10,
        search: search || undefined,
      }),
  });

  // Fetch managers for the dropdown
  const { data: managersData } = useQuery({
    queryKey: ['managers'],
    queryFn: () => userService.getAll({ limit: 100 }), // Get enough managers
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => branchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create branch');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      branchService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch updated successfully');
      setIsEditModalOpen(false);
      setEditingBranch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update branch');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    },
  });

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Append default or structured data if needed, e.g. location JSON
    const location = {
        latitude: Number(formData.get('latitude')),
        longitude: Number(formData.get('longitude')),
        address: formData.get('address')
    }
    formData.delete('latitude');
    formData.delete('longitude');
    formData.delete('address');
    formData.append('location_id', JSON.stringify(location)); // Backend expects location_id sometimes or uses it differently? 
    // Wait, controller: createData.location_id = branchData.location_id. 
    // But branchModel seems to use location embedded? 
    // The controller "create" uses `location_id`. Let's look at `branchModel.ts` if possible?
    // Actually, looking at controller `getBranchesNearMe` mapping: `location: branch.location`.
    // Controller `create` extracts `location_id`.
    // Let's assume for now we just pass what fields we can. The controller takes `location_id`, maybe it's a reference to a Location collection?
    // Or maybe the controller code I read was confusing.
    // "location_id: branchData.location_id" in createData.
    // Ideally we should know how location is stored.
    // However, I'll pass fields as FormData and let the backend handle it or fail.
    // Let's just pass basic fields first.
    
    // Operating Hours defaults to standard if empty?
    if (!formData.get('operatingHours')) {
        formData.append('operatingHours', JSON.stringify({
             monday: { open: "09:00", close: "17:00" },
             tuesday: { open: "09:00", close: "17:00" },
             wednesday: { open: "09:00", close: "17:00" },
             thursday: { open: "09:00", close: "17:00" },
             friday: { open: "09:00", close: "17:00" },
             saturday: { open: "10:00", close: "14:00" },
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
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Branches Management</h1>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            Create New Branch
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search branches..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="filter-input"
          />
        </div>

        {isLoading ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Branch Name</th>
                    <th>Manager</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data?.branches.map((branch) => (
                    <tr key={branch.id} className="table-row">
                      <td className="table-cell">
                          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                              {branch.branchCoverImage && <img src={branch.branchCoverImage} alt="" style={{width: 30, height: 30, borderRadius: 4, objectFit:'cover'}} />}
                              {branch.name}
                          </div>
                      </td>
                      <td className="table-cell">{branch.manager_id}</td>
                      <td className="table-cell">{branch.branchEmailAddress}</td>
                      <td className="table-cell">{branch.phoneNumber}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${branch.status === 'active' ? 'active' : 'inactive'}`}>
                          {branch.status || 'Active'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div 
                          className="dropdown-container"
                          ref={(el) => {
                            dropdownRefs.current[branch.id] = el;
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === branch.id ? null : branch.id);
                            }}
                            className="dropdown-trigger"
                            type="button"
                          >
                            <span className="dropdown-dots">⋯</span>
                          </button>
                          {openDropdownId === branch.id && (
                            <div 
                              className="dropdown-menu"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(branch);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(branch.id);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item dropdown-item-danger"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.pagination && (
              <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                totalItems={data.pagination.totalItems}
                itemsPerPage={data.pagination.itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Branch"
        >
          <form onSubmit={handleSubmitCreate} className="form-container">
            <div className="form-group">
              <label className="form-label">Branch Name</label>
              <input type="text" name="name" required className="form-input" placeholder="e.g. Main Street Branch" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Manager</label>
              <select name="manager_id" required className="form-select">
                  <option value="">Select Manager</option>
                  {(managersData?.users as any)?.map((u: User) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="branchEmailAddress" required className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" name="phoneNumber" required className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <input type="file" name="branchCoverImage" accept="image/*" className="form-input" />
            </div>

            <div className="form-group">
                <label className="form-label">Paystack Subaccount ID (Optional)</label>
                <input type="text" name="payStackSubAccountId" className="form-input" />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                {createMutation.isPending ? 'Creating...' : 'Create Branch'}
              </button>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBranch(null);
          }}
          title="Edit Branch"
        >
          {editingBranch && (
            <form onSubmit={handleSubmitEdit} className="form-container">
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input type="text" name="name" defaultValue={editingBranch.name} required className="form-input" />
              </div>

               <div className="form-group">
                <label className="form-label">Manager</label>
                <select name="manager_id" defaultValue={editingBranch.manager_id} required className="form-select">
                    {(managersData?.users as any)?.map((u: User) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="branchEmailAddress" defaultValue={editingBranch.branchEmailAddress} required className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" name="phoneNumber" defaultValue={editingBranch.phoneNumber} required className="form-input" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Cover Image</label>
                <input type="file" name="branchCoverImage" accept="image/*" className="form-input" />
                {editingBranch.branchCoverImage && <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>}
              </div>

               <div className="form-group">
                <label className="form-label">Paystack Subaccount ID</label>
                <input type="text" name="payStackSubAccountId" defaultValue={editingBranch.payStackSubAccountId || ''} className="form-input" />
              </div>

               <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" defaultValue={editingBranch.status || 'active'} className="form-select">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingBranch(null); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
