import { FormField, iosInputCls } from '../ui/FormField';
import { BranchImageUpload } from './BranchImageUpload';
import type { BranchFormData } from '../../hooks/useBranchForm';
import type { User } from '../../types';

interface BasicInfoStepProps {
  formData: BranchFormData;
  errors: Record<string, string>;
  imagePreview: string | null;
  managers: User[];
  onFormDataChange: (updates: Partial<BranchFormData>) => void;
  onImageSelect: (file: File) => void;
  onRemoveImage: () => void;
}

export function BasicInfoStep({
  formData,
  errors,
  imagePreview,
  managers,
  onFormDataChange,
  onImageSelect,
  onRemoveImage,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-4">
      <BranchImageUpload imagePreview={imagePreview} onImageSelect={onImageSelect} onRemoveImage={onRemoveImage} />
      {errors.branchCoverImage && <p className="text-ios-red text-sm -mt-2">{errors.branchCoverImage}</p>}

      <FormField label="Branch Name *">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          className={iosInputCls}
          placeholder="e.g. Main Street Branch"
          required
        />
        {errors.name && <p className="text-ios-red text-sm mt-1">{errors.name}</p>}
      </FormField>

      <FormField label="Manager *">
        <select
          value={formData.manager_id}
          onChange={(e) => onFormDataChange({ manager_id: e.target.value })}
          className={iosInputCls}
          required
        >
          <option value="">Select manager</option>
          {managers.map((m) => (
            <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
          ))}
        </select>
        {errors.manager_id && <p className="text-ios-red text-sm mt-1">{errors.manager_id}</p>}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Branch Phone Number">
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => onFormDataChange({ phoneNumber: e.target.value })}
            className={iosInputCls}
            placeholder="+233 24 XXX XXXX"
          />
        </FormField>

        <FormField label="Branch Email Address">
          <input
            type="email"
            value={formData.branchEmailAddress}
            onChange={(e) => onFormDataChange({ branchEmailAddress: e.target.value })}
            className={iosInputCls}
            placeholder="branch@example.com"
          />
        </FormField>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isMainBranch}
            onChange={(e) => onFormDataChange({ isMainBranch: e.target.checked })}
            className="w-4 h-4 rounded border-ios-gray4 text-brand-hover focus:ring-brand-hover"
          />
          <span className="text-sm text-ios-label">Main Branch</span>
        </label>

        <div className="flex-1 sm:max-w-xs w-full">
          <FormField label="Status">
            <select
              value={formData.status}
              onChange={(e) => onFormDataChange({ status: e.target.value as BranchFormData['status'] })}
              className={iosInputCls}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="temporarily_closed">Temporarily Closed</option>
            </select>
          </FormField>
        </div>
      </div>
    </div>
  );
}
