import { useState } from 'react';

export interface BranchFormData {
  name: string;
  manager_id: string;
  phoneNumber: string;
  branchEmailAddress: string;
  status: 'active' | 'inactive' | 'temporarily_closed';
  isMainBranch: boolean;
  branchCoverImage: File | null;
}

export interface LocationFormData {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface OperatingHours {
  [day: string]: DayHours;
}

const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: '09:00', close: '17:00' },
  tuesday: { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '17:00' },
  saturday: { open: '10:00', close: '14:00' },
  sunday: { open: '10:00', close: '14:00' },
};

export function useBranchForm() {
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    manager_id: '',
    phoneNumber: '',
    branchEmailAddress: '',
    status: 'active',
    isMainBranch: false,
    branchCoverImage: null,
  });

  const [locationData, setLocationData] = useState<LocationFormData>({
    address: '',
    latitude: 0,
    longitude: 0,
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [operatingHours, setOperatingHours] = useState<OperatingHours>(DEFAULT_OPERATING_HOURS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (updates: Partial<BranchFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateLocationData = (updates: Partial<LocationFormData>) => {
    setLocationData((prev) => ({ ...prev, ...updates }));
  };

  const updateOperatingHours = (day: string, field: 'open' | 'close', value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const toggleDayClosed = (day: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isClosed: !prev[day].isClosed },
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Branch name is required';
      if (!formData.manager_id) newErrors.manager_id = 'A manager must be assigned to this branch';
      if (!formData.branchCoverImage) newErrors.branchCoverImage = 'Branch cover image is required';
    } else if (step === 2) {
      if (!locationData.address.trim()) newErrors.address = 'Address is required';
      if (!locationData.latitude || !locationData.longitude) {
        newErrors.location = 'Pick a location on the map or search for an address';
      } else if (locationData.latitude < -90 || locationData.latitude > 90) {
        newErrors.location = 'Latitude must be between -90 and 90';
      } else if (locationData.longitude < -180 || locationData.longitude > 180) {
        newErrors.location = 'Longitude must be between -180 and 180';
      }
    } else if (step === 3) {
      Object.entries(operatingHours).forEach(([day, hours]) => {
        if (!hours.isClosed && (!hours.open || !hours.close)) {
          newErrors[`hours_${day}`] = `${day} operating hours are required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    locationData,
    operatingHours,
    errors,
    updateFormData,
    updateLocationData,
    updateOperatingHours,
    toggleDayClosed,
    validateStep,
  };
}
