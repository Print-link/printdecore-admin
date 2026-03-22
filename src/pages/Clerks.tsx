import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clerkService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';

export const Clerks = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['clerks', page, search, statusFilter],
    queryFn: () => clerkService.getAll({ page, limit: 10, search: search || undefined, isActive: statusFilter ? statusFilter === 'active' : undefined }),
  });

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Clerks</h1>

        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="Search clerks..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Admin</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.clerks.map((clerk) => {
                    const admin = typeof clerk.adminId === 'object' ? clerk.adminId : null;
                    return (
                      <tr key={clerk._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{clerk.name}</td>
                        <td className="px-4 py-3 text-gray-600">{clerk.email}</td>
                        <td className="px-4 py-3 text-gray-600">{admin ? admin.name || admin.email : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${clerk.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {clerk.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(clerk.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </Layout>
  );
};
