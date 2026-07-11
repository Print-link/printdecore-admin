import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, UserRound } from 'lucide-react';
import { managerService } from '../services/superAdminService';
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
import type { Manager } from '../types';

export const Managers = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
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
    queryKey: ['managers', page, search],
    queryFn: () => managerService.getAll({ page, limit: 10, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => managerService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['managers'] }); toast.success('Manager created'); setIsCreateModalOpen(false); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to create manager'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Manager> }) => managerService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['managers'] }); toast.success('Manager updated'); setIsEditModalOpen(false); setEditingManager(null); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to update manager'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => managerService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['managers'] }); toast.success('Manager removed'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to remove manager'); },
  });

  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      firstName: fd.get('firstName'), lastName: fd.get('lastName'),
      email: fd.get('email'), phoneNumber: fd.get('phoneNumber'),
      password: fd.get('password'), role: 'manager',
    });
  };

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingManager) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingManager.id,
      data: { firstName: fd.get('firstName') as string, lastName: fd.get('lastName') as string, email: fd.get('email') as string, phoneNumber: fd.get('phoneNumber') as string },
    });
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Managers"
          actions={<Button size="sm" onClick={() => setIsCreateModalOpen(true)}>Register Manager</Button>}
        />

        <div className="mb-3">
          <input
            type="text" placeholder="Search managers..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`max-w-sm ${iosInputCls}`}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <ListGroup>
              {data?.managers.map((manager) => (
                <ListRow
                  key={manager.id}
                  leading={
                    manager.avatar ? (
                      <img src={manager.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-brand-hover" />
                      </div>
                    )
                  }
                  title={`${manager.firstName} ${manager.lastName}`}
                  subtitle={manager.email}
                  trailing={
                    <>
                      <Badge variant="neutral">{manager.role}</Badge>
                      <div className="relative" ref={(el) => { dropdownRefs.current[manager.id] = el; }}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === manager.id ? null : manager.id)}
                          className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                          type="button"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openDropdownId === manager.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                            <button onClick={() => { setEditingManager(manager); setIsEditModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                            <button onClick={() => { if (window.confirm('Remove this manager?')) deleteMutation.mutate(manager.id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10">Remove</button>
                          </div>
                        )}
                      </div>
                    </>
                  }
                />
              ))}
              {data?.managers.length === 0 && (
                <div className="px-4 py-12 text-center text-ios-gray">No managers yet</div>
              )}
            </ListGroup>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Register New Manager">
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name">
                <input type="text" name="firstName" required className={iosInputCls} placeholder="First Name" />
              </FormField>
              <FormField label="Last Name">
                <input type="text" name="lastName" required className={iosInputCls} placeholder="Last Name" />
              </FormField>
            </div>
            <FormField label="Email">
              <input type="email" name="email" required className={iosInputCls} placeholder="manager@example.com" />
            </FormField>
            <FormField label="Phone Number">
              <input type="text" name="phoneNumber" className={iosInputCls} placeholder="Optional" />
            </FormField>
            <FormField label="Password">
              <input type="password" name="password" required minLength={6} className={iosInputCls} placeholder="••••••" />
            </FormField>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Register Manager'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingManager(null); }} title="Edit Manager">
          {editingManager && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name">
                  <input type="text" name="firstName" defaultValue={editingManager.firstName} required className={iosInputCls} />
                </FormField>
                <FormField label="Last Name">
                  <input type="text" name="lastName" defaultValue={editingManager.lastName} required className={iosInputCls} />
                </FormField>
              </div>
              <FormField label="Email">
                <input type="email" name="email" defaultValue={editingManager.email} required className={iosInputCls} />
              </FormField>
              <FormField label="Phone Number">
                <input type="text" name="phoneNumber" defaultValue={editingManager.phoneNumber} className={iosInputCls} />
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setEditingManager(null); }}>Cancel</Button>
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
