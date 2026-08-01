import { CheckCircle2 } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  description: string;
}

interface BranchFormStepperProps {
  steps: Step[];
  currentStep: number;
}

export function BranchFormStepper({ steps, currentStep }: BranchFormStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                  currentStep > step.id
                    ? 'bg-ios-green text-white'
                    : currentStep === step.id
                      ? 'bg-brand text-ios-label'
                      : 'bg-ios-gray5 text-ios-gray'
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <p className="text-xs mt-2 text-center text-ios-secondary-label">{step.title}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-ios-green' : 'bg-ios-gray5'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
