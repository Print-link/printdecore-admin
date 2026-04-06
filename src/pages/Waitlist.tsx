import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waitlistService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import toast from 'react-hot-toast';
import type { WaitlistEntry } from '../types';

export const Waitlist = () => {
  const [typeFilter, setTypeFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['waitlist', typeFilter],
    queryFn: () => waitlistService.getAll(typeFilter ? { userType: typeFilter } : undefined),
  });

  const { data: totalCount } = useQuery({
    queryKey: ['waitlistCount'],
    queryFn: () => waitlistService.getCount(),
  });

  const { data: vendorCount } = useQuery({
    queryKey: ['waitlistCount', 'vendor'],
    queryFn: () => waitlistService.getCount({ userType: 'vendor' }),
  });

  const { data: customerCount } = useQuery({
    queryKey: ['waitlistCount', 'customer'],
    queryFn: () => waitlistService.getCount({ userType: 'customer' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => waitlistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['waitlistCount'] });
      toast.success('Entry removed');
    },
    onError: () => toast.error('Failed to remove entry'),
  });

  const stats = [
    { label: 'Total Signups', value: totalCount ?? 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'Customers', value: customerCount ?? 0, color: 'bg-green-50 text-green-700' },
    { label: 'Vendors', value: vendorCount ?? 0, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Waitlist</h1>
        <p className="text-sm text-gray-500 mb-6">People who signed up for early access</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">All Types</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries?.map((entry: WaitlistEntry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.email}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        entry.userType === 'vendor' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {entry.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{[entry.city, entry.country].filter(Boolean).join(', ') || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.referralSource || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { if (window.confirm('Remove this entry?')) deleteMutation.mutate(entry.id); }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {(!entries || entries.length === 0) && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No waitlist entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};
