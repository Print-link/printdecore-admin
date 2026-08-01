import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, Navigation, MapPin } from 'lucide-react';
import { iosInputCls } from '../ui/FormField';

// Fix for default marker icon under bundlers that don't resolve Leaflet's relative asset paths.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.setView(center, map.getZoom());
      // Force a resize so tiles render correctly when the map mounts inside a hidden/animated container.
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [map, center]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick });
  return null;
}

interface LeafletMapPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }) => void;
}

export function LeafletMapPicker({ initialPosition, onLocationSelect }: LeafletMapPickerProps) {
  const defaultCenter: [number, number] = [5.6037, -0.187]; // Accra, Ghana
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : defaultCenter
  );
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : null
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      const pos: [number, number] = [initialPosition.lat, initialPosition.lng];
      setMarkerPosition(pos);
      setMapCenter(pos);
    }
  }, [initialPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const pos: [number, number] = [lat, lng];

    setMarkerPosition(pos);
    setMapCenter(pos);
    setSearchQuery(result.display_name);
    setShowSearchResults(false);

    const addr = result.address || {};
    onLocationSelect({
      address: result.display_name,
      latitude: lat,
      longitude: lng,
      city: addr.city || addr.town || addr.village || addr.suburb || '',
      state: addr.state || '',
      country: addr.country || '',
      postalCode: addr.postcode || '',
    });
  };

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    const pos: [number, number] = [lat, lng];
    setMarkerPosition(pos);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const addr = data.address || {};
      onLocationSelect({
        address: data.display_name,
        latitude: lat,
        longitude: lng,
        city: addr.city || addr.town || addr.village || addr.suburb || '',
        state: addr.state || '',
        country: addr.country || '',
        postalCode: addr.postcode || '',
      });
      setSearchQuery(data.display_name);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationSelect({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pos: [number, number] = [latitude, longitude];
        setMapCenter(pos);
        setMarkerPosition(pos);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          const addr = data.address || {};
          onLocationSelect({
            address: data.display_name,
            latitude,
            longitude,
            city: addr.city || addr.town || addr.village || addr.suburb || '',
            state: addr.state || '',
            country: addr.country || '',
            postalCode: addr.postcode || '',
          });
          setSearchQuery(data.display_name);
        } catch {
          onLocationSelect({
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            latitude,
            longitude,
          });
        }
      },
      (error) => console.error('Geolocation error:', error)
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={searchContainerRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-gray w-4 h-4" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              placeholder="Search for the branch location…"
              className={`${iosInputCls} pl-9`}
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-hover w-4 h-4 animate-spin" />}
          </div>
          <button
            type="button"
            onClick={() => handleSearch(searchQuery)}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-ios-label rounded-ios font-semibold text-sm transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="p-2.5 rounded-ios border border-ios-gray5 bg-ios-gray6 text-brand-hover hover:bg-ios-gray5"
            title="Use current location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {showSearchResults && searchResults.length > 0 && (
          <ul className="absolute z-[1000] w-full mt-2 border border-ios-gray5 rounded-ios shadow-ios overflow-hidden bg-white">
            {searchResults.map((result) => (
              <li
                key={result.place_id}
                onClick={() => handleSelectResult(result)}
                className="px-4 py-3 cursor-pointer text-sm text-ios-label hover:bg-ios-gray6 border-b border-ios-gray5 last:border-0"
              >
                {result.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full h-[400px] rounded-ios overflow-hidden border border-ios-gray5 relative z-0">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} />
          <MapClickHandler onClick={handleMapClick} />
          {markerPosition && <Marker position={markerPosition} />}
        </MapContainer>
      </div>

      <p className="text-xs flex items-center gap-1.5 text-ios-gray">
        <MapPin className="w-3 h-3" />
        Tip: click anywhere on the map to set the exact location
      </p>
    </div>
  );
}
