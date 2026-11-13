// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { login as loginApi } from '@/services/auth.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginApi(email, password);
      login(result.token, result.user);
      toast.success(`Welcome back, ${result.user.name || result.user.email}!`);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary items-center justify-center text-primary-foreground font-black text-2xl shadow-md">
            FG
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FlowGuard</h1>
          <p className="text-sm text-muted-foreground">
            Configurable Workflow Decision Platform
          </p>
        </div>

        <Card className="shadow-lg border-border/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the workflow dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center space-x-2 p-3 mb-4 text-xs font-medium border rounded-md bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@flowguard.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-0 border-t bg-muted/20 p-4 rounded-b-lg">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>Demo Accounts (click to fill):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs justify-start h-8"
                onClick={() => handleQuickLogin('admin@flowguard.local', 'Admin@123')}
              >
                👑 Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs justify-start h-8"
                onClick={() => handleQuickLogin('operator@flowguard.local', 'Operator@123')}
              >
                ⚙️ Operator
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs justify-start h-8"
                onClick={() => handleQuickLogin('reviewer@flowguard.local', 'Reviewer@123')}
              >
                🔍 Reviewer
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs justify-start h-8"
                onClick={() => handleQuickLogin('viewer@flowguard.local', 'Viewer@123')}
              >
                👁️ Viewer
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
