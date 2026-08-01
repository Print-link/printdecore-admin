import { Button } from '../ui/Button';

interface BranchFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function BranchFormNavigation({
  currentStep,
  totalSteps,
  isSubmitting,
  onPrevious,
  onNext,
  onCancel,
  onSubmit,
}: BranchFormNavigationProps) {
  return (
    <div className="flex justify-between">
      <Button variant="secondary" onClick={currentStep === 1 ? onCancel : onPrevious}>
        {currentStep === 1 ? 'Cancel' : 'Previous'}
      </Button>
      {currentStep < totalSteps ? (
        <Button onClick={onNext}>Next</Button>
      ) : (
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Branch'}
        </Button>
      )}
    </div>
  );
}
