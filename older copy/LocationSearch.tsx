import { useState } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface LocationSearchProps {
  pincode: string;
  onLocationSelect: (location: string) => void;
}

// Mock location data based on pincode
const getLocationsForPincode = (pincode: string) => {
  const locations = [
    { id: 1, name: 'MG Road', type: 'Road' },
    { id: 2, name: 'Brigade Road', type: 'Road' },
    { id: 3, name: 'Church Street', type: 'Street' },
    { id: 4, name: 'Commercial Street', type: 'Street' },
    { id: 5, name: 'Richmond Road', type: 'Road' },
    { id: 6, name: 'Residency Road', type: 'Road' },
    { id: 7, name: 'St. Marks Road', type: 'Road' },
    { id: 8, name: 'Vittal Mallya Road', type: 'Road' },
    { id: 9, name: 'Lavelle Road', type: 'Road' },
    { id: 10, name: 'Cunningham Road', type: 'Road' },
    { id: 11, name: 'Kasturba Road', type: 'Road' },
    { id: 12, name: 'Museum Road', type: 'Road' },
    { id: 13, name: 'Cubbon Park Area', type: 'Landmark' },
    { id: 14, name: 'Trinity Circle', type: 'Landmark' },
    { id: 15, name: 'Garuda Mall Junction', type: 'Landmark' },
  ];
  return locations;
};

export function LocationSearch({ pincode, onLocationSelect }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const locations = getLocationsForPincode(pincode);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectLocation = (location: string) => {
    setSearchTerm(location);
    setShowDropdown(false);
    onLocationSelect(location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>
              Search for a road, street, or landmark in pincode {pincode}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for roads, streets, landmarks..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-10"
              />
            </div>

            {showDropdown && filteredLocations.length > 0 && (
              <Card className="shadow-lg">
                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {filteredLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleSelectLocation(location.name)}
                        className="w-full flex items-start gap-3 p-3 hover:bg-gray-100 rounded-md transition-colors text-left"
                      >
                        <div className="mt-0.5">
                          {location.type === 'Landmark' ? (
                            <Navigation className="h-5 w-5 text-blue-600" />
                          ) : (
                            <MapPin className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div>{location.name}</div>
                          <div className="text-sm text-gray-500">{location.type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {showDropdown && filteredLocations.length === 0 && searchTerm && (
              <Card className="p-4 text-center text-gray-500">
                No locations found
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
