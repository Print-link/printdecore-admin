import { useState } from 'react';
import toast from 'react-hot-toast';

export function useBranchImage(initialPreview: string | null = null) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialPreview);

  const handleImageSelect = (file: File, onSelect: (file: File) => void) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    onSelect(file);
  };

  const handleRemoveImage = (onRemove: () => void) => {
    setImagePreview(null);
    onRemove();
  };

  return { imagePreview, handleImageSelect, handleRemoveImage };
}
