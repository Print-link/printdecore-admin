import type { PrintRequest } from '../../types';
import { FilePreviewList } from './FilePreviewList';

const fileExt = (name: string) => name?.split('.').pop()?.toLowerCase() || '';

/**
 * Everything the customer configured on a Print Assistance request, laid out
 * so ops can price it without leaving the page: product, size, quantity,
 * chosen options, free-text notes and the reference files. Shared by the
 * quotation review modal and the order detail page.
 */
export const PrintRequestSpec = ({ request }: { request: PrintRequest }) => {
  const product = request.serviceName || request.subCategoryName || request.categoryName || 'Print request';
  const breadcrumb = [request.categoryName, request.subCategoryName].filter(Boolean).join(' › ');
  const size =
    request.width && request.height
      ? `${request.width} × ${request.height} ${(request.measurementUnit || '').toLowerCase()}`.trim()
      : null;

  const files = request.attachments.map((f) => ({
    url: f.url,
    publicId: f.url,
    name: f.name,
    size: f.size,
    format: fileExt(f.name),
  }));

  return (
    <div className="bg-white border border-ios-gray5 rounded-ios overflow-hidden">
      <div className="p-3 border-b border-ios-gray5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ios-label">{product}</p>
            {breadcrumb && breadcrumb !== product && <p className="text-xs text-ios-gray">{breadcrumb}</p>}
          </div>
          <span className="text-xs font-mono text-ios-secondary-label flex-shrink-0">{request.requestNumber}</span>
        </div>
      </div>

      <dl className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Spec label="Quantity" value={request.quantity != null ? String(request.quantity) : '—'} />
        <Spec label="Size" value={size || '—'} />
        <Spec
          label="Options"
          value={request.selectedOptions.length ? request.selectedOptions.join(', ') : '—'}
          wide={request.selectedOptions.length > 1}
        />
        <Spec
          label="Finishing / custom"
          value={request.selectedCustomSpecs.length ? request.selectedCustomSpecs.join(', ') : '—'}
          wide={request.selectedCustomSpecs.length > 1}
        />
      </dl>

      {request.additionalDetails && (
        <div className="px-3 pb-3">
          <p className="text-xs font-medium text-ios-secondary-label mb-1">Customer's notes</p>
          <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{request.additionalDetails}</p>
        </div>
      )}

      <div className="px-3 pb-3">
        <p className="text-xs font-medium text-ios-secondary-label">
          Reference files {files.length ? `(${files.length})` : ''}
        </p>
        {files.length ? (
          <FilePreviewList files={files} />
        ) : (
          <p className="text-xs text-ios-gray italic mt-1">None attached — ask in the chat if artwork is needed to price this.</p>
        )}
      </div>
    </div>
  );
};

const Spec = ({ label, value, wide }: { label: string; value: string; wide?: boolean }) => (
  <div className={wide ? 'col-span-2' : ''}>
    <dt className="text-xs font-medium text-ios-secondary-label">{label}</dt>
    <dd className="text-sm text-ios-label">{value}</dd>
  </div>
);
