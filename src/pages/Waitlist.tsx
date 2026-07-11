import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { waitlistService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { iosInputCls } from '../components/ui/FormField';
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
    { label: 'Total Signups', value: totalCount ?? 0 },
    { label: 'Customers', value: customerCount ?? 0 },
    { label: 'Vendors', value: vendorCount ?? 0 },
  ];

  return (
    <Layout>
      <div>
        <PageHeader title="Waitlist" subtitle="People who signed up for early access" />

        <div className="grid grid-cols-3 gap-4 mb-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-medium text-ios-secondary-label uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-ios-label mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`max-w-xs ${iosInputCls}`}
          >
            <option value="">All Types</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <ListGroup>
            {entries?.map((entry: WaitlistEntry) => (
              <ListRow
                key={entry.id}
                leading={
                  <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-hover" />
                  </div>
                }
                title={entry.name || '-'}
                subtitle={[entry.email, entry.phone].filter(Boolean).join(' · ')}
                trailing={
                  <>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-ios-secondary-label">{[entry.city, entry.country].filter(Boolean).join(', ') || '-'}</p>
                      <p className="text-xs text-ios-gray">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={entry.userType === 'customer' ? 'success' : 'neutral'}>{entry.userType}</Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { if (window.confirm('Remove this entry?')) deleteMutation.mutate(entry.id); }}
                    >
                      Remove
                    </Button>
                  </>
                }
              />
            ))}
            {(!entries || entries.length === 0) && (
              <div className="px-4 py-12 text-center text-ios-gray">No waitlist entries found</div>
            )}
          </ListGroup>
        )}
      </div>
    </Layout>
  );
};
