import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityLogService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { iosInputCls } from '../components/ui/FormField';

const actionBadgeVariant = (action: string) => {
  switch (action) {
    case 'create': return 'success';
    case 'update': return 'warning';
    case 'delete': return 'danger';
    default: return 'neutral';
  }
};

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
        <PageHeader title="Activity Logs" subtitle="Audit trail of all system actions" />

        <div className="flex gap-3 mb-4">
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className={`max-w-xs ${iosInputCls}`}>
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
          </select>
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className={`max-w-xs ${iosInputCls}`}>
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
            <div className="bg-white rounded-ios shadow-ios overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">User</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ios-gray5">
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-ios-gray6">
                      <td className="px-4 py-3 text-xs text-ios-secondary-label whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-ios-label">{log.userName || log.userId}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{log.userRole}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionBadgeVariant(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ios-secondary-label">{log.entityType}{log.entityId ? ` #${log.entityId.slice(-6)}` : ''}</td>
                      <td className="px-4 py-3 text-xs text-ios-gray max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '-'}</td>
                    </tr>
                  ))}
                  {(!data?.logs || data.logs.length === 0) && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-ios-gray">No activity logs found</td></tr>
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
