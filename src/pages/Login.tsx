import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import logoArt from '../assets/images/LogoArt.png';
import { firstAllowedPath } from '../auth/permissions';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    try {
      const grants = await login(email, password);
      navigate(firstAllowedPath(grants));
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Login failed. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-grouped-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoArt} alt="PrintDecore" className="h-60 w-auto mx-auto" />
          <h1 className="text-3xl font-bold text-ios-label tracking-tight">Welcome back</h1>
          <p className="text-sm text-ios-secondary-label mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-ios-lg shadow-ios p-6 space-y-4">
          {loginError && (
            <div className="flex items-start gap-2 bg-ios-red/10 border border-ios-red/20 rounded-ios px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-ios-red shrink-0 mt-0.5" />
              <p className="text-sm text-ios-red">{loginError}</p>
            </div>
          )}

          <FormField label="Email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={iosInputCls}
              placeholder="admin@example.com"
            />
          </FormField>

          <FormField label="Password">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={iosInputCls}
              placeholder="••••••••"
            />
          </FormField>

          <Button type="submit" variant="primary" disabled={isLoading} className="w-full py-2.5">
            {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};
