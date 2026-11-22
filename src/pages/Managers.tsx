import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, UserRound, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { managerService, otpService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import toast from 'react-hot-toast';
import type { Manager } from '../types';
import { Can } from '../components/Can';

export const Managers = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const queryClient = useQueryClient();

  // Registering a manager is a 3-step flow: verify the email owns an inbox via OTP
  // before ever collecting a password — POST /auth/register 403s without it.
  const [createStep, setCreateStep] = useState<'email' | 'otp' | 'details'>('email');
  const [regEmail, setRegEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetCreateFlow = () => {
    setCreateStep('email');
    setRegEmail('');
    setOtpCode('');
    setResendCooldown(0);
  };

  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) return;
      }
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openDropdownId]);

  const { data, isLoading } = useQuery({
    queryKey: ['managers', page, search],
    queryFn: () => managerService.getAll({ page, limit: 10, search: search || undefined }),
  });

  const sendOtpMutation = useMutation({
    mutationFn: (email: string) => otpService.sendManagerOTP(email),
    onSuccess: (_res, email) => {
      setRegEmail(email);
      setCreateStep('otp');
      setResendCooldown(60);
      toast.success(`Verification code sent to ${email}`);
    },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to send verification code'); },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => otpService.verify(regEmail, otpCode),
    onSuccess: () => { setCreateStep('details'); toast.success('Email verified'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Invalid verification code'); },
  });

  const resendOtpMutation = useMutation({
    mutationFn: () => otpService.resend(regEmail),
    onSuccess: () => { setOtpCode(''); setResendCooldown(60); toast.success('Verification code resent'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to resend code'); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => managerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager created');
      setIsCreateModalOpen(false);
      resetCreateFlow();
    },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to create manager'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Manager> }) => managerService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['managers'] }); toast.success('Manager updated'); setIsEditModalOpen(false); setEditingManager(null); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to update manager'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => managerService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['managers'] }); toast.success('Manager removed'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to remove manager'); },
  });

  const handleSendOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    sendOtpMutation.mutate(String(fd.get('email')).trim());
  };

  const handleVerifyOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    verifyOtpMutation.mutate();
  };

  const handleSubmitDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      firstName: fd.get('firstName'), lastName: fd.get('lastName'),
      email: regEmail, phoneNumber: fd.get('phoneNumber'),
      password: fd.get('password'), role: 'manager',
    });
  };

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingManager) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingManager.id,
      data: { firstName: fd.get('firstName') as string, lastName: fd.get('lastName') as string, email: fd.get('email') as string, phoneNumber: fd.get('phoneNumber') as string },
    });
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Managers"
          actions={<Can permission="vendors.manage"><Button size="sm" onClick={() => setIsCreateModalOpen(true)}>Register Manager</Button></Can>}
        />

        <div className="mb-3">
          <input
            type="text" placeholder="Search managers..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`max-w-sm ${iosInputCls}`}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <ListGroup>
              {data?.managers.map((manager) => (
                <ListRow
                  key={manager.id}
                  leading={
                    manager.avatar ? (
                      <img src={manager.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-brand-hover" />
                      </div>
                    )
                  }
                  title={`${manager.firstName} ${manager.lastName}`}
                  subtitle={manager.email}
                  trailing={
                    <>
                      <Badge variant="neutral">{manager.role}</Badge>
                      <Can permission="vendors.manage">
                      <div className="relative" ref={(el) => { dropdownRefs.current[manager.id] = el; }}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === manager.id ? null : manager.id)}
                          className="p-1.5 rounded-full text-ios-gray hover:bg-ios-gray6"
                          type="button"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openDropdownId === manager.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                            <button onClick={() => { setEditingManager(manager); setIsEditModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                            <button onClick={() => { if (window.confirm('Remove this manager?')) deleteMutation.mutate(manager.id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10">Remove</button>
                          </div>
                        )}
                      </div>
                      </Can>
                    </>
                  }
                />
              ))}
              {data?.managers.length === 0 && (
                <div className="px-4 py-12 text-center text-ios-gray">No managers yet</div>
              )}
            </ListGroup>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}

        {/* Create Modal — 3 steps: verify email owns an inbox before ever collecting a password */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => { setIsCreateModalOpen(false); resetCreateFlow(); }}
          title={
            createStep === 'email' ? 'Register New Manager'
              : createStep === 'otp' ? 'Verify Email'
              : 'Manager Details'
          }
        >
          {createStep === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex items-start gap-3 bg-ios-gray6 rounded-ios p-3.5">
                <Mail className="w-5 h-5 text-brand-hover shrink-0 mt-0.5" />
                <p className="text-sm text-ios-secondary-label">
                  We'll email a 6-digit code to confirm this address before the manager account is created.
                </p>
              </div>
              <FormField label="Email">
                <input type="email" name="email" required className={iosInputCls} placeholder="manager@example.com" autoFocus />
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetCreateFlow(); }}>Cancel</Button>
                <Button type="submit" disabled={sendOtpMutation.isPending}>
                  {sendOtpMutation.isPending ? 'Sending…' : 'Send Verification Code'}
                </Button>
              </div>
            </form>
          )}

          {createStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-start gap-3 bg-ios-gray6 rounded-ios p-3.5">
                <ShieldCheck className="w-5 h-5 text-brand-hover shrink-0 mt-0.5" />
                <p className="text-sm text-ios-secondary-label">
                  Enter the 6-digit code sent to <span className="font-medium text-ios-label">{regEmail}</span>. It expires in 30 minutes.
                </p>
              </div>
              <FormField label="Verification Code">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className={`${iosInputCls} text-center text-lg tracking-[0.5em] font-mono`}
                  placeholder="------"
                  autoFocus
                />
              </FormField>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setCreateStep('email')}
                  className="flex items-center gap-1 text-ios-secondary-label hover:text-ios-label"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change email
                </button>
                <button
                  type="button"
                  onClick={() => resendOtpMutation.mutate()}
                  disabled={resendCooldown > 0 || resendOtpMutation.isPending}
                  className="text-brand-hover font-medium disabled:text-ios-gray disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : resendOtpMutation.isPending ? 'Resending…' : 'Resend code'}
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetCreateFlow(); }}>Cancel</Button>
                <Button type="submit" disabled={otpCode.length !== 6 || verifyOtpMutation.isPending}>
                  {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
            </form>
          )}

          {createStep === 'details' && (
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              <FormField label="Email">
                <input type="email" value={regEmail} disabled className={`${iosInputCls} opacity-60`} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name">
                  <input type="text" name="firstName" required className={iosInputCls} placeholder="First Name" autoFocus />
                </FormField>
                <FormField label="Last Name">
                  <input type="text" name="lastName" required className={iosInputCls} placeholder="Last Name" />
                </FormField>
              </div>
              <FormField label="Phone Number">
                <input type="text" name="phoneNumber" className={iosInputCls} placeholder="Optional" />
              </FormField>
              <FormField label="Password">
                <input type="password" name="password" required minLength={6} className={iosInputCls} placeholder="••••••" />
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetCreateFlow(); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Register Manager'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingManager(null); }} title="Edit Manager">
          {editingManager && (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name">
                  <input type="text" name="firstName" defaultValue={editingManager.firstName} required className={iosInputCls} />
                </FormField>
                <FormField label="Last Name">
                  <input type="text" name="lastName" defaultValue={editingManager.lastName} required className={iosInputCls} />
                </FormField>
              </div>
              <FormField label="Email">
                <input type="email" name="email" defaultValue={editingManager.email} required className={iosInputCls} />
              </FormField>
              <FormField label="Phone Number">
                <input type="text" name="phoneNumber" defaultValue={editingManager.phoneNumber} className={iosInputCls} />
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setEditingManager(null); }}>Cancel</Button>
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
