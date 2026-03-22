import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
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

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Support Tickets</h1>

        <div className="mb-4">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Admin</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.supportTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{getClientName(ticket)}</td>
                      <td className="px-4 py-3 text-gray-600">{getAdminName(ticket)}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[250px] truncate">{ticket.message}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : ticket.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                          {ticket.status || 'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block" ref={(el) => { dropdownRefs.current[ticket._id] = el; }}>
                          <button onClick={() => setOpenDropdownId(openDropdownId === ticket._id ? null : ticket._id)} className="p-1 text-gray-400 hover:text-gray-600" type="button">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                          </button>
                          {openDropdownId === ticket._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button onClick={() => { setSelectedTicket(ticket); setIsViewModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">View Details</button>
                              <button onClick={() => { setSelectedTicket(ticket); setResponseText(ticket.response || ''); setIsEditModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Respond</button>
                              <button onClick={() => { if (window.confirm('Delete this ticket?')) deleteMutation.mutate(ticket._id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
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

        {/* View Modal */}
        <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedTicket(null); }} title="Ticket Details" size="large">
          {selectedTicket && (
            <div className="space-y-3">
              <Field label="Client" value={getClientName(selectedTicket)} />
              <Field label="Admin" value={getAdminName(selectedTicket)} />
              <Field label="Status" value={selectedTicket.status || 'Open'} />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{selectedTicket.message}</p>
              </div>
              {selectedTicket.response && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Response</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{selectedTicket.response}</p>
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
                <p className="text-xs font-medium text-gray-500 mb-1">Original Message</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{selectedTicket.message}</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: selectedTicket._id, data: { response: responseText } }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                  <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} required rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Enter your response..." />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedTicket(null); setResponseText(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                    {updateMutation.isPending ? 'Saving...' : 'Save Response'}
                  </button>
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
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800">{value}</p>
  </div>
);
