import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Mail, Pencil, Plus, RotateCw, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormField, iosInputCls } from '../components/ui/FormField';
import {
  adminAccessService,
  type AdminAccount,
  type AdminInvitation,
  type AdminPermissionInfo,
  type AdminRole,
  type AdminRoleAssignment,
} from '../services/adminAccessService';
import { branchService } from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import type { AdminPermission } from '../auth/permissions';

type Tab = 'admins' | 'roles' | 'audit';

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Admins, the roles they hold (optionally for one branch), and what each role allows */
export const Roles = () => {
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>('admins');

  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: adminAccessService.roles });
  const { data: permissions = [] } = useQuery({ queryKey: ['admin-permissions'], queryFn: adminAccessService.permissions });
  const { data: branchData } = useQuery({
    queryKey: ['branches', 'all-for-roles'],
    queryFn: () => branchService.getAll({ limit: 1000 }),
    enabled: can('branches.view'),
  });
  const branches = branchData?.branches ?? [];

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'admins', label: 'Admins' },
    { id: 'roles', label: 'Roles' },
    { id: 'audit', label: 'Change history' },
  ];

  return (
    <Layout>
      <PageHeader title="Roles & Permissions" subtitle="Who can see and do what on the admin dashboard" />
      <div className="flex gap-1 mb-5 bg-ios-gray6 rounded-full p-1 w-fit" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white shadow-ios text-ios-label' : 'text-ios-secondary-label hover:text-ios-label'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rolesLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : tab === 'admins' ? (
        <AdminsTab roles={roles} branches={branches} />
      ) : tab === 'roles' ? (
        <RolesTab roles={roles} permissions={permissions} />
      ) : (
        <AuditTab />
      )}
    </Layout>
  );
};

// ── Admins ─────────────────────────────────────────────────────────────────

interface BranchOption {
  id: string;
  name: string;
}

const AdminsTab = ({ roles, branches }: { roles: AdminRole[]; branches: BranchOption[] }) => {
  const queryClient = useQueryClient();
  const { superAdmin, refreshPermissions } = useAuth();
  const { data: admins = [], isLoading } = useQuery({ queryKey: ['admin-accounts'], queryFn: adminAccessService.admins });
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
  };

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminAccessService.updateAdmin(id, { isActive }),
    onSuccess: (_d, v) => { invalidate(); toast.success(v.isActive ? 'Admin reactivated' : 'Admin deactivated'); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't change the admin")),
  });

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setCreating(true)}><Plus className="w-4 h-4" />Invite admin</Button>
      </div>
      <PendingInvitations />
      <Card className="divide-y divide-ios-gray5">
        {admins.map((a) => (
          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ios-label truncate">{a.name}</p>
                {a.id === superAdmin?.id && <Badge>You</Badge>}
                {!a.isActive && <Badge variant="danger">Deactivated</Badge>}
              </div>
              <p className="text-xs text-ios-secondary-label truncate">{a.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {a.roles.length === 0 && <span className="text-xs text-ios-gray">No roles: can't open any page</span>}
                {a.roles.map((r) => (
                  <Badge key={`${r.roleId}:${r.branchId}`} variant={r.branchId ? 'warning' : 'neutral'}>
                    {r.roleName}{r.branchId ? ` · ${r.branchName ?? 'one branch'}` : ''}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => setEditing(a)}>Roles</Button>
              {a.id !== superAdmin?.id && (
                <Button
                  size="sm"
                  variant={a.isActive ? 'ghost' : 'secondary'}
                  disabled={setActive.isPending}
                  onClick={() => {
                    if (!a.isActive || window.confirm(`Deactivate ${a.name}? They'll be signed out and lose all access.`)) {
                      setActive.mutate({ id: a.id, isActive: !a.isActive });
                    }
                  }}
                >
                  {a.isActive ? 'Deactivate' : 'Reactivate'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {editing && (
        <AssignRolesModal
          admin={editing}
          roles={roles}
          branches={branches}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            if (editing.id === superAdmin?.id) refreshPermissions();
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <InviteAdminModal
          roles={roles}
          branches={branches}
          onClose={() => setCreating(false)}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ['admin-invitations'] }); setCreating(false); }}
        />
      )}
    </>
  );
};

/** Pick roles, each for every branch or for one */
const AssignmentEditor = ({
  value,
  onChange,
  roles,
  branches,
}: {
  value: AdminRoleAssignment[];
  onChange: (v: AdminRoleAssignment[]) => void;
  roles: AdminRole[];
  branches: BranchOption[];
}) => {
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? 'Role';
  const branchName = (id: string | null) => (id ? branches.find((b) => b.id === id)?.name ?? 'One branch' : 'All branches');

  const add = () => {
    if (!roleId) return;
    const next = { roleId, branchId: branchId || null };
    if (value.some((v) => v.roleId === next.roleId && v.branchId === next.branchId)) return;
    onChange([...value, next]);
    setRoleId('');
    setBranchId('');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {value.length === 0 && <p className="text-xs text-ios-gray">No roles yet. This admin won't be able to open any page.</p>}
        {value.map((v, i) => (
          <div key={`${v.roleId}:${v.branchId}`} className="flex items-center justify-between bg-ios-gray6 rounded-ios px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{v.roleName ?? roleName(v.roleId)}</span>
              <span className="text-ios-secondary-label"> · {v.branchName ?? branchName(v.branchId)}</span>
            </span>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-ios-gray hover:text-ios-red" aria-label="Remove role">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={iosInputCls} aria-label="Role">
          <option value="">Choose a role…</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={iosInputCls} aria-label="Branch">
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>Only {b.name}</option>)}
        </select>
        <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!roleId}>Add</Button>
      </div>
    </div>
  );
};

const AssignRolesModal = ({
  admin, roles, branches, onClose, onSaved,
}: { admin: AdminAccount; roles: AdminRole[]; branches: BranchOption[]; onClose: () => void; onSaved: () => void }) => {
  const [value, setValue] = useState<AdminRoleAssignment[]>(admin.roles);
  const save = useMutation({
    mutationFn: () => adminAccessService.setAdminRoles(admin.id, value),
    onSuccess: () => { toast.success('Roles saved'); onSaved(); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't save roles")),
  });
  return (
    <Modal isOpen onClose={onClose} title={`Roles for ${admin.name}`} size="large">
      <div className="space-y-4">
        <AssignmentEditor value={value} onChange={setValue} roles={roles} branches={branches} />
        <p className="text-xs text-ios-secondary-label">
          A role for one branch only applies to that branch's orders, quotes and settings, and only that branch's order alerts are sent.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save roles'}</Button>
        </div>
      </div>
    </Modal>
  );
};

const sentToast = (r: { email: string; emailSent: boolean }, verb: string) => {
  if (r.emailSent) toast.success(`${verb} ${r.email}`);
  else toast.error(`The invite was saved but the email to ${r.email} didn't go out. Try Resend in a minute.`);
};

/** The inviter gives an email and roles; the invitee chooses their own name and password from the email */
const InviteAdminModal = ({
  roles, branches, onClose, onSaved,
}: { roles: AdminRole[]; branches: BranchOption[]; onClose: () => void; onSaved: () => void }) => {
  const [assignments, setAssignments] = useState<AdminRoleAssignment[]>([]);
  const invite = useMutation({
    mutationFn: (email: string) => adminAccessService.invite(email, assignments),
    onSuccess: (r) => { sentToast(r, 'Invitation sent to'); onSaved(); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't send the invitation")),
  });
  return (
    <Modal isOpen onClose={onClose} title="Invite admin" size="large">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          invite.mutate(String(new FormData(e.currentTarget).get('email')).trim());
        }}
      >
        <FormField label="Email">
          <input name="email" type="email" required autoFocus autoComplete="off" className={iosInputCls} placeholder="name@example.com" />
        </FormField>
        <FormField label="Roles">
          <AssignmentEditor value={assignments} onChange={setAssignments} roles={roles} branches={branches} />
        </FormField>
        <p className="text-xs text-ios-secondary-label">
          We'll email them a link to choose their own name and password. The link works once and expires in 7 days.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={invite.isPending}>{invite.isPending ? 'Sending…' : 'Send invitation'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Invitations nobody has accepted yet, with resend and revoke */
const PendingInvitations = () => {
  const queryClient = useQueryClient();
  const { data: invites = [] } = useQuery({ queryKey: ['admin-invitations'], queryFn: adminAccessService.invitations });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });

  const resend = useMutation({
    mutationFn: (id: string) => adminAccessService.resendInvitation(id),
    onSuccess: (r) => { refresh(); sentToast(r, 'Sent a new link to'); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't resend the invitation")),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => adminAccessService.revokeInvitation(id),
    onSuccess: () => { refresh(); toast.success('Invitation revoked'); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't revoke the invitation")),
  });

  if (!invites.length) return null;

  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ios-secondary-label mb-2 px-1">Pending invitations</h3>
      <Card className="divide-y divide-ios-gray5">
        {invites.map((inv: AdminInvitation) => (
          <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-ios-gray shrink-0" />
                <p className="font-medium text-ios-label truncate">{inv.email}</p>
                {inv.expired ? <Badge variant="danger">Expired</Badge> : <Badge variant="warning">Invited</Badge>}
              </div>
              <p className="text-xs text-ios-secondary-label mt-0.5">
                {inv.invitedByName ? `Invited by ${inv.invitedByName} · ` : ''}
                {inv.sentCount > 1 ? `sent ${inv.sentCount} times, last ${shortDate(inv.lastSentAt)}` : `sent ${shortDate(inv.lastSentAt)}`}
                {' · '}
                {inv.expired ? 'link expired' : `expires ${shortDate(inv.expiresAt)}`}
              </p>
              {inv.roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {inv.roles.map((r) => (
                    <Badge key={`${r.roleId}:${r.branchId}`} variant={r.branchId ? 'warning' : 'neutral'}>
                      {r.roleName}{r.branchId ? ` · ${r.branchName ?? 'one branch'}` : ''}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                disabled={resend.isPending && resend.variables === inv.id}
                onClick={() => resend.mutate(inv.id)}
              >
                <RotateCw className="w-3.5 h-3.5" />Resend
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={revoke.isPending && revoke.variables === inv.id}
                onClick={() => {
                  if (window.confirm(`Revoke the invitation for ${inv.email}? The link in their email will stop working.`)) revoke.mutate(inv.id);
                }}
              >
                Revoke
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ── Roles ──────────────────────────────────────────────────────────────────

const RolesTab = ({ roles, permissions }: { roles: AdminRole[]; permissions: AdminPermissionInfo[] }) => {
  const queryClient = useQueryClient();
  const { refreshPermissions } = useAuth();
  const [editing, setEditing] = useState<AdminRole | 'new' | null>(null);
  const label = (key: string) => permissions.find((p) => p.key === key)?.name ?? key;

  const remove = useMutation({
    mutationFn: (id: string) => adminAccessService.deleteRole(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); toast.success('Role deleted'); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't delete the role")),
  });

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setEditing('new')}><Plus className="w-4 h-4" />New role</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-ios-label flex items-center gap-1.5">
                  {role.isLocked && <Lock className="w-3.5 h-3.5 text-ios-gray" aria-label="Locked" />}
                  {role.name}
                </h3>
                <p className="text-xs text-ios-gray">{role.holderCount} admin{role.holderCount === 1 ? '' : 's'}</p>
              </div>
              {!role.isLocked && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(role)} className="p-1 text-ios-gray hover:text-ios-label" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button
                    onClick={() => { if (window.confirm(`Delete the ${role.name} role?`)) remove.mutate(role.id); }}
                    className="p-1 text-ios-gray hover:text-ios-red disabled:opacity-40"
                    disabled={role.holderCount > 0}
                    title={role.holderCount > 0 ? 'Take this role off its admins first' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {role.description && <p className="text-xs text-ios-secondary-label mb-3">{role.description}</p>}
            <div className="flex flex-wrap gap-1">
              {role.isLocked ? (
                <Badge variant="success">Every permission</Badge>
              ) : role.permissions.length === 0 ? (
                <span className="text-xs text-ios-gray">No permissions</span>
              ) : (
                role.permissions.map((p) => <Badge key={p}>{label(p)}</Badge>)
              )}
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <RoleModal
          role={editing === 'new' ? null : editing}
          permissions={permissions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
            refreshPermissions();
            setEditing(null);
          }}
        />
      )}
    </>
  );
};

const RoleModal = ({
  role, permissions, onClose, onSaved,
}: { role: AdminRole | null; permissions: AdminPermissionInfo[]; onClose: () => void; onSaved: () => void }) => {
  const [selected, setSelected] = useState<Set<AdminPermission>>(new Set(role?.permissions ?? []));
  const byCategory = useMemo(
    () =>
      permissions.reduce<Record<string, AdminPermissionInfo[]>>((acc, p) => {
        (acc[p.category] ??= []).push(p);
        return acc;
      }, {}),
    [permissions],
  );
  const toggle = (key: AdminPermission) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const save = useMutation({
    mutationFn: (data: { name: string; description: string }) => {
      const body = { ...data, permissions: [...selected] };
      return role ? adminAccessService.updateRole(role.id, body) : adminAccessService.createRole(body);
    },
    onSuccess: () => { toast.success(role ? 'Role saved' : 'Role created'); onSaved(); },
    onError: (e) => toast.error(errorMessage(e, "Couldn't save the role")),
  });

  return (
    <Modal isOpen onClose={onClose} title={role ? `Edit ${role.name}` : 'New role'} size="large">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          save.mutate({ name: String(fd.get('name')), description: String(fd.get('description') ?? '') });
        }}
      >
        <FormField label="Name"><input name="name" required defaultValue={role?.name} className={iosInputCls} placeholder="e.g. Night shift ops" /></FormField>
        <FormField label="Description"><input name="description" defaultValue={role?.description ?? ''} className={iosInputCls} /></FormField>
        <FormField label={`Permissions (${selected.size} selected)`}>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto bg-ios-gray6 rounded-ios p-3">
            {Object.entries(byCategory).map(([category, perms]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-ios-secondary-label uppercase mb-1.5">{category}</p>
                <div className="space-y-1">
                  {perms.map((p) => (
                    <label key={p.key} className="flex items-start gap-2.5 bg-white rounded-ios px-3 py-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={selected.has(p.key)} onChange={() => toggle(p.key)} />
                      <span>
                        <span className="block text-sm font-medium text-ios-label">{p.name}</span>
                        <span className="block text-xs text-ios-secondary-label">{p.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : role ? 'Save role' : 'Create role'}</Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Change history ─────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  'role.created': 'Created role',
  'role.updated': 'Changed role',
  'role.deleted': 'Deleted role',
  'admin.created': 'Added admin',
  'admin.updated': 'Changed admin',
  'admin.roles_changed': "Changed an admin's roles",
};

const AuditTab = () => {
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-audit'], queryFn: adminAccessService.auditLog });
  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  return (
    <Card className="divide-y divide-ios-gray5">
      {data.length === 0 && <p className="p-8 text-center text-sm text-ios-gray">No changes yet</p>}
      {data.map((e) => (
        <div key={e.id} className="p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-medium text-ios-label">{ACTION_LABELS[e.action] ?? e.action}</span>
            <span className="text-xs text-ios-gray">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-xs text-ios-secondary-label">by {e.actorName ?? 'someone since removed'}</p>
          <pre className="mt-1 text-xs text-ios-secondary-label whitespace-pre-wrap break-all">{JSON.stringify(e.details)}</pre>
        </div>
      ))}
    </Card>
  );
};
