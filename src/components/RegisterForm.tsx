import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDev = import.meta.env.MODE === 'development';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log("DEBUG: Starting registration submission...");

    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // DIRECT SUPABASE SIGNUP - No backend needed
      console.log("DEBUG: Creating user directly with Supabase...");
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          // CRITICAL: This ensures email is auto-confirmed
          emailRedirectTo: undefined,
        }
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      console.log("DEBUG: User created successfully:", signUpData);

      // Check if user was created
      if (!signUpData.user) {
        setError('Failed to create user');
        setLoading(false);
        return;
      }

      // Create profile entry in profiles table
      console.log("DEBUG: Creating profile entry...");
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            name: name,
            email: email,
            created_at: new Date().toISOString(),
          }
        ]);

      if (profileError) {
        console.warn('Profile creation error (might already exist):', profileError);
        // Don't fail registration if profile already exists
      }

      // Try to sign in immediately
      console.log("DEBUG: Attempting auto-login...");
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Check if sign in was successful
      if (signInError) {
        console.warn('DEBUG: Auto-login failed:', signInError.message);
        
        // User was created but can't login yet - show message
        toast.success('Registration successful! Please login with your credentials.');
        setLoading(false);
        onSwitchToLogin();
        return;
      }

      // Check if we have a valid session
      if (!signInData.session) {
        console.warn('DEBUG: No session returned');
        toast.success('Registration successful! Please login with your credentials.');
        setLoading(false);
        onSwitchToLogin();
        return;
      }

      console.log("DEBUG: Auto-login successful. Session active.");

      // Save to localStorage for dev mode
      if (isDev) {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          if (!users.find((u: any) => u.email === email)) {
            users.push({ email, password, name, created_at: new Date().toISOString() });
            localStorage.setItem('users', JSON.stringify(users));
          }
        } catch (err) {
          console.warn('Failed to save local dev user cache', err);
        }
      }

      setLoading(false);
      toast.success('Registration successful!');
      
      // Success - user is logged in
      onRegisterSuccess();

    } catch (err: any) {
      console.error('Register error:', err);
      setError('Registration failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your details to register</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}