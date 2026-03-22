import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityLogService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';

export const ActivityLogs = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, actionFilter, entityFilter],
    queryFn: () => activityLogService.getAll({
      page, limit: 20,
      action: actionFilter || undefined,
      entityType: entityFilter || undefined,
    }),
  });

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity Logs</h1>
        <p className="text-sm text-gray-500 mb-6">Audit trail of all system actions</p>

        <div className="flex gap-3 mb-4">
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
          </select>
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">All Entities</option>
            <option value="order">Order</option>
            <option value="branch">Branch</option>
            <option value="manager">Manager</option>
            <option value="clerk">Clerk</option>
            <option value="service">Service</option>
            <option value="subscription">Subscription</option>
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{log.userName || log.userId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">{log.userRole}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'delete' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.entityType}{log.entityId ? ` #${log.entityId.slice(-6)}` : ''}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '-'}</td>
                    </tr>
                  ))}
                  {(!data?.logs || data.logs.length === 0) && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No activity logs found</td></tr>
                  )}
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
