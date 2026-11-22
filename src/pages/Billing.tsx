import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import toast from 'react-hot-toast';
import type { Plan } from '../types';
import { Can } from '../components/Can';

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

  return (
    <Layout>
      <div>
        <PageHeader title="Billing & Plans" subtitle="Manage subscription plans and pricing" />

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans?.map((plan) => (
              <Card key={plan.id} className="p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-ios-label">{plan.name}</h3>
                  <Badge variant={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>

                {plan.description && <p className="text-sm text-ios-secondary-label mb-4">{plan.description}</p>}

                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-ios-secondary-label">Monthly</span><span className="font-semibold text-ios-label">{plan.currency} {plan.monthlyPrice}</span></div>
                  <div className="flex justify-between"><span className="text-ios-secondary-label">Yearly</span><span className="font-semibold text-ios-label">{plan.currency} {plan.yearlyPrice}</span></div>
                  <div className="flex justify-between"><span className="text-ios-secondary-label">Commission</span><span className="font-medium text-ios-label">{plan.commissionPercent}%</span></div>
                </div>

                <div className="border-t border-ios-gray5 pt-3 space-y-1.5 text-xs text-ios-secondary-label flex-1">
                  <p>Branches: {plan.maxBranches === -1 ? 'Unlimited' : plan.maxBranches}</p>
                  <p>Clerks: {plan.maxClerks === -1 ? 'Unlimited' : plan.maxClerks}</p>
                  <p>Orders/mo: {plan.maxOrdersPerMonth === -1 ? 'Unlimited' : plan.maxOrdersPerMonth}</p>
                  <p>Services: {plan.maxServices === -1 ? 'Unlimited' : plan.maxServices}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {plan.hasWhatsapp && <Badge variant="neutral">WhatsApp</Badge>}
                    {plan.hasWhatsappBroadcast && <Badge variant="neutral">Broadcast</Badge>}
                    {plan.hasWhatsappLabels && <Badge variant="neutral">Labels</Badge>}
                    {plan.hasAnalytics && <Badge variant="neutral">Analytics</Badge>}
                    {plan.hasCrm && <Badge variant="neutral">CRM</Badge>}
                    {plan.hasCustomRoles && <Badge variant="neutral">Custom Roles</Badge>}
                  </div>
                </div>

                <Can permission="finance.manage">
                <Button variant="secondary" size="sm" onClick={() => setEditingPlan(plan)} className="mt-4 w-full py-2">
                  Edit Plan
                </Button>
                </Can>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Plan Modal */}
        <Modal isOpen={!!editingPlan} onClose={() => setEditingPlan(null)} title={`Edit ${editingPlan?.name || ''} Plan`} size="large">
          {editingPlan && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <FormField label="Description">
                <textarea name="description" defaultValue={editingPlan.description} rows={2} className={iosInputCls} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={`Monthly Price (${editingPlan.currency})`}>
                  <input type="number" name="monthlyPrice" defaultValue={editingPlan.monthlyPrice} step="0.01" className={iosInputCls} />
                </FormField>
                <FormField label={`Yearly Price (${editingPlan.currency})`}>
                  <input type="number" name="yearlyPrice" defaultValue={editingPlan.yearlyPrice} step="0.01" className={iosInputCls} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Max Branches">
                  <input type="number" name="maxBranches" defaultValue={editingPlan.maxBranches} className={iosInputCls} />
                </FormField>
                <FormField label="Max Clerks">
                  <input type="number" name="maxClerks" defaultValue={editingPlan.maxClerks} className={iosInputCls} />
                </FormField>
                <FormField label="Max Services">
                  <input type="number" name="maxServices" defaultValue={editingPlan.maxServices} className={iosInputCls} />
                </FormField>
                <FormField label="Max Orders/Month">
                  <input type="number" name="maxOrdersPerMonth" defaultValue={editingPlan.maxOrdersPerMonth} className={iosInputCls} />
                </FormField>
              </div>
              <FormField label="Commission %">
                <input type="number" name="commissionPercent" defaultValue={editingPlan.commissionPercent} step="0.1" min="0" max="100" className={iosInputCls} />
              </FormField>
              <p className="text-xs text-ios-gray">Use -1 for unlimited limits. Feature flags (WhatsApp, CRM, etc.) are managed via database.</p>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditingPlan(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
