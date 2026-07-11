import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import logoArt from '../assets/images/LogoArt.png';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-grouped-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoArt} alt="PrintDecore" className="h-28 w-auto mx-auto" />
          <h1 className="text-3xl font-bold text-ios-label tracking-tight">Welcome back</h1>
          <p className="text-sm text-ios-secondary-label mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-ios-lg shadow-ios p-6 space-y-4">
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
