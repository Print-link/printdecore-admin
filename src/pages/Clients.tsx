import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, UserRound } from 'lucide-react';
import { formatRelative } from '../utils/date';
import { clientService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { iosInputCls } from '../components/ui/FormField';

export const Clients = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, statusFilter],
    queryFn: () => clientService.getAll({ page, limit: 10, search: search || undefined, isActive: statusFilter ? statusFilter === 'active' : undefined }),
  });

  return (
    <Layout>
      <div>
        <PageHeader title="Clients" />

        <div className="flex gap-3 mb-3">
          <input type="text" placeholder="Search clients..." value={search}
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
              {data?.clients.map((client) => (
                <ListRow
                  key={client._id}
                  leading={
                    <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                      <UserRound className="w-5 h-5 text-brand-hover" />
                    </div>
                  }
                  title={client.fullName}
                  subtitle={[client.email, client.phoneNumber].filter(Boolean).join(' · ')}
                  trailing={
                    <>
                      {client.lastLocation ? (
                        <a
                          href={`https://www.google.com/maps?q=${client.lastLocation.latitude},${client.lastLocation.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hidden md:flex items-center gap-1 text-xs text-ios-secondary-label hover:text-brand-hover max-w-[260px]"
                          title={`${client.lastLocation.source === 'manual' ? 'Pinned by the customer' : 'Live location'} · ${new Date(client.lastLocation.updatedAt).toLocaleString()}`}
                        >
                          {client.lastLocation.source === 'manual' ? (
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {client.lastLocation.label || `${client.lastLocation.latitude.toFixed(4)}, ${client.lastLocation.longitude.toFixed(4)}`}
                          </span>
                          <span className="text-ios-gray flex-shrink-0">· {formatRelative(client.lastLocation.updatedAt)}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-ios-gray hidden md:block">No location yet</span>
                      )}
                      <Badge variant={client.isActive ? 'success' : 'neutral'}>{client.isActive ? 'Active' : 'Inactive'}</Badge>
                    </>
                  }
                />
              ))}
              {data?.clients.length === 0 && (
                <div className="px-4 py-12 text-center text-ios-gray">No clients yet</div>
              )}
            </ListGroup>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </Layout>
  );
};
