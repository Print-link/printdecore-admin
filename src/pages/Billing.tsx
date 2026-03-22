import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import type { Plan } from '../types';

export const Billing = () => {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: billingService.getPlans,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) => billingService.updatePlan(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); toast.success('Plan updated'); setEditingPlan(null); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to update plan'); },
  });

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlan) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingPlan.id,
      data: {
        monthlyPrice: Number(fd.get('monthlyPrice')),
        yearlyPrice: Number(fd.get('yearlyPrice')),
        maxBranches: Number(fd.get('maxBranches')),
        maxClerks: Number(fd.get('maxClerks')),
        maxServices: Number(fd.get('maxServices')),
        maxOrdersPerMonth: Number(fd.get('maxOrdersPerMonth')),
        commissionPercent: Number(fd.get('commissionPercent')),
        description: fd.get('description') as string,
      },
    });
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mb-6">Manage subscription plans and pricing</p>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans?.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {plan.description && <p className="text-sm text-gray-500 mb-4">{plan.description}</p>}

                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-semibold text-gray-900">{plan.currency} {plan.monthlyPrice}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Yearly</span><span className="font-semibold text-gray-900">{plan.currency} {plan.yearlyPrice}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Commission</span><span className="font-medium">{plan.commissionPercent}%</span></div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-600 flex-1">
                  <p>Branches: {plan.maxBranches === -1 ? 'Unlimited' : plan.maxBranches}</p>
                  <p>Clerks: {plan.maxClerks === -1 ? 'Unlimited' : plan.maxClerks}</p>
                  <p>Orders/mo: {plan.maxOrdersPerMonth === -1 ? 'Unlimited' : plan.maxOrdersPerMonth}</p>
                  <p>Services: {plan.maxServices === -1 ? 'Unlimited' : plan.maxServices}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {plan.hasWhatsapp && <Badge label="WhatsApp" />}
                    {plan.hasWhatsappBroadcast && <Badge label="Broadcast" />}
                    {plan.hasWhatsappLabels && <Badge label="Labels" />}
                    {plan.hasAnalytics && <Badge label="Analytics" />}
                    {plan.hasCrm && <Badge label="CRM" />}
                    {plan.hasCustomRoles && <Badge label="Custom Roles" />}
                  </div>
                </div>

                <button onClick={() => setEditingPlan(plan)} className="mt-4 w-full py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                  Edit Plan
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit Plan Modal */}
        <Modal isOpen={!!editingPlan} onClose={() => setEditingPlan(null)} title={`Edit ${editingPlan?.name || ''} Plan`} size="large">
          {editingPlan && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" defaultValue={editingPlan.description} rows={2} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ({editingPlan.currency})</label>
                  <input type="number" name="monthlyPrice" defaultValue={editingPlan.monthlyPrice} step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price ({editingPlan.currency})</label>
                  <input type="number" name="yearlyPrice" defaultValue={editingPlan.yearlyPrice} step="0.01" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Branches</label>
                  <input type="number" name="maxBranches" defaultValue={editingPlan.maxBranches} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Clerks</label>
                  <input type="number" name="maxClerks" defaultValue={editingPlan.maxClerks} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Services</label>
                  <input type="number" name="maxServices" defaultValue={editingPlan.maxServices} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Orders/Month</label>
                  <input type="number" name="maxOrdersPerMonth" defaultValue={editingPlan.maxOrdersPerMonth} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                <input type="number" name="commissionPercent" defaultValue={editingPlan.commissionPercent} step="0.1" min="0" max="100" className={inputCls} />
              </div>
              <p className="text-xs text-gray-400">Use -1 for unlimited limits. Feature flags (WhatsApp, CRM, etc.) are managed via database.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

const Badge = ({ label }: { label: string }) => (
  <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">{label}</span>
);
