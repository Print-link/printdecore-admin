import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export const ListGroup = ({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) => (
  <div className="mb-4">
    {title && (
      <p className="px-3.5 mb-1 text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">{title}</p>
    )}
    <div className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5 overflow-hidden">{children}</div>
    {footer && <p className="px-3.5 mt-1 text-xs text-ios-secondary-label">{footer}</p>}
  </div>
);

interface ListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
}

export const ListRow = ({ leading, title, subtitle, trailing, chevron, onClick, destructive }: ListRowProps) => (
  <div
    className={`flex items-center gap-3 px-3.5 py-2.5 ${onClick ? 'cursor-pointer hover:bg-ios-gray6 active:bg-ios-gray5' : ''}`}
    onClick={onClick}
  >
    {leading && <div className="shrink-0">{leading}</div>}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium truncate ${destructive ? 'text-ios-red' : 'text-ios-label'}`}>{title}</p>
      {subtitle && <p className="text-xs text-ios-secondary-label truncate mt-0.5">{subtitle}</p>}
    </div>
    {trailing && <div className="shrink-0 flex items-center gap-2">{trailing}</div>}
    {chevron && <ChevronRight className="w-4 h-4 text-ios-gray3 shrink-0" />}
  </div>
);
