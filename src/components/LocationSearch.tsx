import React, { useRef, useState, useEffect } from 'react';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';

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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  if (!userId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-3 sm:mx-4 shadow-lg">
          <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
            <CardTitle className="text-center text-lg sm:text-2xl text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-xs sm:text-sm text-gray-700">
              You must be logged in to access this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!GEOAPIFY_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-3 sm:mx-4 shadow-lg">
          <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
            <CardTitle className="text-center text-lg sm:text-2xl text-red-600">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-xs sm:text-sm text-gray-700">
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
    
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchLocations(value);
      }, 500);
    } else {
      setLocations([]);
    }
  };

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

    const payload = {
      location: displayName,
      pincode: pincode || '',
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('selectedLocation', JSON.stringify(payload));
    localStorage.setItem('locationGranted', 'true');
    localStorage.setItem('locationPincode', pincode || '');

    onConfirmLocation(payload.location, payload.pincode);
  };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-y-auto py-4">
      <Card className="w-full max-w-md mx-3 sm:mx-4 shadow-lg my-auto">
        <CardHeader className="space-y-0.5 pb-3 sm:pb-4">
          <CardTitle className="text-center text-lg sm:text-2xl">Select Location</CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm">
            Search for any road, street, or place in India
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="location-search" className="text-xs sm:text-sm">Search Location</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> {/* FIX APPLIED */}
                <Input
                  id="location-search"
                  type="text"
                  placeholder="e.g., Dadar, Mumbai..."
                  value={searchTerm}
                  onChange={handleChange}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  autoComplete="off"
                />
              </div>
              {searchTerm.length > 0 && searchTerm.length < 3 && (
                <div className="text-xs text-gray-500">
                  Type at least 3 characters to search
                </div>
              )}
            </div>

            {error && (
              <div className="text-xs sm:text-sm p-2 sm:p-3 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showDropdown && searchTerm.length >= 3 && (
              <Card className="shadow-lg">
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="p-2">
                    {loading && (
                      <div className="text-center text-gray-500 p-4 text-xs sm:text-sm">
                        Searching locations...
                      </div>
                    )}
                    {!loading && locations.length === 0 && !error && (
                      <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">
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
                            <div className="flex-1 text-xs sm:text-sm">{displayName}</div>
                          </button>
                        );
                      })}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {selectedLocation && (
              <div className="text-xs sm:text-sm p-2 sm:p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
                <div className="font-medium">Selected Location:</div>
                <div className="mt-1">
                  {selectedLocation.properties?.formatted || selectedLocation.properties?.name || 'Unknown location'}
                </div>
              </div>
            )}

            <Button 
              className="w-full h-8 sm:h-10 text-xs sm:text-base" 
              disabled={!selectedLocation} 
              onClick={handleConfirmLocation}
            >
              Confirm Location
            </Button>

            {message && (
              <div className="text-center text-xs sm:text-sm text-blue-600 font-medium">
                {message}
              </div>
            )}

            <div className="text-xs text-gray-500 text-center pt-1">
              Powered by Geoapify
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}