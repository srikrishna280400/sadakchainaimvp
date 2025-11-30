import React, { useEffect, useState } from 'react';
import { RegisterForm } from './components/RegisterForm';
import { LoginForm } from './components/LoginForm';
import { LocationPermission } from './components/LocationPermission';
import { LocationSearch } from './components/LocationSearch';
import { ReportScreen } from './components/ReportScreen';
import { Toaster } from './components/ui/sonner';
import { supabase } from './supabaseClient';

type Screen =
  | 'register'
  | 'login'
  | 'locationPermission'
  | 'locationSearch'
  | 'report';

export default function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ location: string; pincode: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        const currentUser = session?.user ?? null;
        if (mounted && currentUser) {
          setUser(currentUser);
          setUserId(currentUser.id ?? null);
          setScreen('locationPermission');
        } else if (mounted && !currentUser) {
          setUser(null);
          setUserId(null);
          setScreen('login');
        }
      } catch (err) {
        console.error('Error loading session:', err);
      }
    }
    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.id ?? null);
        setScreen((prev) => (prev === 'login' || prev === 'register' ? 'locationPermission' : prev));
      } else {
        setUser(null);
        setUserId(null);
        setScreen('login');
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleRegisterSuccess = () => setScreen('login');
  const handleLoginSuccess = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.id ?? null);
        setScreen('locationPermission');
      } else {
        setUser(null);
        setUserId(null);
        setScreen('login');
      }
    } catch (err) {
      console.error('login success handler error', err);
      setScreen('login');
    }
  };

  const handleSwitchToRegister = () => setScreen('register');
  const handleSwitchToLogin = () => setScreen('login');
  const handleLocationGranted = () => setScreen('locationSearch');
  const handleLocationSelected = (location: string, pincode: string) => {
    setSelectedLocation({ location, pincode });
    setScreen('report');
  };
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserId(null);
      setScreen('login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    // Flush top/bottom blue bars, wide center, tiny side gaps
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-100 to-indigo-100">
      <div className="w-full h-[6px] bg-blue-600" />
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-300 w-full max-w-6xl mx-2 md:mx-8 lg:mx-12 my-12 min-h-[400px] flex flex-col justify-center items-center">
          <header className="w-full border-b border-blue-400 px-8 py-6 flex items-center justify-between">
            <div className="font-bold text-xl">RoadReports (MVP)</div>
            <div className="text-sm text-gray-600 flex items-center gap-4">
              {user ? (
                <>
                  <div className="truncate max-w-sm">Signed in: {user.email ?? userId}</div>
                  <button
                    onClick={handleLogout}
                    className="text-sm px-4 py-2 bg-red-50 border rounded hover:bg-red-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div>Not signed in</div>
              )}
            </div>
          </header>
          <main className="w-full flex-1 flex flex-col items-center justify-center px-8 py-10">
            {screen === 'register' && (
              <RegisterForm
                onRegisterSuccess={handleRegisterSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
            {screen === 'login' && (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={handleSwitchToRegister}
              />
            )}
            {screen === 'locationPermission' && (
              <LocationPermission onLocationGranted={handleLocationGranted} />
            )}
            {screen === 'locationSearch' && (
              <LocationSearch userId={userId} onLocationSelect={handleLocationSelected} />
            )}
            {screen === 'report' && selectedLocation && (
              <ReportScreen
                location={selectedLocation.location}
                pincode={selectedLocation.pincode}
                userId={userId}
                onLogout={handleLogout}
              />
            )}
          </main>
        </div>
      </div>
      <div className="w-full h-[6px] bg-blue-600" />
      <Toaster />
    </div>
  );
}
