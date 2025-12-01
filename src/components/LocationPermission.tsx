import React, { useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../supabaseClient';

interface LocationPermissionProps {
  userId: string | null;
  onLocationGranted: (pincode?: string) => void;
}

export function LocationPermission({ userId, onLocationGranted }: LocationPermissionProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reverseGeocodeGetPincode(lat: number, lon: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const postcode =
        data?.address?.postcode ??
        data?.address?.postal_code ??
        data?.address?.post_code ??
        null;
      return typeof postcode === 'string' && postcode.trim() ? postcode.trim() : null;
    } catch (err) {
      console.error('Reverse geocode error', err);
      return null;
    }
  }

  async function updateProfilePincode(userId: string, pincode: string) {
    try {
      const { error } = await supabase.from('profiles').update({ pincode }).eq('id', userId);
      if (error) {
        console.error('Failed to update profile pincode:', error);
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('Unexpected updateProfilePincode error', e);
      return false;
    }
  }

  const handleRequestLocation = () => {
    setBusy(true);
    setStatus('Requesting location...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setStatus('Location granted!');

            localStorage.setItem('locationGranted', 'true');

            const fallbackPincode = '400001';
            localStorage.setItem('locationPincode', fallbackPincode);

            setBusy(false);
            onLocationGranted(fallbackPincode);
          } catch (e) {
            console.error('Location handler error', e);
            setStatus('Failed to read location');
            setBusy(false);
          }
        },
        (error) => {
          console.warn('Location denied/failed', error);
          setStatus('Location denied: ' + error.message);
          localStorage.setItem('locationGranted', 'false');
          setBusy(false);
          const fallbackPincode = '400001';
          onLocationGranted(fallbackPincode);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setStatus('Geolocation not supported');
      localStorage.setItem('locationGranted', 'false');
      setBusy(false);
      const fallbackPincode = '400001';
      onLocationGranted(fallbackPincode);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-3 sm:mx-4 shadow-lg">
        <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
          <div className="mx-auto mb-2 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <CardTitle className="text-center text-lg sm:text-2xl">Location Access</CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm">
            We need your location to show roads and landmarks in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-4">
            <Alert className="text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your location will be used to find nearby roads and help you report their condition
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleRequestLocation} 
              className="w-full h-8 sm:h-10 text-xs sm:text-base" 
              disabled={busy}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {busy ? 'Working...' : 'Share Location'}
            </Button>

            {status && (
              <div className={`text-center text-xs sm:text-sm font-medium ${
                status.startsWith('Location denied') || status.startsWith('Failed')
                  ? 'text-red-500'
                  : status.startsWith('Location granted') || status.startsWith('Location saved')
                  ? 'text-green-600'
                  : 'text-blue-600'
              }`}>
                {status}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
