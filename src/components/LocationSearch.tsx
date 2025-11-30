import React, { useRef, useState, useEffect } from 'react';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface LocationSearchProps {
  userId: string | null;
  onConfirmLocation: (location: string, pincode: string) => void;
}

export function LocationSearch({ userId, onConfirmLocation }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <p className="text-red-500 text-lg">You must be logged in to access this feature.</p>
      </div>
    );
  }

  if (!GEOAPIFY_API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Geoapify API key is missing. Please add VITE_GEOAPIFY_API_KEY to your .env.local file.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchLocations = async (query: string) => {
    if (!query || query.length < 3) {
      setLocations([]);
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Geoapify Geocoding API - bias towards India
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        query
      )}&filter=countrycode:in&limit=10&apiKey=${GEOAPIFY_API_KEY}`;

      const res = await fetch(url, { 
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (res.status === 403) {
          setError('Invalid API key. Please check your Geoapify configuration.');
        } else {
          setError('Failed to fetch locations. Please try again.');
        }
        setLocations([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const results = data.features || [];
      setLocations(results);
      
      if (results.length === 0) {
        setError('No locations found. Try a different search term.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
        setError('Network error. Please check your connection and try again.');
      }
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(!!value);
    setSelectedLocation(null);
    setMessage('');
    setError('');

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only search if 3+ characters
    if (value.length >= 3) {
      // Debounce: wait 500ms after user stops typing
      debounceRef.current = setTimeout(() => {
        fetchLocations(value);
      }, 500);
    } else {
      setLocations([]);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  const handleSelectLocation = (loc: any) => {
    const displayName = loc.properties?.formatted || loc.properties?.name || 'Unknown location';
    setSearchTerm(displayName);
    setShowDropdown(false);
    setSelectedLocation(loc);
    setMessage('');
    setError('');
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      setMessage("No location selected!");
      return;
    }
    
    const props = selectedLocation.properties;
    const displayName = props?.formatted || props?.name || 'Unknown location';
    const pincode = props?.postcode || '';

    // Persist selected location
    const payload = {
      location: displayName,
      pincode: pincode || '',
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('selectedLocation', JSON.stringify(payload));
    localStorage.setItem('locationGranted', 'true');
    localStorage.setItem('locationPincode', pincode || '');

    // Inform parent to move to report screen
    onConfirmLocation(payload.location, payload.pincode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>
              Search for any road, street, or place in India (type at least 3 characters)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="e.g., Dadar, Mumbai or MG Road, Bangalore..."
                value={searchTerm}
                onChange={handleChange}
                onFocus={() => setShowDropdown(true)}
                className="pl-10"
                autoComplete="off"
              />
              {searchTerm.length > 0 && searchTerm.length < 3 && (
                <div className="text-xs text-gray-500 mt-1">
                  Type at least 3 characters to search
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {showDropdown && searchTerm.length >= 3 && (
              <Card className="shadow-lg">
                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {loading && (
                      <div className="text-center text-gray-500 p-4">
                        Searching locations...
                      </div>
                    )}
                    {!loading && locations.length === 0 && !error && (
                      <div className="p-4 text-center text-gray-500">
                        No locations found. Try a different search.
                      </div>
                    )}
                    {!loading &&
                      locations.map((loc: any, index: number) => {
                        const props = loc.properties || {};
                        const displayName = props.formatted || props.name || 'Unknown';
                        const placeId = props.place_id || `${loc.geometry?.coordinates?.join('-')}-${index}`;
                        
                        return (
                          <button
                            key={placeId}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full flex items-start gap-3 p-3 hover:bg-gray-100 rounded-md transition-colors text-left"
                          >
                            <div className="mt-0.5">
                              <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 text-sm">{displayName}</div>
                          </button>
                        );
                      })}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {selectedLocation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800 font-medium">
                  Selected Location:
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {selectedLocation.properties?.formatted || selectedLocation.properties?.name || 'Unknown location'}
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              disabled={!selectedLocation} 
              onClick={handleConfirmLocation}
            >
              Confirm Location
            </Button>

            {message && (
              <div className="text-center text-sm text-blue-600 font-medium py-2">
                {message}
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              Powered by Geoapify
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}