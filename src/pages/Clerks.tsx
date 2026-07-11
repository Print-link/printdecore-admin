import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { clerkService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { iosInputCls } from '../components/ui/FormField';

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
        <PageHeader title="Clerks" />

        <div className="flex gap-3 mb-3">
          <input type="text" placeholder="Search clerks..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`max-w-sm ${iosInputCls}`}
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`max-w-40 ${iosInputCls}`}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <ListGroup>
              {data?.clerks.map((clerk) => {
                const admin = typeof clerk.adminId === 'object' ? clerk.adminId : null;
                return (
                  <ListRow
                    key={clerk.email}
                    leading={
                      <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-brand-hover" />
                      </div>
                    }
                    title={clerk.name}
                    subtitle={clerk.email}
                    trailing={
                      <>
                        <span className="text-xs text-ios-secondary-label hidden sm:block">{admin ? admin.name || admin.email : '-'}</span>
                        <Badge variant={clerk.isActive ? 'success' : 'neutral'}>{clerk.isActive ? 'Active' : 'Inactive'}</Badge>
                        <span className="text-xs text-ios-gray hidden md:block">{new Date(clerk.createdAt).toLocaleDateString()}</span>
                      </>
                    }
                  />
                );
              })}
              {data?.clerks.length === 0 && (
                <div className="px-4 py-12 text-center text-ios-gray">No clerks yet</div>
              )}
            </ListGroup>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </Layout>
  );
};
