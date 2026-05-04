import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoaderCircleIcon } from 'lucide-react';
const loginSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email required'),
  password: z.string().min(6, 'Password too short').max(100),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await authLogin(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials or server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card/50 to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl card-glass border-0">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-orange shadow-custom mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">🚚</span>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Wolan Logistics Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@gmail.com"
                {...form.register('email')}
                className="h-12"
              />
              {form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                {...form.register('password')}
                className="h-12"
              />
              {form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-orange hover:gradient-orange/90 shadow-custom text-primary-foreground font-semibold" disabled={isLoading}>
              {isLoading ? <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground py-2">
            Demo: admin@gmail.com / password123 (create in backend if needed)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

