import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import type { OrderItemFile } from '../../types';

const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

const isImage = (file: OrderItemFile) => {
  const format = (file.format || file.name.split('.').pop() || '').toLowerCase();
  return IMAGE_FORMATS.includes(format);
};

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Renders order-item attachments: images get a clickable thumbnail with an
 * in-page lightbox, everything else (PDFs, docs) gets a file chip that opens
 * the Cloudinary URL in a new tab — browsers already render those natively.
 */
export const FilePreviewList = ({ files }: { files?: OrderItemFile[] }) => {
  const [lightbox, setLightbox] = useState<OrderItemFile | null>(null);

  if (!files || files.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-1">
        {files.map((file, i) =>
          isImage(file) ? (
            <button
              key={file.publicId || i}
              type="button"
              onClick={() => setLightbox(file)}
              className="w-12 h-12 rounded-ios overflow-hidden border border-ios-gray5 hover:opacity-80"
              title={file.name}
            >
              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
            </button>
          ) : (
            <a
              key={file.publicId || i}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-ios bg-ios-gray6 border border-ios-gray5 hover:bg-ios-gray5 text-xs text-ios-label max-w-[220px]"
              title={file.name}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0 text-ios-secondary-label" />
              <span className="truncate">{file.name}</span>
              {!!file.size && <span className="text-ios-gray flex-shrink-0">{formatSize(file.size)}</span>}
            </a>
          ),
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-w-full max-h-full rounded-ios object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
