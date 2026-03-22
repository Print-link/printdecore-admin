import { useQuery } from '@tanstack/react-query';
import { whatsappAdminService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Management</h1>
        <p className="text-sm text-gray-500 mb-6">Monitor connections and broadcast campaigns</p>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Connections */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Connections</h2>
              {connections && connections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connections.map((conn: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">{conn.branchName || `Branch ${conn.branchId}`}</span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          conn.status === 'connected' ? 'bg-green-100 text-green-700' :
                          conn.status === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {conn.status}
                        </span>
                      </div>
                      {conn.phoneNumber && <p className="text-xs text-gray-500">Phone: {conn.phoneNumber}</p>}
                      {conn.lastSeen && <p className="text-xs text-gray-400 mt-1">Last seen: {new Date(conn.lastSeen).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No active WhatsApp connections
                </div>
              )}
            </div>

            {/* Broadcasts */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Broadcasts</h2>
              {broadcastData?.broadcasts && broadcastData.broadcasts.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Target</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Sent</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Failed</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {broadcastData.broadcasts.map((bc: any) => (
                        <tr key={bc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{bc.name}</td>
                          <td className="px-4 py-3 text-gray-600">{bc.targetType} ({bc.recipientCount})</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              bc.status === 'completed' ? 'bg-green-100 text-green-700' :
                              bc.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                              bc.status === 'failed' ? 'bg-red-100 text-red-700' :
                              bc.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {bc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{bc.sentCount}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{bc.failedCount}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(bc.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No broadcasts found
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
