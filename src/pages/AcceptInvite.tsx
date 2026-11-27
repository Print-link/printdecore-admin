import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import logoArt from '../assets/images/LogoArt.png';
import { firstAllowedPath } from '../auth/permissions';
import { adminAccessService } from '../services/adminAccessService';

const PASSWORD_MIN = 10;

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const ErrorBox = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 bg-ios-red/10 border border-ios-red/20 rounded-ios px-3.5 py-2.5">
    <AlertCircle className="w-4 h-4 text-ios-red shrink-0 mt-0.5" />
    <p className="text-sm text-ios-red">{children}</p>
  </div>
);

/** Where an invited admin lands from their email: they pick their own name and password, and are signed in */
export const AcceptInvite = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const invite = useQuery({
    queryKey: ['admin-invitation', token],
    queryFn: () => adminAccessService.lookupInvitation(token),
    enabled: !!token,
    retry: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < PASSWORD_MIN) return setFormError(`Your password needs at least ${PASSWORD_MIN} characters.`);
    if (password !== confirm) return setFormError("The two passwords don't match.");
    setSubmitting(true);
    try {
      const { email } = await adminAccessService.acceptInvitation(token, name.trim(), password);
      try {
        const grants = await login(email, password);
        navigate(firstAllowedPath(grants), { replace: true });
      } catch {
        // The account exists; signing in can be done by hand
        navigate('/login', { replace: true });
      }
    } catch (error) {
      setFormError(errorMessage(error, "Couldn't set up your account. Try again."));
      setSubmitting(false);
    }
  };

  const linkProblem = !token
    ? "This link is missing its invitation code. Open the link from your invitation email again."
    : invite.isError
      ? errorMessage(invite.error, "We couldn't check this invitation. Try again in a moment.")
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-grouped-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoArt} alt="PrintDecore" className="h-40 w-auto mx-auto" />
          <h1 className="text-3xl font-bold text-ios-label tracking-tight">Set up your account</h1>
          <p className="text-sm text-ios-secondary-label mt-1">PrintDecore admin dashboard</p>
        </div>

        {linkProblem ? (
          <div className="bg-white rounded-ios-lg shadow-ios p-6 space-y-4">
            <ErrorBox>{linkProblem}</ErrorBox>
            <Link to="/login" className="block text-center text-sm font-medium text-ios-blue">Go to sign in</Link>
          </div>
        ) : invite.isLoading || !invite.data ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-ios-lg shadow-ios p-6 space-y-4">
            <p className="text-sm text-ios-secondary-label">
              {invite.data.invitedByName ? <><span className="font-medium text-ios-label">{invite.data.invitedByName}</span> invited you</> : "You've been invited"}
              {invite.data.roles.length > 0 && <> as <span className="font-medium text-ios-label">{invite.data.roles.join(', ')}</span></>}
              . Choose your name and a password to finish.
            </p>

            {formError && <ErrorBox>{formError}</ErrorBox>}

            <FormField label="Email">
              <input type="email" value={invite.data.email} readOnly disabled autoComplete="username" className={`${iosInputCls} opacity-70`} />
            </FormField>
            <FormField label="Your name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoFocus
                autoComplete="name"
                className={iosInputCls}
                placeholder="Ama Mensah"
              />
            </FormField>
            <FormField label={`Password (at least ${PASSWORD_MIN} characters)`}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASSWORD_MIN}
                maxLength={72}
                autoComplete="new-password"
                className={iosInputCls}
              />
            </FormField>
            <FormField label="Confirm password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className={iosInputCls}
              />
            </FormField>

            <Button type="submit" variant="primary" disabled={submitting} className="w-full py-2.5">
              {submitting ? <LoadingSpinner size="sm" /> : 'Create my account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
