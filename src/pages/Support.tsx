import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import toast from 'react-hot-toast';
import type { SupportTicket } from '../types';
import '../styles/pages.css';
import '../styles/table.css';
import '../styles/forms.css';
import '../styles/modal.css';

export const Support = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
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
    queryKey: ['supportTickets', page, statusFilter],
    queryFn: () =>
      supportService.getAll({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { message?: string; response?: string } }) =>
      supportService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      toast.success('Support ticket updated successfully');
      setIsEditModalOpen(false);
      setSelectedTicket(null);
      setResponseText('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      toast.success('Support ticket deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete ticket');
    },
  });

  const handleView = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleEdit = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.response || '');
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this support ticket?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewAdmin = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsAdminModalOpen(true);
  };

  const handleViewClient = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsClientModalOpen(true);
  };

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    updateMutation.mutate({
      id: selectedTicket._id,
      data: { response: responseText },
    });
  };

  const getClientName = (ticket: SupportTicket) => {
    if (typeof ticket.clientId === 'object' && ticket.clientId) {
      return ticket.clientId.fullName;
    }
    return 'Unknown';
  };

  const getAdminName = (ticket: SupportTicket) => {
    if (typeof ticket.adminId === 'object' && ticket.adminId) {
      return ticket.adminId.name || ticket.adminId.email;
    }
    return 'Unknown';
  };

  const getClientPhone = (ticket: SupportTicket) => {
    if (typeof ticket.clientId === 'object' && ticket.clientId) {
      return ticket.clientId.phoneNumber || '-';
    }
    return '-';
  };

  const getJobStatus = (ticket: SupportTicket) => {
    if (ticket.jobId && typeof ticket.jobId === 'object') {
      return ticket.jobId.status || '-';
    }
    return '-';
  };

  const getPrinterName = (ticket: SupportTicket) => {
    if (ticket.jobId && typeof ticket.jobId === 'object') {
      return ticket.jobId.printerName || '-';
    }
    return '-';
  };

  const getJobId = (ticket: SupportTicket) => {
    if (ticket.jobId && typeof ticket.jobId === 'object') {
      return ticket.jobId._id || '-';
    }
    return '-';
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h3 className="page-title">Support Tickets</h3>
            {/* <p className="page-subtitle">Manage all support tickets</p> */}
          </div>
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
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
                    <th>Client</th>
                    <th>Admin</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data?.supportTickets.map((ticket, index) => (
                    <tr key={ticket._id} className="table-row">
                      <td className="table-cell">{getClientName(ticket)}</td>
                      <td className="table-cell">{getAdminName(ticket)}</td>
                      <td className="table-cell" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.message}
                      </td>
                      <td className="table-cell">
                        <span className="status-badge active">
                          {ticket.status || 'Open'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <div 
                          className="dropdown-container"
                          ref={(el) => {
                            dropdownRefs.current[ticket._id] = el;
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === ticket._id ? null : ticket._id);
                            }}
                            className="dropdown-trigger"
                            aria-label="Actions"
                            type="button"
                          >
                            <span className="dropdown-dots">⋯</span>
                          </button>
                          {openDropdownId === ticket._id && (
                            <div 
                              className="dropdown-menu"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(ticket);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                View Ticket
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewClient(ticket);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                View Client Details
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewAdmin(ticket);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                View Admin Details
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(ticket);
                                  setOpenDropdownId(null);
                                }}
                                className="dropdown-item"
                                type="button"
                              >
                                Respond
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(ticket._id);
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

        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedTicket(null);
          }}
          title="Support Ticket Details"
          size="large"
        >
          {selectedTicket && (
            <div className="modal-body">
              <div className="modal-field">
                <p className="modal-field-label">Client</p>
                <p className="modal-field-value">{getClientName(selectedTicket)}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Client Phone</p>
                <p className="modal-field-value">{getClientPhone(selectedTicket)}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Admin</p>
                <p className="modal-field-value">{getAdminName(selectedTicket)}</p>
              </div>
              {selectedTicket.jobId && typeof selectedTicket.jobId === 'object' && (
                <>
                  <div className="modal-field">
                    <p className="modal-field-label">Job ID</p>
                    <p className="modal-field-value">{getJobId(selectedTicket)}</p>
                  </div>
                  <div className="modal-field">
                    <p className="modal-field-label">Job Status</p>
                    <p className="modal-field-value">{getJobStatus(selectedTicket)}</p>
                  </div>
                  <div className="modal-field">
                    <p className="modal-field-label">Printer Name</p>
                    <p className="modal-field-value">{getPrinterName(selectedTicket)}</p>
                  </div>
                  {selectedTicket.jobId.createdAt && (
                    <div className="modal-field">
                      <p className="modal-field-label">Job Created</p>
                      <p className="modal-field-value">
                        {new Date(selectedTicket.jobId.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div className="modal-field">
                <p className="modal-field-label">Message</p>
                <p className="modal-field-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
              </div>
              {selectedTicket.response && (
                <div className="modal-field">
                  <p className="modal-field-label">Response</p>
                  <p className="modal-field-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.response}</p>
                </div>
              )}
              <div className="modal-field">
                <p className="modal-field-label">Status</p>
                <p className="modal-field-value">{selectedTicket.status || 'Open'}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Created</p>
                <p className="modal-field-value">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Updated</p>
                <p className="modal-field-value">
                  {new Date(selectedTicket.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="form-actions">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedTicket(null);
                  }}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTicket(null);
            setResponseText('');
          }}
          title="Respond to Ticket"
          size="large"
        >
          {selectedTicket && (
            <>
              <div className="modal-field">
                <p className="modal-field-label">Original Message</p>
                <p className="modal-field-box">{selectedTicket.message}</p>
              </div>
              <form onSubmit={handleSubmitResponse} className="form-container">
                <div className="form-group">
                  <label className="form-label">Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    required
                    rows={6}
                    className="form-textarea"
                    placeholder="Enter your response..."
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="btn btn-primary"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Response'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedTicket(null);
                      setResponseText('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </Modal>

        {/* Admin Details Modal */}
        <Modal
          isOpen={isAdminModalOpen}
          onClose={() => {
            setIsAdminModalOpen(false);
            setSelectedTicket(null);
          }}
          title="Admin Details"
          size="large"
        >
          {selectedTicket && typeof selectedTicket.adminId === 'object' && selectedTicket.adminId && (
            <div className="modal-body">
              <div className="modal-field">
                <p className="modal-field-label">Name</p>
                <p className="modal-field-value">{selectedTicket.adminId.name || '-'}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Email</p>
                <p className="modal-field-value">{selectedTicket.adminId.email || '-'}</p>
              </div>
              {selectedTicket.adminId.businessName && (
                <div className="modal-field">
                  <p className="modal-field-label">Business Name</p>
                  <p className="modal-field-value">{selectedTicket.adminId.businessName}</p>
                </div>
              )}
              {selectedTicket.adminId.businessPhone && (
                <div className="modal-field">
                  <p className="modal-field-label">Business Phone</p>
                  <p className="modal-field-value">{selectedTicket.adminId.businessPhone}</p>
                </div>
              )}
              {selectedTicket.adminId.role && (
                <div className="modal-field">
                  <p className="modal-field-label">Role</p>
                  <p className="modal-field-value">{selectedTicket.adminId.role}</p>
                </div>
              )}
              <div className="modal-field">
                <p className="modal-field-label">Status</p>
                <p className="modal-field-value">
                  <span className={`status-badge ${selectedTicket.adminId.isActive ? 'active' : 'inactive'}`}>
                    {selectedTicket.adminId.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              {selectedTicket.adminId.paystackSubaccountCode && (
                <div className="modal-field">
                  <p className="modal-field-label">Paystack Subaccount Code</p>
                  <p className="modal-field-value">{selectedTicket.adminId.paystackSubaccountCode}</p>
                </div>
              )}
              {selectedTicket.adminId.location && (
                <>
                  {selectedTicket.adminId.location.address && (
                    <div className="modal-field">
                      <p className="modal-field-label">Address</p>
                      <p className="modal-field-value">{selectedTicket.adminId.location.address}</p>
                    </div>
                  )}
                  <div className="modal-field">
                    <p className="modal-field-label">Location</p>
                    <p className="modal-field-value">
                      Lat: {selectedTicket.adminId.location.latitude}, 
                      Lng: {selectedTicket.adminId.location.longitude}
                    </p>
                  </div>
                </>
              )}
              {selectedTicket.adminId.createdAt && (
                <div className="modal-field">
                  <p className="modal-field-label">Created</p>
                  <p className="modal-field-value">
                    {new Date(selectedTicket.adminId.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedTicket.adminId.updatedAt && (
                <div className="modal-field">
                  <p className="modal-field-label">Updated</p>
                  <p className="modal-field-value">
                    {new Date(selectedTicket.adminId.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="form-actions">
                <button
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setSelectedTicket(null);
                  }}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Client Details Modal */}
        <Modal
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            setSelectedTicket(null);
          }}
          title="Client Details"
          size="large"
        >
          {selectedTicket && typeof selectedTicket.clientId === 'object' && selectedTicket.clientId && (
            <div className="modal-body">
              <div className="modal-field">
                <p className="modal-field-label">Full Name</p>
                <p className="modal-field-value">{selectedTicket.clientId.fullName || '-'}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Email</p>
                <p className="modal-field-value">{selectedTicket.clientId.email || '-'}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Phone Number</p>
                <p className="modal-field-value">{selectedTicket.clientId.phoneNumber || '-'}</p>
              </div>
              <div className="modal-field">
                <p className="modal-field-label">Status</p>
                <p className="modal-field-value">
                  <span className={`status-badge ${selectedTicket.clientId.isActive ? 'active' : 'inactive'}`}>
                    {selectedTicket.clientId.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              {selectedTicket.clientId.lastLogin && (
                <div className="modal-field">
                  <p className="modal-field-label">Last Login</p>
                  <p className="modal-field-value">
                    {new Date(selectedTicket.clientId.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedTicket.clientId.createdAt && (
                <div className="modal-field">
                  <p className="modal-field-label">Created</p>
                  <p className="modal-field-value">
                    {new Date(selectedTicket.clientId.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedTicket.clientId.updatedAt && (
                <div className="modal-field">
                  <p className="modal-field-label">Updated</p>
                  <p className="modal-field-value">
                    {new Date(selectedTicket.clientId.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="form-actions">
                <button
                  onClick={() => {
                    setIsClientModalOpen(false);
                    setSelectedTicket(null);
                  }}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
