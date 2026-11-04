import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PricingConfig } from '../types';
import { pricingService, type PricingSource } from '../services/pricingService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const countPdfPages = async (file: File): Promise<number> => {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  return doc.numPages;
};

interface PricingSimulatorProps {
  config: PricingConfig;
  /** The saved service this setup belongs to; the server prices the draft `config` against it. */
  source: PricingSource;
  isOpen: boolean;
  onClose: () => void;
}

export const PricingSimulator = ({ config, source, isOpen, onClose }: PricingSimulatorProps) => {
  const [baseConfigId, setBaseConfigId] = useState(config.baseConfigurations[0]?.id ?? '');
  const [optionIds, setOptionIds] = useState<Set<string>>(
    () => new Set(config.options.filter((o) => o.enabled && o.default).map((o) => o.id))
  );
  const [specIds, setSpecIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [pages, setPages] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Priced by the server's engine (the one real orders use), never by arithmetic here.
  // Inputs settle for a moment first, so typing "500" isn't three requests.
  const sample = {
    quantity: Math.max(1, quantity),
    filePages: pages ? Number(pages) : undefined,
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
    selectedBaseConfigId: baseConfigId || undefined,
    selectedOptions: [...optionIds],
    selectedCustomSpecs: [...specIds],
  };
  const [settled, setSettled] = useState(sample);
  const sampleKey = JSON.stringify(sample);
  useEffect(() => {
    const id = setTimeout(() => setSettled(JSON.parse(sampleKey)), 300);
    return () => clearTimeout(id);
  }, [sampleKey]);

  const quote = useQuery({
    queryKey: ['pricing-preview', source, config, settled],
    queryFn: () => pricingService.preview(source, settled, config),
    enabled: isOpen,
    retry: false,
  });
  const quoteError = (quote.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;

  if (!isOpen) return null;

  const toggleSet = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setPdfError('Please upload a PDF file'); return; }
    setPdfError(null);
    setFileName(file.name);
    setIsCounting(true);
    try {
      const count = await countPdfPages(file);
      setPages(String(count));
    } catch {
      setPdfError('Could not read that PDF — enter the page count manually');
    } finally {
      setIsCounting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-ios-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ios-gray5 sticky top-0 bg-white">
          <div>
            <p className="text-xs text-ios-secondary-label">Customer simulation</p>
            <h2 className="text-lg font-semibold text-ios-label">How a customer would order this</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray6 text-ios-secondary-label hover:bg-ios-gray5 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* PDF upload */}
          <div>
            <label className="text-xs font-medium text-ios-secondary-label block mb-1">Upload document (optional)</label>
            <label className="flex items-center gap-3 px-4 py-3 rounded-ios border border-dashed border-ios-gray3 bg-ios-gray6 cursor-pointer hover:bg-ios-gray5">
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              {isCounting ? (
                <Loader2 className="w-5 h-5 text-brand-hover animate-spin" />
              ) : fileName ? (
                <FileText className="w-5 h-5 text-brand-hover" />
              ) : (
                <Upload className="w-5 h-5 text-ios-gray" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ios-label truncate">{fileName || 'Choose a PDF to count pages automatically'}</p>
                {pdfError && <p className="text-xs text-ios-red mt-0.5">{pdfError}</p>}
              </div>
            </label>
          </div>

          {/* Pricing model */}
          <div>
            <label className="text-xs font-medium text-ios-secondary-label block mb-1">Pricing model</label>
            <div className="space-y-1.5">
              {config.baseConfigurations.map((bc) => (
                <label key={bc.id} className="flex items-center gap-2.5 px-3 py-2 rounded-ios bg-ios-gray6 cursor-pointer">
                  <input type="radio" name="baseConfig" checked={baseConfigId === bc.id} onChange={() => setBaseConfigId(bc.id)} />
                  <span className="flex-1 text-sm text-ios-label">{bc.name}</span>
                  <span className="text-sm text-ios-secondary-label">GHS {bc.unitPrice.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity, pages and size — the engine says which ones this service needs */}
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Copies">
              <input
                id="simulator-quantity"
                type="number" min="1" value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className={inputCls}
              />
            </FormRow>
            <FormRow label="Pages (document jobs)">
              <input type="number" min="1" value={pages} placeholder="—" onChange={(e) => setPages(e.target.value)} className={inputCls} />
            </FormRow>
            <FormRow label="Width (sized jobs)">
              <input type="number" min="0" step="0.1" value={width} placeholder="—" onChange={(e) => setWidth(e.target.value)} className={inputCls} />
            </FormRow>
            <FormRow label="Height (sized jobs)">
              <input type="number" min="0" step="0.1" value={height} placeholder="—" onChange={(e) => setHeight(e.target.value)} className={inputCls} />
            </FormRow>
          </div>

          {/* Options */}
          {config.options.filter((o) => o.enabled).length > 0 && (
            <div>
              <label className="text-xs font-medium text-ios-secondary-label block mb-1">Options</label>
              <div className="space-y-1.5">
                {config.options.filter((o) => o.enabled).map((o) => (
                  <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 rounded-ios bg-ios-gray6 cursor-pointer">
                    <input type="checkbox" checked={optionIds.has(o.id)} onChange={() => toggleSet(optionIds, setOptionIds, o.id)} />
                    <span className="flex-1 text-sm text-ios-label">{o.name}</span>
                    <span className="text-sm text-ios-secondary-label">{o.priceModifier > 0 ? `+GHS ${o.priceModifier.toFixed(2)}` : 'Free'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom specifications */}
          {config.customSpecifications.length > 0 && (
            <div>
              <label className="text-xs font-medium text-ios-secondary-label block mb-1">Custom specifications</label>
              <div className="space-y-1.5">
                {config.customSpecifications.map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded-ios bg-ios-gray6 cursor-pointer">
                    <input type="checkbox" checked={specIds.has(s.id)} onChange={() => toggleSet(specIds, setSpecIds, s.id)} />
                    <span className="flex-1 text-sm text-ios-label">{s.name}</span>
                    <span className="text-sm text-ios-secondary-label">+GHS {s.priceModifier.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-ios-gray5 bg-ios-gray6 sticky bottom-0">
          <div>
            <p className="text-sm text-ios-secondary-label">Customer pays</p>
            <p className="text-xs text-ios-gray">Same engine as real orders</p>
          </div>
          {quote.isFetching && !quote.data ? (
            <Loader2 className="w-5 h-5 text-brand-hover animate-spin" />
          ) : quoteError || quote.isError ? (
            <span className="text-sm text-ios-red text-right max-w-[60%]">{quoteError || "Couldn't price this sample"}</span>
          ) : (
            <span className={`text-2xl font-bold text-ios-label ${quote.isFetching ? 'opacity-50' : ''}`}>
              GHS {(quote.data?.calculatedPrice ?? 0).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const inputCls =
  'w-full px-3 py-2 bg-ios-gray6 rounded-ios text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover';

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-ios-secondary-label block mb-1">{label}</label>
    {children}
  </div>
);
