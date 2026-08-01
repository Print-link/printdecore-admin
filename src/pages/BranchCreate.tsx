import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { branchService, locationService, userService } from '../services/superAdminService';
import { useBranchForm } from '../hooks/useBranchForm';
import { useBranchImage } from '../hooks/useBranchImage';
import { BranchFormHeader } from '../components/branchForm/BranchFormHeader';
import { BranchFormStepper, type Step } from '../components/branchForm/BranchFormStepper';
import { BranchFormNavigation } from '../components/branchForm/BranchFormNavigation';
import { BasicInfoStep } from '../components/branchForm/BasicInfoStep';
import { LocationStep } from '../components/branchForm/LocationStep';
import { OperatingHoursStep } from '../components/branchForm/OperatingHoursStep';
import { ReviewStep } from '../components/branchForm/ReviewStep';

const STEPS: Step[] = [
  { id: 1, title: 'Basic Information', description: 'Branch name and contact details' },
  { id: 2, title: 'Location', description: 'Address and coordinates' },
  { id: 3, title: 'Operating Hours', description: 'Set working hours for each day' },
  { id: 4, title: 'Review', description: 'Review and confirm details' },
];

export const BranchCreate = () => {
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
  } = useBranchForm();

  const { imagePreview, handleImageSelect: handleImageSelectBase, handleRemoveImage: handleRemoveImageBase } = useBranchImage();

  const { data: managersData } = useQuery({
    queryKey: ['managers'],
    queryFn: () => userService.getAll({ limit: 100 }),
  });
  const managers = (managersData?.users as any) || [];

  const handleImageSelect = (file: File) => {
    handleImageSelectBase(file, (selectedFile) => updateFormData({ branchCoverImage: selectedFile }));
  };
  const handleRemoveImage = () => {
    handleRemoveImageBase(() => updateFormData({ branchCoverImage: null }));
  };

  const createBranchMutation = useMutation({
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
      form.append('manager_id', formData.manager_id);
      form.append('status', formData.status);
      form.append('isMainBranch', String(formData.isMainBranch));
      if (formData.phoneNumber) form.append('phoneNumber', formData.phoneNumber);
      if (formData.branchEmailAddress) form.append('branchEmailAddress', formData.branchEmailAddress);
      form.append('operatingHours', JSON.stringify(formattedOperatingHours));
      if (formData.branchCoverImage) form.append('branchCoverImage', formData.branchCoverImage);

      const newBranch = await branchService.create(form);

      if (locationData.address && locationData.latitude && locationData.longitude) {
        try {
          await locationService.create({
            branch_id: newBranch.id,
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            city: locationData.city || undefined,
            state: locationData.state || undefined,
            country: locationData.country || undefined,
            postalCode: locationData.postalCode || undefined,
          });
        } catch (locationError) {
          // Branch is already created — surface a lighter warning instead of failing the whole flow.
          console.error('Failed to create location:', locationError);
          toast.error('Branch created, but saving its location failed — add it from the branch page.');
        }
      }

      return newBranch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch created successfully');
      navigate('/branches');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to create branch');
    },
  });

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };
  const handlePrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const handleCancel = () => navigate('/branches');
  const handleSubmit = () => {
    if (!validateStep(currentStep)) return;
    createBranchMutation.mutate();
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
    <Layout>
      <div className="max-w-3xl mx-auto">
        <BranchFormHeader title="Create New Branch" description={STEPS[currentStep - 1].description} onBack={handleCancel} />
        <BranchFormStepper steps={STEPS} currentStep={currentStep} />
        <div className="p-6 rounded-ios bg-white shadow-ios border border-ios-gray5 mb-6">{renderStepContent()}</div>
        <BranchFormNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          isSubmitting={createBranchMutation.isPending}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
};
