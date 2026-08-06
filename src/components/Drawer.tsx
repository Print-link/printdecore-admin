import type { ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'default' | 'large';
}

export const Drawer = ({ isOpen, onClose, title, children, size = 'default' }: DrawerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className={`bg-white h-full w-full ${size === 'large' ? 'sm:w-2/3 sm:max-w-3xl' : 'sm:w-1/2 sm:max-w-2xl'} rounded-ios-lg shadow-2xl flex flex-col animate-[drawer-in_0.2s_ease-out] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ios-gray5 shrink-0">
          <h2 className="text-lg font-semibold text-ios-label">{title}</h2>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-full bg-ios-gray6 text-ios-secondary-label hover:bg-ios-gray5 text-base leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
