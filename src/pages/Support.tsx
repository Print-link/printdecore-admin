import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, MessageCircle } from 'lucide-react';
import { supportService } from '../services/superAdminService';
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
import type { SupportTicket } from '../types';

export const Support = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
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
    queryKey: ['supportTickets', page, statusFilter],
    queryFn: () => supportService.getAll({ page, limit: 10, status: statusFilter || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { response?: string } }) => supportService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supportTickets'] }); toast.success('Ticket updated'); setIsEditModalOpen(false); setSelectedTicket(null); setResponseText(''); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to update ticket'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['supportTickets'] }); toast.success('Ticket deleted'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to delete ticket'); },
  });

  const getClientName = (ticket: SupportTicket) => typeof ticket.clientId === 'object' && ticket.clientId ? ticket.clientId.fullName : 'Unknown';
  const getAdminName = (ticket: SupportTicket) => typeof ticket.adminId === 'object' && ticket.adminId ? (ticket.adminId.name || ticket.adminId.email) : 'Unknown';

  const statusBadgeVariant = (status?: string): 'success' | 'neutral' | 'warning' => {
    if (status === 'closed') return 'success';
    if (status === 'pending') return 'warning';
    return 'neutral';
  };

  return (
    <Layout>
      <div>
        <PageHeader title="Support Tickets" />

        <div className="mb-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`max-w-xs ${iosInputCls}`}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <ListGroup>
              {data?.supportTickets.map((ticket) => (
                <ListRow
                  key={ticket._id}
                  leading={
                    <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-brand-hover" />
                    </div>
                  }
                  title={getClientName(ticket)}
                  subtitle={ticket.message}
                  trailing={
                    <>
                      <Badge variant={statusBadgeVariant(ticket.status)}>{ticket.status || 'Open'}</Badge>
                      <div className="relative" ref={(el) => { dropdownRefs.current[ticket._id] = el; }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === ticket._id ? null : ticket._id)}
                          className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                          type="button"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openDropdownId === ticket._id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                            <button onClick={() => { setSelectedTicket(ticket); setIsViewModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">View Details</button>
                            <button onClick={() => { setSelectedTicket(ticket); setResponseText(ticket.response || ''); setIsEditModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Respond</button>
                            <button onClick={() => { if (window.confirm('Delete this ticket?')) deleteMutation.mutate(ticket._id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10">Delete</button>
                          </div>
                        )}
                      </div>
                    </>
                  }
                />
              ))}
              {data?.supportTickets.length === 0 && (
                <div className="px-4 py-12 text-center text-ios-gray">No support tickets yet</div>
              )}
            </ListGroup>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}

        {/* View Modal */}
        <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedTicket(null); }} title="Ticket Details" size="large">
          {selectedTicket && (
            <div className="space-y-3">
              <Field label="Client" value={getClientName(selectedTicket)} />
              <Field label="Admin" value={getAdminName(selectedTicket)} />
              <Field label="Status" value={selectedTicket.status || 'Open'} />
              <div>
                <p className="text-xs font-medium text-ios-secondary-label mb-1">Message</p>
                <p className="text-sm text-ios-label whitespace-pre-wrap bg-ios-gray6 rounded-ios p-3">{selectedTicket.message}</p>
              </div>
              {selectedTicket.response && (
                <div>
                  <p className="text-xs font-medium text-ios-secondary-label mb-1">Response</p>
                  <p className="text-sm text-ios-label whitespace-pre-wrap bg-ios-gray6 rounded-ios p-3">{selectedTicket.response}</p>
                </div>
              )}
              <Field label="Created" value={new Date(selectedTicket.createdAt).toLocaleString()} />
              <Field label="Updated" value={new Date(selectedTicket.updatedAt).toLocaleString()} />
            </div>
          )}
        </Modal>

        {/* Respond Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedTicket(null); setResponseText(''); }} title="Respond to Ticket" size="large">
          {selectedTicket && (
            <>
              <div className="mb-4">
                <p className="text-xs font-medium text-ios-secondary-label mb-1">Original Message</p>
                <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3">{selectedTicket.message}</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: selectedTicket._id, data: { response: responseText } }); }} className="space-y-4">
                <FormField label="Response">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    required
                    rows={6}
                    className={iosInputCls}
                    placeholder="Enter your response..."
                  />
                </FormField>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedTicket(null); setResponseText(''); }}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Response'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-ios-secondary-label">{label}</p>
    <p className="text-sm text-ios-label">{value}</p>
  </div>
);
