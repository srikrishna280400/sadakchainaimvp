// src/components/LoginForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';

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

  useEffect(() => {
    document.body.classList.add('auth-screen');
    return () => document.body.classList.remove('auth-screen');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ text: 'Please enter both email and password', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Attempt Supabase login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Check for specific error cases
      if (signInError) {
        console.error('Supabase sign-in error:', signInError);

        // Check if it's an email confirmation issue
        if (signInError.message.toLowerCase().includes('email not confirmed') ||
            signInError.message.toLowerCase().includes('confirm your email')) {
          setMessage({ 
            text: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.', 
            type: 'error' 
          });
          clearPassword();
          setLoading(false);
          return;
        }

        // Generic authentication error
        setMessage({ text: 'Invalid email or password', type: 'error' });
        clearPassword();
        setLoading(false);
        return;
      }

      // Check if session exists
      if (!data?.session || !data?.user) {
        console.warn('No session returned from Supabase');
        
        // Try localStorage fallback for development
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);

        if (!user) {
          setMessage({ text: 'Invalid email or password', type: 'error' });
          clearPassword();
          setLoading(false);
          return;
        }

        // Local fallback success
        localStorage.setItem('currentUser', email);
        setMessage({ text: 'Login Successful!', type: 'success' });
        clearPassword();
        onLoginSuccess(email);
        setLoading(false);
        return;
      }

      // Successful Supabase login
      console.log('Login successful:', data.user.email);
      localStorage.setItem('currentUser', email);
      setMessage({ text: 'Login Successful!', type: 'success' });
      clearPassword();
      onLoginSuccess(email);

    } catch (err: any) {
      console.error('Login error:', err);
      setMessage({ text: 'Login failed. Please try again.', type: 'error' });
      clearPassword();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden p-0 m-0">
      <Card className="w-full max-w-md mx-3 sm:mx-4 shadow-lg">
        <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
          <CardTitle className="text-center text-lg sm:text-2xl">Welcome Back!</CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm">Enter Your Credentials to Login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <div className="relative">
<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> {/* FIX APPLIED */}
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <div className="relative">
<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> {/* FIX APPLIED */}
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            {message && (
              <div
                className={`text-xs sm:text-sm p-2 sm:p-3 rounded-md ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full h-8 sm:h-10 text-xs sm:text-base" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </Button>

            <div className="text-center text-xs sm:text-sm pt-1">
              {"Don't have an account? "}
              <button 
                type="button" 
                onClick={onSwitchToRegister} 
                className="text-blue-600 hover:underline"
              >
                Register
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}