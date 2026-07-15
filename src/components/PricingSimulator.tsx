import { useMemo, useState } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PricingConfig } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const countPdfPages = async (file: File): Promise<number> => {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  return doc.numPages;
};

interface PricingSimulatorProps {
  config: PricingConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const PricingSimulator = ({ config, isOpen, onClose }: PricingSimulatorProps) => {
  const [baseConfigId, setBaseConfigId] = useState(config.baseConfigurations[0]?.id ?? '');
  const [optionIds, setOptionIds] = useState<Set<string>>(
    () => new Set(config.options.filter((o) => o.enabled && o.default).map((o) => o.id))
  );
  const [specIds, setSpecIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const selectedBaseConfig = config.baseConfigurations.find((bc) => bc.id === baseConfigId);

  const total = useMemo(() => {
    const base = (selectedBaseConfig?.unitPrice || 0) * Math.max(1, quantity);
    const options = config.options
      .filter((o) => o.enabled && optionIds.has(o.id))
      .reduce((sum, o) => sum + o.priceModifier, 0);
    const specs = config.customSpecifications
      .filter((s) => specIds.has(s.id))
      .reduce((sum, s) => sum + s.priceModifier, 0);
    return base + options + specs;
  }, [selectedBaseConfig, quantity, optionIds, specIds, config]);

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
      const pages = await countPdfPages(file);
      setQuantity(pages);
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

          {/* Quantity / pages */}
          <FormRow label="Quantity / pages">
            <input
              id="simulator-quantity"
              type="number" min="1" value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-ios-gray6 rounded-ios text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
            />
          </FormRow>

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
          <span className="text-sm text-ios-secondary-label">Estimated total</span>
          <span className="text-2xl font-bold text-ios-label">GHS {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-ios-secondary-label block mb-1">{label}</label>
    {children}
  </div>
);
