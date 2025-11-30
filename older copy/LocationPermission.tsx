import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface LocationPermissionProps {
  onLocationGranted: (pincode: string) => void;
}

export function LocationPermission({ onLocationGranted }: LocationPermissionProps) {
  const handleRequestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would reverse geocode to get pincode
          // For now, we'll simulate with a mock pincode
          const mockPincode = '400001'; // Mock Mumbai pincode
          onLocationGranted(mockPincode);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Even on error, let's proceed with a mock pincode
          const mockPincode = '400001';
          onLocationGranted(mockPincode);
        }
      );
    } else {
      // Geolocation not supported, use mock
      const mockPincode = '400001';
      onLocationGranted(mockPincode);
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
          <CardDescription>
            We need your location to show roads and landmarks in your area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your location will be used to find nearby roads and help you report their condition
            </AlertDescription>
          </Alert>

          <Button onClick={handleRequestLocation} className="w-full">
            <MapPin className="mr-2 h-4 w-4" />
            Share Location
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
