import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'default' | 'large';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'default' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-ios-lg shadow-2xl w-full ${size === 'large' ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-[modal-in_0.15s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ios-gray5">
          <h2 className="text-lg font-semibold text-ios-label">{title}</h2>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-full bg-ios-gray6 text-ios-secondary-label hover:bg-ios-gray5 text-base leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};
