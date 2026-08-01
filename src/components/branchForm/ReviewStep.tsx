import type { BranchFormData, LocationFormData, OperatingHours } from '../../hooks/useBranchForm';
import type { User } from '../../types';

interface ReviewStepProps {
  formData: BranchFormData;
  locationData: LocationFormData;
  operatingHours: OperatingHours;
  managers: User[];
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-ios-secondary-label">{label}:</span>{' '}
      <span className="text-ios-label">{value}</span>
    </p>
  );
}

export function ReviewStep({ formData, locationData, operatingHours, managers }: ReviewStepProps) {
  const managerName = managers.find((m) => m._id === formData.manager_id)?.name;
  const sectionCls = 'p-4 rounded-ios bg-ios-gray6';
  const headingCls = 'font-semibold mb-3 text-ios-label';

  return (
    <div className="space-y-6">
      <div className={sectionCls}>
        <h3 className={headingCls}>Basic Information</h3>
        <div className="space-y-2 text-sm">
          <ReviewField label="Name" value={formData.name} />
          <ReviewField label="Manager" value={managerName || '-'} />
          {formData.phoneNumber && <ReviewField label="Phone" value={formData.phoneNumber} />}
          {formData.branchEmailAddress && <ReviewField label="Email" value={formData.branchEmailAddress} />}
          <p>
            <span className="text-ios-secondary-label">Status:</span>{' '}
            <span className="capitalize text-ios-label">{formData.status.replace('_', ' ')}</span>
          </p>
          <ReviewField label="Main Branch" value={formData.isMainBranch ? 'Yes' : 'No'} />
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className={headingCls}>Location</h3>
        <div className="space-y-2 text-sm">
          <ReviewField label="Address" value={locationData.address} />
          {locationData.city && <ReviewField label="City" value={locationData.city} />}
          {locationData.state && <ReviewField label="State" value={locationData.state} />}
          {locationData.country && <ReviewField label="Country" value={locationData.country} />}
          <ReviewField label="Coordinates" value={`${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`} />
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className={headingCls}>Operating Hours</h3>
        <div className="space-y-1 text-sm">
          {Object.entries(operatingHours).map(([day, hours]) => (
            <p key={day} className="text-ios-secondary-label">
              <span className="capitalize font-medium text-ios-label">{day}:</span>{' '}
              {hours.isClosed ? 'Closed' : hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Not set'}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
