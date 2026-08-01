import { Info, AlertCircle } from 'lucide-react';
import { LeafletMapPicker } from './LeafletMapPicker';
import type { LocationFormData } from '../../hooks/useBranchForm';

interface LocationStepProps {
  locationData: LocationFormData;
  errors: Record<string, string>;
  onLocationChange: (updates: Partial<LocationFormData>) => void;
}

export function LocationStep({ locationData, errors, onLocationChange }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-ios border border-brand/30 bg-brand/10 flex items-center gap-3">
        <div className="p-2 rounded-full bg-brand/20 text-brand-hover shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <p className="text-sm text-ios-label">Search for the branch address or click on the map to pinpoint its exact location.</p>
      </div>

      <LeafletMapPicker
        initialPosition={
          locationData.latitude && locationData.longitude
            ? { lat: locationData.latitude, lng: locationData.longitude }
            : undefined
        }
        onLocationSelect={(data) =>
          onLocationChange({
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            postalCode: data.postalCode || '',
          })
        }
      />

      <div className="p-5 rounded-ios border border-ios-gray5 bg-ios-gray6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-ios-secondary-label">
              Confirmed Address
            </label>
            <input
              type="text"
              value={locationData.address}
              onChange={(e) => onLocationChange({ address: e.target.value })}
              placeholder="Address will be populated from the map…"
              className="w-full px-4 py-3 rounded-ios border border-ios-gray4 bg-white text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
              required
            />
            {errors.address && <p className="text-ios-red text-xs mt-1 font-medium">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-ios-secondary-label">Latitude</label>
            <input
              type="number"
              step="any"
              value={locationData.latitude || ''}
              readOnly
              className="w-full px-4 py-3 rounded-ios border border-ios-gray5 bg-ios-gray5/50 text-sm text-ios-gray"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-ios-secondary-label">Longitude</label>
            <input
              type="number"
              step="any"
              value={locationData.longitude || ''}
              readOnly
              className="w-full px-4 py-3 rounded-ios border border-ios-gray5 bg-ios-gray5/50 text-sm text-ios-gray"
            />
          </div>
        </div>

        {(locationData.city || locationData.state || locationData.country) && (
          <div className="mt-6 pt-6 border-t border-ios-gray5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {locationData.city && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-ios-gray">City</label>
                <p className="text-sm font-medium text-ios-label">{locationData.city}</p>
              </div>
            )}
            {locationData.state && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-ios-gray">State</label>
                <p className="text-sm font-medium text-ios-label">{locationData.state}</p>
              </div>
            )}
            {locationData.country && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-ios-gray">Country</label>
                <p className="text-sm font-medium text-ios-label">{locationData.country}</p>
              </div>
            )}
            {locationData.postalCode && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-ios-gray">Postcode</label>
                <p className="text-sm font-medium text-ios-label">{locationData.postalCode}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {errors.location && (
        <div className="p-3 rounded-ios bg-ios-red/10 border border-ios-red/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-ios-red shrink-0" />
          <p className="text-ios-red text-sm font-medium">{errors.location}</p>
        </div>
      )}
    </div>
  );
}
