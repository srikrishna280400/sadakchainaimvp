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

export default function App()  {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ location: string; pincode: string } | null>(null);
  // add near other handlers in App()
  const handleEditLocation = () => {
  // If you want to clear previous selection so user starts fresh:
  setSelectedLocation(null);
  localStorage.removeItem('locationPincode'); // optional: clear stored pincode if you want them to re-grant/select
  // navigate to the Location Search screen
  setScreen('locationSearch');
};

  useEffect(() => {
    let mounted = true;

    async function restoreFromStorageAndSession() {
      try {
        // fetch session
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        const currentUser = session?.user ?? null;

        // read persisted progress
        const locationGranted = localStorage.getItem('locationGranted') === 'true';
        const storedLocationRaw = localStorage.getItem('selectedLocation');

        if (mounted && currentUser) {
          setUser(currentUser);
          setUserId(currentUser.id ?? null);

          // restore most advanced screen
          if (locationGranted) {
            if (storedLocationRaw) {
              try {
                const parsed = JSON.parse(storedLocationRaw);
                setSelectedLocation(parsed);
                setScreen('report');
              } catch {
                setScreen('locationSearch');
              }
            } else {
              setScreen('locationSearch');
            }
          } else {
            setScreen('locationPermission');
          }
        } else if (mounted && !currentUser) {
          setUser(null);
          setUserId(null);
          setScreen('login');
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      }
    }

    restoreFromStorageAndSession();

const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
  const currentUser = session?.user ?? null;

  // read persisted progress
  const locationGranted = localStorage.getItem('locationGranted') === 'true';
  const storedLocationRaw = localStorage.getItem('selectedLocation');

  if (!currentUser) {
    // user signed out
    setUser(null);
    setUserId(null);
    setScreen('login');
    return;
  }

  // user signed in or session ready
  setUser(currentUser);
  setUserId(currentUser.id ?? null);

  // If we have a fully saved selectedLocation -> go straight to report
  if (locationGranted && storedLocationRaw) {
    try {
      const parsed = JSON.parse(storedLocationRaw);
      if (parsed && parsed.location) {
        setSelectedLocation(parsed);
        setScreen('report');
        return;
      }
    } catch {
      // parsing failed -> fall through
    }
    // if parsed fail, send user to locationSearch to re-confirm
    setScreen('locationSearch');
    return;
  }

  // If user previously granted location but hasn't selected a location yet -> locationSearch
  if (locationGranted && !storedLocationRaw) {
    setScreen('locationSearch');
    return;
  }

  // Default for a logged in user who hasn't granted location yet:
  // only show locationPermission if they were on login/register before;
  // otherwise keep current screen (prevents overwriting)
  setScreen(prev => (prev === 'login' || prev === 'register') ? 'locationPermission' : prev);
});

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Called by RegisterForm after successful register -> show login
  const handleRegisterSuccess = () => setScreen('login');

  // Called by LoginForm when login succeeds
  const handleLoginSuccess = async (email?: string) => {
    // allow Supabase session to stabilize (race conditions)
    const maxAttempts = 6;
    const delayMs = 250;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.id ?? null);
        // send to locationPermission by default; restore logic will promote further if persisted
        setScreen('locationPermission');
        return;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }
    // fallback: still go to locationPermission (you can change to show an error)
    setScreen('locationPermission');
  };

  const handleSwitchToRegister = () => setScreen('register');
  const handleSwitchToLogin = () => setScreen('login');

  // allow LocationPermission to receive userId so it can persist pincode to profile
  const handleLocationGranted = (pincode?: string) => {
    // mark persisted flag already set by LocationPermission; just advance
    setScreen('locationSearch');
    if (pincode) {
      // optionally set selectedLocation.pincode if exists
      const cur = selectedLocation ? { ...selectedLocation, pincode } : null;
      if (cur) {
        localStorage.setItem('selectedLocation', JSON.stringify(cur));
        setSelectedLocation(cur);
      }
    }
  };

  const handleConfirmLocation = (location: string, pincode: string) => {
    const selected = { location, pincode };
    localStorage.setItem('selectedLocation', JSON.stringify(selected));
    localStorage.setItem('locationGranted', 'true');
    localStorage.setItem('locationPincode', pincode || '');
    setSelectedLocation(selected);
    setScreen('report');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // clear persisted location progress on logout so new user starts fresh
      localStorage.removeItem('locationGranted');
      localStorage.removeItem('locationPincode');
      localStorage.removeItem('selectedLocation');

      setUser(null);
      setUserId(null);
      setSelectedLocation(null);
      setScreen('login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden" data-screen={screen}>
      <div className="w-full h-[6px] bg-blue-600" />
<div className={`flex-1 flex w-full h-full ${screen === 'report' ? '' : 'items-center justify-center'}`}>
<div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl border border-blue-300 w-full max-w-6xl mx-2 md:mx-8 lg:mx-12 min-h-[400px] h-full flex flex-col overflow-hidden ${screen === 'report' ? 'my-0' : 'my-12'}`}>
    <header className="w-full border-b border-blue-400 px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 flex items-center justify-between gap-2 flex-shrink-0 min-h-[60px] overflow-hidden">
  <div className="font-bold text-sm sm:text-base md:text-xl truncate min-w-0 flex-shrink">
    SadakChainAI — Pilot (MVP)
  </div>
  <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 sm:gap-3 flex-shrink-0">
    {user ? (
      <>
        <div className="hidden md:block truncate max-w-[150px] lg:max-w-[200px]">
          {user.email ?? userId}
        </div>
<button
onClick={handleLogout}
className="text-sm sm:text-base md:text-xl px-4 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap bg-gray-800 text-white hover:bg-gray-900 border border-gray-800">
Logout
</button>
      </>
    ) : (
<div className="text-sm sm:text-base md:text-xl whitespace-nowrap">Not Signed In</div>
    )}
  </div>
</header>

<main className={`w-full flex-1 flex flex-col h-full min-h-0 ${screen === 'report' ? 'p-0' : 'items-center justify-center px-8 py-10'}`}>
        {screen === 'register' && (
              <RegisterForm onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={handleSwitchToLogin} />
            )}

            {screen === 'login' && (
              <LoginForm onLoginSuccess={handleLoginSuccess} onSwitchToRegister={handleSwitchToRegister} />
            )}

            {screen === 'locationPermission' && (
              <LocationPermission userId={userId} onLocationGranted={handleLocationGranted} />
            )}

            {screen === 'locationSearch' && (
              <LocationSearch userId={userId} onConfirmLocation={handleConfirmLocation} />
            )}

{screen === 'report' && selectedLocation && (
  <ReportScreen
    location={selectedLocation.location}
    pincode={selectedLocation.pincode}
    userId={userId}
    onLogout={handleLogout}
    onEditLocation={handleEditLocation}
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