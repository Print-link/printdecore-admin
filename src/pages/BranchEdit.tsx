import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { branchService, locationService, managerService } from '../services/superAdminService';
import { useBranchForm } from '../hooks/useBranchForm';
import { useBranchImage } from '../hooks/useBranchImage';
import { BranchFormHeader } from '../components/branchForm/BranchFormHeader';
import { BranchFormStepper, type Step } from '../components/branchForm/BranchFormStepper';
import { BranchFormNavigation } from '../components/branchForm/BranchFormNavigation';
import { BasicInfoStep } from '../components/branchForm/BasicInfoStep';
import { LocationStep } from '../components/branchForm/LocationStep';
import { OperatingHoursStep } from '../components/branchForm/OperatingHoursStep';
import { ReviewStep } from '../components/branchForm/ReviewStep';
import type { BranchDetailResponse, Manager } from '../types';

const STEPS: Step[] = [
  { id: 1, title: 'Basic Information', description: 'Branch name and contact details' },
  { id: 2, title: 'Location', description: 'Address and coordinates' },
  { id: 3, title: 'Operating Hours', description: 'Set working hours for each day' },
  { id: 4, title: 'Review', description: 'Review and confirm changes' },
];

export const BranchEdit = () => {
  const { id } = useParams<{ id: string }>();
  const branchId = id!;

  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => branchService.getById(branchId),
  });

  const { data: managersData } = useQuery({
    queryKey: ['managers'],
    queryFn: () => managerService.getAll({ limit: 100 }),
  });
  const managers = managersData?.managers || [];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {isLoading || !branch ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <BranchEditForm branchId={branchId} branch={branch} managers={managers} />
        )}
      </div>
    </Layout>
  );
};

// Mounted only once branch data has loaded, so useBranchForm/useBranchImage seed correctly on first render.
function BranchEditForm({
  branchId,
  branch,
  managers,
}: {
  branchId: string;
  branch: BranchDetailResponse;
  managers: Manager[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const {
    formData,
    locationData,
    operatingHours,
    errors,
    updateFormData,
    updateLocationData,
    updateOperatingHours,
    toggleDayClosed,
    validateStep,
  } = useBranchForm({
    formData: {
      name: branch.name,
      manager_id: branch.manager_id || '',
      phoneNumber: branch.phoneNumber || '',
      branchEmailAddress: branch.email || '',
      status: (branch.status as 'active' | 'inactive' | 'temporarily_closed') || 'active',
      isMainBranch: !!branch.isMainBranch,
      payStackSubAccountId: branch.payStackSubAccountId || '',
    },
    locationData: {
      address: branch.location?.address || '',
      latitude: branch.location?.latitude || 0,
      longitude: branch.location?.longitude || 0,
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    operatingHours: branch.operatingHours && Object.keys(branch.operatingHours).length > 0 ? branch.operatingHours : undefined,
    requireCoverImage: false,
  });

  const { imagePreview, handleImageSelect: handleImageSelectBase, handleRemoveImage: handleRemoveImageBase } = useBranchImage(
    branch.coverImage || null
  );

  const handleImageSelect = (file: File) => {
    handleImageSelectBase(file, (selectedFile) => updateFormData({ branchCoverImage: selectedFile }));
  };
  const handleRemoveImage = () => {
    handleRemoveImageBase(() => updateFormData({ branchCoverImage: null }));
  };

  const existingLocationId = branch.location?.id;

  const updateBranchMutation = useMutation({
    mutationFn: async () => {
      const formattedOperatingHours: Record<string, { open: string; close: string; isClosed?: boolean }> = {};
      Object.entries(operatingHours).forEach(([day, hours]) => {
        if (hours.isClosed) {
          formattedOperatingHours[day] = { open: hours.open || '00:00', close: hours.close || '00:00', isClosed: true };
        } else if (hours.open && hours.close) {
          formattedOperatingHours[day] = { open: hours.open, close: hours.close };
        }
      });

      const form = new FormData();
      form.append('name', formData.name);
      form.append('status', formData.status);
      form.append('isMainBranch', String(formData.isMainBranch));
      form.append('phoneNumber', formData.phoneNumber || '');
      form.append('branchEmailAddress', formData.branchEmailAddress || '');
      form.append('operatingHours', JSON.stringify(formattedOperatingHours));
      if (formData.payStackSubAccountId) form.append('payStackSubAccountId', formData.payStackSubAccountId);
      if (formData.branchCoverImage) form.append('branchCoverImage', formData.branchCoverImage);

      const updated = await branchService.update(branchId, form);

      if (locationData.address && locationData.latitude && locationData.longitude) {
        try {
          if (existingLocationId) {
            await locationService.update(existingLocationId, {
              address: locationData.address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            });
          } else {
            await locationService.create({
              branch_id: branchId,
              address: locationData.address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              city: locationData.city || undefined,
              state: locationData.state || undefined,
              country: locationData.country || undefined,
              postalCode: locationData.postalCode || undefined,
            });
          }
        } catch (locationError) {
          // Branch details are already saved — surface a lighter warning instead of failing the whole flow.
          console.error('Failed to save location:', locationError);
          toast.error('Branch updated, but saving its location failed — try again from here.');
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', branchId] });
      toast.success('Branch updated successfully');
      navigate(`/branches/${branchId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update branch');
    },
  });

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };
  const handlePrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const handleCancel = () => navigate(`/branches/${branchId}`);
  const handleSubmit = () => {
    if (!validateStep(currentStep)) return;
    updateBranchMutation.mutate();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            imagePreview={imagePreview}
            managers={managers}
            managerLocked
            onFormDataChange={updateFormData}
            onImageSelect={handleImageSelect}
            onRemoveImage={handleRemoveImage}
          />
        );
      case 2:
        return <LocationStep locationData={locationData} errors={errors} onLocationChange={updateLocationData} />;
      case 3:
        return (
          <OperatingHoursStep
            operatingHours={operatingHours}
            errors={errors}
            onOperatingHoursChange={updateOperatingHours}
            onToggleDayClosed={toggleDayClosed}
          />
        );
      case 4:
        return <ReviewStep formData={formData} locationData={locationData} operatingHours={operatingHours} managers={managers} />;
      default:
        return null;
    }
  };

  return (
    <>
      <BranchFormHeader title="Edit Branch" description={STEPS[currentStep - 1].description} onBack={handleCancel} />
      <BranchFormStepper steps={STEPS} currentStep={currentStep} />
      <div className="p-6 rounded-ios bg-white shadow-ios border border-ios-gray5 mb-6">{renderStepContent()}</div>
      <BranchFormNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        isSubmitting={updateBranchMutation.isPending}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        submittingLabel="Saving…"
      />
    </>
  );
}
