import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService, permissionService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import type { Role } from '../types';

export const Roles = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: roleService.getAll,
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Role>) => roleService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role created'); setIsCreateModalOpen(false); setSelectedPermissions([]); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to create role'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => roleService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role updated'); setEditingRole(null); setSelectedPermissions([]); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to update role'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roleService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role deleted'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to delete role'); },
  });

  const togglePermission = (name: string) => {
    setSelectedPermissions(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({ name: fd.get('name') as string, description: fd.get('description') as string, permissions: selectedPermissions });
  };

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRole) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({ id: editingRole.id, data: { name: fd.get('name') as string, description: fd.get('description') as string, permissions: selectedPermissions } });
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions || []);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  // Group permissions by category
  const permissionsByCategory = (permissions || []).reduce<Record<string, typeof permissions>>((acc, perm) => {
    const cat = perm.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(perm);
    return acc;
  }, {});

  const PermissionSelector = () => (
    <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
      {Object.entries(permissionsByCategory).map(([category, perms]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</p>
          <div className="flex flex-wrap gap-2">
            {perms?.map((perm) => (
              <label key={perm.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer border ${
                selectedPermissions.includes(perm.name) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
                <input type="checkbox" checked={selectedPermissions.includes(perm.name)} onChange={() => togglePermission(perm.name)} className="sr-only" />
                {perm.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(permissionsByCategory).length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No permissions available</p>
      )}
    </div>
  );

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage custom roles and their permissions</p>
          </div>
          <button onClick={() => { setIsCreateModalOpen(true); setSelectedPermissions([]); }} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
            Create Role
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles?.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(role)} className="p-1 text-gray-400 hover:text-gray-600" title="Edit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this role?')) deleteMutation.mutate(role.id); }} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {role.description && <p className="text-xs text-gray-500 mb-3">{role.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 8).map((perm) => (
                    <span key={perm} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">{perm}</span>
                  ))}
                  {role.permissions.length > 8 && (
                    <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 text-gray-500 rounded">+{role.permissions.length - 8} more</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">Created {new Date(role.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {(!roles || roles.length === 0) && (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
                No custom roles found
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setSelectedPermissions([]); }} title="Create Role" size="large">
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input type="text" name="name" required className={inputCls} placeholder="e.g. Senior Clerk" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" name="description" className={inputCls} placeholder="Optional description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions ({selectedPermissions.length} selected)</label>
              <PermissionSelector />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setIsCreateModalOpen(false); setSelectedPermissions([]); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={!!editingRole} onClose={() => { setEditingRole(null); setSelectedPermissions([]); }} title={`Edit ${editingRole?.name || ''}`} size="large">
          {editingRole && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input type="text" name="name" defaultValue={editingRole.name} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" name="description" defaultValue={editingRole.description} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions ({selectedPermissions.length} selected)</label>
                <PermissionSelector />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditingRole(null); setSelectedPermissions([]); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
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
