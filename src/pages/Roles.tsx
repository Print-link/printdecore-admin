import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { roleService, permissionService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormField, iosInputCls } from '../components/ui/FormField';
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

  // Group permissions by category
  const permissionsByCategory = (permissions || []).reduce<Record<string, typeof permissions>>((acc, perm) => {
    const cat = perm.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(perm);
    return acc;
  }, {});

  const PermissionSelector = () => (
    <div className="space-y-3 max-h-60 overflow-y-auto bg-ios-gray6 rounded-ios p-3">
      {Object.entries(permissionsByCategory).map(([category, perms]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-ios-secondary-label uppercase mb-1">{category}</p>
          <div className="flex flex-wrap gap-2">
            {perms?.map((perm) => (
              <label key={perm.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                selectedPermissions.includes(perm.name) ? 'bg-brand text-ios-label' : 'bg-white text-ios-secondary-label border border-ios-gray5 hover:border-ios-gray'
              }`}>
                <input type="checkbox" checked={selectedPermissions.includes(perm.name)} onChange={() => togglePermission(perm.name)} className="sr-only" />
                {perm.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(permissionsByCategory).length === 0 && (
        <p className="text-xs text-ios-gray text-center py-4">No permissions available</p>
      )}
    </div>
  );

  return (
    <Layout>
      <div>
        <PageHeader
          title="Roles & Permissions"
          subtitle="Manage custom roles and their permissions"
          actions={<Button size="sm" onClick={() => { setIsCreateModalOpen(true); setSelectedPermissions([]); }}>Create Role</Button>}
        />

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles?.map((role) => (
              <Card key={role.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-ios-label">{role.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(role)} className="p-1 text-ios-gray hover:text-ios-label" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this role?')) deleteMutation.mutate(role.id); }} className="p-1 text-ios-gray hover:text-ios-red" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {role.description && <p className="text-xs text-ios-secondary-label mb-3">{role.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 8).map((perm) => (
                    <Badge key={perm} variant="neutral">{perm}</Badge>
                  ))}
                  {role.permissions.length > 8 && (
                    <Badge variant="neutral">+{role.permissions.length - 8} more</Badge>
                  )}
                </div>
                <p className="text-xs text-ios-gray mt-3">Created {new Date(role.createdAt).toLocaleDateString()}</p>
              </Card>
            ))}
            {(!roles || roles.length === 0) && (
              <div className="col-span-full bg-white rounded-ios shadow-ios p-12 text-center text-sm text-ios-gray">
                No custom roles found
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setSelectedPermissions([]); }} title="Create Role" size="large">
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <FormField label="Role Name">
              <input type="text" name="name" required className={iosInputCls} placeholder="e.g. Senior Clerk" />
            </FormField>
            <FormField label="Description">
              <input type="text" name="description" className={iosInputCls} placeholder="Optional description" />
            </FormField>
            <FormField label={`Permissions (${selectedPermissions.length} selected)`}>
              <PermissionSelector />
            </FormField>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); setSelectedPermissions([]); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={!!editingRole} onClose={() => { setEditingRole(null); setSelectedPermissions([]); }} title={`Edit ${editingRole?.name || ''}`} size="large">
          {editingRole && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <FormField label="Role Name">
                <input type="text" name="name" defaultValue={editingRole.name} required className={iosInputCls} />
              </FormField>
              <FormField label="Description">
                <input type="text" name="description" defaultValue={editingRole.description} className={iosInputCls} />
              </FormField>
              <FormField label={`Permissions (${selectedPermissions.length} selected)`}>
                <PermissionSelector />
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setEditingRole(null); setSelectedPermissions([]); }}>Cancel</Button>
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
