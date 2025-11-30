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

 // LocationPermission: replace existing handleRequestLocation
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

          // Optionally reverse-geocode here (or LocationSearch will confirm)
          // We'll persist that the user granted permission:
          localStorage.setItem('locationGranted', 'true');

          // If you can compute pincode here, persist it; otherwise leave for LocationSearch
          const fallbackPincode = '400001';
          localStorage.setItem('locationPincode', fallbackPincode);

          // small delay to show status
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
        // do NOT set locationGranted=true on denial — set false or leave unset
        localStorage.setItem('locationGranted', 'false');
        setBusy(false);
        // You may want to send a fallback pincode so flow continues:
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Location Access</CardTitle>
          <CardDescription>We need your location to show roads and landmarks in your area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your location will be used to find nearby roads and help you report their condition
            </AlertDescription>
          </Alert>

          <div>
            <Button onClick={handleRequestLocation} className="w-full" disabled={busy}>
              <MapPin className="mr-2 h-4 w-4" />
              {busy ? 'Working...' : 'Share Location'}
            </Button>
          </div>

          {status && (
            <div
              style={{
                marginTop: 12,
                textAlign: 'center',
                fontWeight: 500,
                color:
                  status.startsWith('Location denied') || status.startsWith('Failed') ? 'red' :
                  status.startsWith('Location granted') || status.startsWith('Location saved') ? 'green' :
                  'blue'
              }}
            >
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}