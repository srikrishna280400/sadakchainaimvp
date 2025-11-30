// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient'; // <- ensure this path is correct

interface LoginFormProps {
  onLoginSuccess: (email?: string) => void;
  onSwitchToRegister: () => void;
}

type Message = { text: string; type: 'success' | 'error' } | null;

export function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const clearPassword = () => setPassword('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ text: 'Login Failed: Invalid email or password', type: 'error' });
      clearPassword();
      return;
    }

    setLoading(true);

    try {
      // Supabase login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data?.user) {
        // Fallback to localStorage (dev / offline)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);

        if (!user) {
          setMessage({ text: 'Login Failed: Invalid email or password', type: 'error' });
          clearPassword();
          setLoading(false);
          return;
        }

        // local fallback success
        localStorage.setItem('currentUser', email);
        setMessage({ text: 'Login Successful!', type: 'success' });
        clearPassword();
        onLoginSuccess(email);
        setLoading(false);
        return;
      }

      // Supabase login success path
      localStorage.setItem('currentUser', email);
      setMessage({ text: 'Login Successful!', type: 'success' });
      clearPassword();
      // call parent handler (App will pick session)
      onLoginSuccess(email);
    } catch (err: any) {
      console.error('Login error:', err);
      setMessage({ text: 'Login Failed: Unexpected error', type: 'error' });
      clearPassword();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">Enter your credentials to login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            {message && (
              <div
              className={`text-sm mt-2 ${
                message.type === 'error' ? 'text-red-500' : 'text-green-600'
              }`}
              >
                {message.text}
                </div>
              )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </Button>

            <div className="text-center text-sm">
              {"Don't have an account? "}
              <button type="button" onClick={onSwitchToRegister} className="text-blue-600 hover:underline">
                Register
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}