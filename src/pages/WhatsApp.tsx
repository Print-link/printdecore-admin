import { useQuery } from '@tanstack/react-query';
import { whatsappAdminService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const connectionBadgeVariant = (status: string) =>
  status === 'connected' ? 'success' : status === 'connecting' ? 'warning' : 'danger';

const broadcastBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'sending': return 'warning';
    case 'failed': return 'danger';
    case 'scheduled': return 'neutral';
    default: return 'neutral';
  }
};

export const WhatsApp = () => {
  const { data: connections, isLoading: loadingConn } = useQuery({
    queryKey: ['whatsapp-connections'],
    queryFn: whatsappAdminService.getConnections,
  });

  const { data: broadcastData, isLoading: loadingBroadcasts } = useQuery({
    queryKey: ['whatsapp-broadcasts'],
    queryFn: () => whatsappAdminService.getBroadcasts({ limit: 20 }),
  });

  const isLoading = loadingConn || loadingBroadcasts;

  return (
    <Layout>
      <div>
        <PageHeader title="WhatsApp Management" subtitle="Monitor connections and broadcast campaigns" />

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Connections */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide mb-1 px-3.5">Active Connections</p>
              {connections && connections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connections.map((conn: any, i: number) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-ios-label text-sm">{conn.branchName || `Branch ${conn.branchId}`}</span>
                        <Badge variant={connectionBadgeVariant(conn.status)}>{conn.status}</Badge>
                      </div>
                      {conn.phoneNumber && <p className="text-xs text-ios-secondary-label">Phone: {conn.phoneNumber}</p>}
                      {conn.lastSeen && <p className="text-xs text-ios-gray mt-1">Last seen: {new Date(conn.lastSeen).toLocaleString()}</p>}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-sm text-ios-gray">
                  No active WhatsApp connections
                </Card>
              )}
            </div>

            {/* Broadcasts */}
            <div>
              <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide mb-1 px-3.5">Recent Broadcasts</p>
              {broadcastData?.broadcasts && broadcastData.broadcasts.length > 0 ? (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Target</th>
                        <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Sent</th>
                        <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Failed</th>
                        <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ios-gray5">
                      {broadcastData.broadcasts.map((bc: any) => (
                        <tr key={bc.id} className="hover:bg-ios-gray6">
                          <td className="px-4 py-3 font-medium text-ios-label">{bc.name}</td>
                          <td className="px-4 py-3 text-ios-secondary-label">{bc.targetType} ({bc.recipientCount})</td>
                          <td className="px-4 py-3">
                            <Badge variant={broadcastBadgeVariant(bc.status)}>{bc.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-ios-label">{bc.sentCount}</td>
                          <td className="px-4 py-3 text-right text-ios-secondary-label">{bc.failedCount}</td>
                          <td className="px-4 py-3 text-ios-secondary-label">{new Date(bc.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : (
                <Card className="p-8 text-center text-sm text-ios-gray">
                  No broadcasts found
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
