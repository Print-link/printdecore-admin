
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import toast from 'react-hot-toast';
import type { Manager } from '../types';
import '../styles/pages.css';
import '../styles/table.css';
import '../styles/forms.css';
import '../styles/modal.css';

export const Managers = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [editingManager, setEditingManager] = useState<Manager | null>(null);
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
        queryKey: ['managers', page, search],
        queryFn: () =>
        managerService.getAll({
            page,
            limit: 10,
            search: search || undefined,
        }),
    });
    
    const createMutation = useMutation({
        mutationFn: (data: any) =>
        managerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['managers'] });
            toast.success('Manager created successfully');
            setIsCreateModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create manager');
        },
    });
    
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Manager> }) =>
        managerService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['managers'] });
            toast.success('Manager updated successfully');
            setIsEditModalOpen(false);
            setEditingManager(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update manager');
        },
    });
    
    const deleteMutation = useMutation({
        mutationFn: (id: string) => managerService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['managers'] });
            toast.success('Manager removed successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove manager');
        },
    });
    
    const handleEdit = (manager: Manager) => {
        setEditingManager(manager);
        setIsEditModalOpen(true);
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this manager?')) {
            deleteMutation.mutate(id);
        }
    };
    
    const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const createData = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            phoneNumber: formData.get('phoneNumber') as string,
            password: formData.get('password') as string,
            role: 'manager',
        };
        
        createMutation.mutate(createData);
    };
    
    const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingManager) return;
        
        const formData = new FormData(e.currentTarget);
        const updateData: Partial<Manager> = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            phoneNumber: formData.get('phoneNumber') as string,
        };
        
        updateMutation.mutate({ id: editingManager.id, data: updateData });
    };
    
    return (
        <Layout>
        <div className="page-container">
        <div className="page-header">
        <div>
        <h1 className="page-title">Managers Management</h1>
        </div>
        <button
        onClick={() => setIsCreateModalOpen(true)}
        className="btn btn-primary"
        >
        Register Manager
        </button>
        </div>
        
        <div className="filters">
        <input
        type="text"
        placeholder="Search managers..."
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
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Actions</th>
            </tr>
            </thead>
            <tbody className="table-body">
            {data?.managers.map((manager) => (
                <tr key={manager.id} className="table-row">
                <td className="table-cell">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                {manager.avatar && <img src={manager.avatar} alt="" style={{width: 30, height: 30, borderRadius: '50%', objectFit:'cover'}} />}
                {manager.firstName} {manager.lastName}
                </div>
                </td>
                <td className="table-cell">{manager.email}</td>
                <td className="table-cell">{manager.phoneNumber || '-'}</td>
                <td className="table-cell">
                <span className="status-badge active">
                {manager.role}
                </span>
                </td>
                <td className="table-cell">
                <div 
                className="dropdown-container"
                ref={(el) => {
                    dropdownRefs.current[manager.id] = el;
                }}
                >
                <button
                onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === manager.id ? null : manager.id);
                }}
                className="dropdown-trigger"
                aria-label="Actions"
                type="button"
                >
                <span className="dropdown-dots">⋯</span>
                </button>
                {openDropdownId === manager.id && (
                    <div 
                    className="dropdown-menu"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    >
                    <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(manager);
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
                        handleDelete(manager.id);
                        setOpenDropdownId(null);
                    }}
                    className="dropdown-item dropdown-item-danger"
                    type="button"
                    >
                    Remove
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
        title="Register New Manager"
        >
        <form onSubmit={handleSubmitCreate} className="form-container">
        <div className="form-group-row" style={{display:'flex', gap:'1rem'}}>
        <div className="form-group" style={{flex:1}}>
        <label className="form-label">First Name</label>
        <input
        type="text"
        name="firstName"
        required
        className="form-input"
        placeholder="First Name"
        />
        </div>
        <div className="form-group" style={{flex:1}}>
        <label className="form-label">Last Name</label>
        <input
        type="text"
        name="lastName"
        required
        className="form-input"
        placeholder="Last Name"
        />
        </div>
        </div>
        
        <div className="form-group">
        <label className="form-label">Email</label>
        <input
        type="email"
        name="email"
        required
        className="form-input"
        placeholder="manager@example.com"
        />
        </div>
        
        <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input
        type="text"
        name="phoneNumber"
        className="form-input"
        placeholder="Optional"
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
        placeholder="******"
        />
        </div>
        
        <div className="form-actions">
        <button
        type="submit"
        disabled={createMutation.isPending}
        className="btn btn-primary"
        >
        {createMutation.isPending ? 'Creating...' : 'Register Manager'}
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
        
        {/* Edit Modal */}
        <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
            setIsEditModalOpen(false);
            setEditingManager(null);
        }}
        title="Edit Manager"
        >
        {editingManager && (
            <form onSubmit={handleSubmitEdit} className="form-container">
            <div className="form-group-row" style={{display:'flex', gap:'1rem'}}>
            <div className="form-group" style={{flex:1}}>
            <label className="form-label">First Name</label>
            <input
            type="text"
            name="firstName"
            defaultValue={editingManager.firstName}
            required
            className="form-input"
            />
            </div>
            <div className="form-group" style={{flex:1}}>
            <label className="form-label">Last Name</label>
            <input
            type="text"
            name="lastName"
            defaultValue={editingManager.lastName}
            required
            className="form-input"
            />
            </div>
            </div>
            
            <div className="form-group">
            <label className="form-label">Email</label>
            <input
            type="email"
            name="email"
            defaultValue={editingManager.email}
            required
            className="form-input"
            />
            </div>
            
            <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
            type="text"
            name="phoneNumber"
            defaultValue={editingManager.phoneNumber}
            className="form-input"
            />
            </div>
            
            <div className="form-actions">
            <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn btn-primary"
            >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
            type="button"
            onClick={() => {
                setIsEditModalOpen(false);
                setEditingManager(null);
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
