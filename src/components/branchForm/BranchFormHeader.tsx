import { ArrowLeft } from 'lucide-react';

interface BranchFormHeaderProps {
  title: string;
  description: string;
  onBack: () => void;
}

export function BranchFormHeader({ title, description, onBack }: BranchFormHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button onClick={onBack} className="p-2 rounded-full hover:bg-ios-gray6 text-ios-secondary-label" aria-label="Back">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-ios-label tracking-tight">{title}</h1>
        <p className="text-sm text-ios-secondary-label">{description}</p>
      </div>
    </div>
  );
}
