import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { FormField } from '../ui/FormField';

interface BranchImageUploadProps {
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onRemoveImage: () => void;
}

export function BranchImageUpload({ imagePreview, onImageSelect, onRemoveImage }: BranchImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelect(file);
  };

  return (
    <FormField label="Branch Cover Image">
      {imagePreview ? (
        <div className="relative w-full max-w-md">
          <img src={imagePreview} alt="Branch cover preview" className="w-full h-48 object-cover rounded-ios border border-ios-gray5" />
          <button
            type="button"
            onClick={onRemoveImage}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 rounded-ios border border-ios-gray5 bg-ios-gray6 text-ios-label hover:bg-ios-gray5 text-sm font-medium"
          >
            Change Image
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-md border-2 border-dashed border-ios-gray4 rounded-ios p-8 text-center cursor-pointer hover:border-brand-hover bg-ios-gray6 transition-colors"
        >
          <Camera className="w-8 h-8 mx-auto mb-3 text-ios-gray" />
          <p className="text-sm font-medium text-ios-label mb-1">Click to upload cover image</p>
          <p className="text-xs text-ios-secondary-label">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </FormField>
  );
}
