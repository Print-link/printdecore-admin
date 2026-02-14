import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import toast from 'react-hot-toast';
import type { User } from '../types';
import '../styles/pages.css';
import '../styles/table.css';
import '../styles/forms.css';
import '../styles/modal.css';

export const Users = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subaccountUser, setSubaccountUser] = useState<User | null>(null);
  const [isSubaccountModalOpen, setIsSubaccountModalOpen] = useState(false);
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

    // Use capture phase to catch events before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [openDropdownId]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      userService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { email: string; name: string; phone: string; password: string; role: string }) =>
      userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setEditingUser(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const subaccountMutation = useMutation({
    mutationFn: ({ userId, paystackSubaccountCode }: { userId: string; paystackSubaccountCode: string }) =>
      userService.setupBusinessSubaccount(userId, paystackSubaccountCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Business subaccount set up successfully');
      setIsSubaccountModalOpen(false);
      setSubaccountUser(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to set up business subaccount');
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetupSubaccount = (user: User) => {
    setSubaccountUser(user);
    setIsSubaccountModalOpen(true);
  };

  const handleSubmitSubaccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subaccountUser) return;

    const formData = new FormData(e.currentTarget);
    const paystackSubaccountCode = formData.get('paystackSubaccountCode') as string;

    subaccountMutation.mutate({
      userId: subaccountUser._id,
      paystackSubaccountCode,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const updateData: Partial<User> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      businessName: formData.get('businessName') as string,
      businessPhone: formData.get('businessPhone') as string,
      isActive: formData.get('isActive') === 'true',
    };

    updateMutation.mutate({ id: editingUser._id, data: updateData });
  };

  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const createData = {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
      role: 'admin',
    };

    createMutation.mutate(createData);
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users Management</h1>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            Create New Admin
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="filter-input"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="clerk">Clerk</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>Subaccount Code</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data?.users.map((user) => (
                    <tr key={user._id} className="table-row">
                      <td className="table-cell">{user.name}</td>
                      <td className="table-cell">{user.email}</td>
                      <td className="table-cell">{user.businessName || '-'}</td>
                      <td className="table-cell">{user.paystackSubaccountCode || '-'}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div 
                          className="dropdown-container"
                          ref={(el) => {
                            dropdownRefs.current[user._id] = el;
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === user._id ? null : user._id);
                            }}
                            className="dropdown-trigger"
                            aria-label="Actions"
                            type="button"
                          >
                            <span className="dropdown-dots">⋯</span>
                          </button>
                          {openDropdownId === user._id && (
                            <div 
                              className="dropdown-menu"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(user);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetupSubaccount(user);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                Setup Subaccount
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(user._id);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item dropdown-item-danger"
                                type="button"
                              >
                                Deactivate
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
          title="Create New Admin User"
        >
          <form onSubmit={handleSubmitCreate} className="form-container">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                required
                className="form-input"
                placeholder="Jackman Hugh"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                required
                className="form-input"
                placeholder="baah@gmail.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                name="phone"
                required
                className="form-input"
                placeholder="0245452066"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="form-input"
                placeholder="Ben41315242"
              />
            </div>
            <div className="form-actions">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Subaccount Setup Modal */}
        <Modal
          isOpen={isSubaccountModalOpen}
          onClose={() => {
            setIsSubaccountModalOpen(false);
            setSubaccountUser(null);
          }}
          title="Setup Business Subaccount"
        >
          {subaccountUser && (
            <form onSubmit={handleSubmitSubaccount} className="form-container">
              <div className="modal-field">
                <p className="modal-field-label">User</p>
                <p className="modal-field-value">{subaccountUser.name} ({subaccountUser.email})</p>
              </div>
              <div className="form-group">
                <label className="form-label">Paystack Subaccount Code</label>
                <input
                  type="text"
                  name="paystackSubaccountCode"
                  required
                  className="form-input"
                  placeholder="Enter Paystack subaccount code"
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={subaccountMutation.isPending}
                  className="btn btn-primary"
                >
                  {subaccountMutation.isPending ? 'Setting up...' : 'Setup Subaccount'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubaccountModalOpen(false);
                    setSubaccountUser(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          title="Edit User"
        >
          {editingUser && (
            <form onSubmit={handleSubmitEdit} className="form-container">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingUser.name}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  defaultValue={editingUser.businessName || ''}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Business Phone</label>
                <input
                  type="text"
                  name="businessPhone"
                  defaultValue={editingUser.businessPhone || ''}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="isActive"
                  defaultValue={editingUser.isActive ? 'true' : 'false'}
                  className="form-select"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn btn-primary"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="btn btn-secondary"
                >
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
