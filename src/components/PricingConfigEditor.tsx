import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { serviceTemplateService } from '../services/superAdminService';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { FormField, iosInputCls } from './ui/FormField';
import type { ServiceTemplate, PricingConfig, BaseConfiguration, PricingOption, CustomSpecification, BaseConfigurationType } from '../types';

const defaultConfigFor = (template: ServiceTemplate): PricingConfig => {
  if (template.pricingConfig) {
    return {
      baseConfigurations: template.pricingConfig.baseConfigurations || [],
      options: template.pricingConfig.options || [],
      customSpecifications: template.pricingConfig.customSpecifications || [],
    };
  }
  return {
    baseConfigurations: template.pricePerUnit != null
      ? [{ id: `config_${Date.now()}`, name: 'Standard', type: 'PRESET', unitPrice: template.pricePerUnit }]
      : [],
    options: [],
    customSpecifications: [],
  };
};

interface PricingConfigEditorProps {
  template: ServiceTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export const PricingConfigEditor = ({ template, isOpen, onClose }: PricingConfigEditorProps) => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<PricingConfig>(() => defaultConfigFor(template));
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [customSpecsOpen, setCustomSpecsOpen] = useState(false);
  const [addBaseConfigOpen, setAddBaseConfigOpen] = useState(false);
  const [addOptionOpen, setAddOptionOpen] = useState(false);
  const [addCustomSpecOpen, setAddCustomSpecOpen] = useState(false);

  if (!isOpen) return null;

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ServiceTemplate>) => serviceTemplateService.update(template.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-templates'] });
      toast.success('Pricing saved');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save pricing'),
  });

  const validate = (): string | null => {
    if (config.baseConfigurations.length === 0) return 'Add at least one base configuration';
    if (config.options.length > 0 && !config.options.some((o) => o.enabled && o.default)) {
      return 'One enabled option must be set as default';
    }
    return null;
  };

  const handleSave = (activate: boolean) => {
    const error = validate();
    if (error) { toast.error(error); return; }
    saveMutation.mutate({ pricingConfig: config, ...(activate ? { isActive: true } : {}) });
  };

  const addBaseConfig = (cfg: BaseConfiguration) => {
    setConfig((c) => ({ ...c, baseConfigurations: [...c.baseConfigurations, cfg] }));
    setAddBaseConfigOpen(false);
  };
  const updateBaseConfig = (index: number, updates: Partial<BaseConfiguration>) => {
    setConfig((c) => ({
      ...c,
      baseConfigurations: c.baseConfigurations.map((bc, i) => (i === index ? { ...bc, ...updates } : bc)),
    }));
  };
  const deleteBaseConfig = (index: number) => {
    setConfig((c) => ({ ...c, baseConfigurations: c.baseConfigurations.filter((_, i) => i !== index) }));
  };

  const addOption = (option: PricingOption) => {
    setConfig((c) => {
      const options = [...c.options, option];
      if (option.default) options.forEach((o) => { if (o.id !== option.id) o.default = false; });
      return { ...c, options };
    });
    setAddOptionOpen(false);
  };
  const updateOption = (index: number, updates: Partial<PricingOption>) => {
    setConfig((c) => {
      const options = c.options.map((o, i) => (i === index ? { ...o, ...updates } : o));
      if (updates.default) options.forEach((o, i) => { if (i !== index) o.default = false; });
      return { ...c, options };
    });
  };
  const deleteOption = (index: number) => {
    setConfig((c) => ({ ...c, options: c.options.filter((_, i) => i !== index) }));
  };

  const addCustomSpec = (spec: CustomSpecification) => {
    setConfig((c) => ({ ...c, customSpecifications: [...c.customSpecifications, spec] }));
    setAddCustomSpecOpen(false);
  };
  const updateCustomSpec = (index: number, updates: Partial<CustomSpecification>) => {
    setConfig((c) => ({
      ...c,
      customSpecifications: c.customSpecifications.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  };
  const deleteCustomSpec = (index: number) => {
    setConfig((c) => ({ ...c, customSpecifications: c.customSpecifications.filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-ios-grouped-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-ios-gray5 bg-white shrink-0">
        <div>
          <p className="text-xs text-ios-secondary-label">Pricing configuration</p>
          <h2 className="text-lg font-semibold text-ios-label">{template.name}</h2>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray6 text-ios-secondary-label hover:bg-ios-gray5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 flex gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Base configurations */}
            <section className="bg-white rounded-ios shadow-ios overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ios-gray5">
                <div>
                  <p className="text-sm font-semibold text-ios-label">Pricing Models</p>
                  <p className="text-xs text-ios-secondary-label">Size presets or a custom size, each with its own price</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setAddBaseConfigOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <div className="divide-y divide-ios-gray5">
                {config.baseConfigurations.map((bc, i) => (
                  <div key={bc.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-ios-label truncate">{bc.name}</span>
                      {bc.type === 'CUSTOM' && <Badge variant="neutral">Custom</Badge>}
                      {bc.customValue && <span className="text-xs text-ios-secondary-label">{bc.customValue}</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-ios-secondary-label">GHS</span>
                      <input
                        type="number" min="0" step="0.01" value={bc.unitPrice}
                        onChange={(e) => updateBaseConfig(i, { unitPrice: Number(e.target.value) })}
                        className="w-24 px-2 py-1 bg-ios-gray6 rounded-ios text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
                      />
                    </div>
                    <button onClick={() => deleteBaseConfig(i)} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-red/10 hover:text-ios-red shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {config.baseConfigurations.length === 0 && (
                  <div className="px-4 py-8 text-center text-ios-gray text-sm">No pricing models yet — add at least one</div>
                )}
              </div>
            </section>

            {/* Options */}
            <section className="bg-white rounded-ios shadow-ios overflow-hidden">
              <button
                type="button"
                onClick={() => setOptionsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-ios-gray5"
              >
                <div className="flex items-center gap-2">
                  {optionsOpen ? <ChevronDown className="w-4 h-4 text-ios-gray" /> : <ChevronRight className="w-4 h-4 text-ios-gray" />}
                  <p className="text-sm font-semibold text-ios-label">Standard Options</p>
                  <Badge variant="neutral">{config.options.length}</Badge>
                </div>
              </button>
              {optionsOpen && (
                <div>
                  <div className="flex justify-end px-4 py-2">
                    <Button size="sm" variant="secondary" onClick={() => setAddOptionOpen(true)}>
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </Button>
                  </div>
                  <div className="divide-y divide-ios-gray5">
                    {config.options.map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox" checked={opt.enabled}
                          onChange={(e) => updateOption(i, { enabled: e.target.checked })}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-medium text-ios-label truncate">{opt.name}</span>
                          {opt.default && <Badge variant="warning">Default</Badge>}
                        </div>
                        {opt.enabled && (
                          <button
                            onClick={() => updateOption(i, { default: true })}
                            className={`p-1.5 rounded-full shrink-0 ${opt.default ? 'text-ios-orange' : 'text-ios-gray hover:bg-ios-gray6'}`}
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" fill={opt.default ? 'currentColor' : 'none'} />
                          </button>
                        )}
                        {opt.enabled && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-ios-secondary-label">+GHS</span>
                            <input
                              type="number" min="0" step="0.01" value={opt.priceModifier}
                              onChange={(e) => updateOption(i, { priceModifier: Number(e.target.value) })}
                              className="w-20 px-2 py-1 bg-ios-gray6 rounded-ios text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
                            />
                          </div>
                        )}
                        <button onClick={() => deleteOption(i)} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-red/10 hover:text-ios-red shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {config.options.length === 0 && (
                      <div className="px-4 py-8 text-center text-ios-gray text-sm">No options yet</div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Custom specifications */}
            <section className="bg-white rounded-ios shadow-ios overflow-hidden">
              <button
                type="button"
                onClick={() => setCustomSpecsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-ios-gray5"
              >
                <div className="flex items-center gap-2">
                  {customSpecsOpen ? <ChevronDown className="w-4 h-4 text-ios-gray" /> : <ChevronRight className="w-4 h-4 text-ios-gray" />}
                  <p className="text-sm font-semibold text-ios-label">Custom Specifications</p>
                  <Badge variant="neutral">{config.customSpecifications.length}</Badge>
                </div>
              </button>
              {customSpecsOpen && (
                <div>
                  <div className="flex justify-end px-4 py-2">
                    <Button size="sm" variant="secondary" onClick={() => setAddCustomSpecOpen(true)}>
                      <Plus className="w-3.5 h-3.5" /> Add spec
                    </Button>
                  </div>
                  <div className="divide-y divide-ios-gray5">
                    {config.customSpecifications.map((spec, i) => (
                      <div key={spec.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex-1 min-w-0 text-sm font-medium text-ios-label truncate">{spec.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-ios-secondary-label">+GHS</span>
                          <input
                            type="number" min="0" step="0.01" value={spec.priceModifier}
                            onChange={(e) => updateCustomSpec(i, { priceModifier: Number(e.target.value) })}
                            className="w-20 px-2 py-1 bg-ios-gray6 rounded-ios text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
                          />
                        </div>
                        <button onClick={() => deleteCustomSpec(i)} className="p-1.5 rounded-full text-ios-gray hover:bg-ios-red/10 hover:text-ios-red shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {config.customSpecifications.length === 0 && (
                      <div className="px-4 py-8 text-center text-ios-gray text-sm">No custom specifications yet</div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Live summary */}
          <div className="hidden xl:block w-72 shrink-0 sticky top-6">
            <div className="bg-white rounded-ios shadow-ios p-4">
              <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide mb-3">Live Summary</p>
              {config.baseConfigurations.length === 0 && config.options.length === 0 && config.customSpecifications.length === 0 ? (
                <p className="text-sm text-ios-gray">Nothing configured yet</p>
              ) : (
                <div className="space-y-3 text-sm">
                  {config.baseConfigurations.length > 0 && (
                    <div className="space-y-1">
                      {config.baseConfigurations.map((bc) => (
                        <div key={bc.id} className="flex justify-between text-ios-label">
                          <span className="truncate">{bc.name}</span>
                          <span className="shrink-0">GHS {bc.unitPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {config.options.filter((o) => o.enabled).length > 0 && (
                    <div className="pt-2 border-t border-ios-gray5 space-y-1">
                      {config.options.filter((o) => o.enabled).map((o) => (
                        <div key={o.id} className="flex justify-between text-ios-secondary-label">
                          <span className="truncate">{o.name}{o.default ? ' ★' : ''}</span>
                          <span className="shrink-0">{o.priceModifier > 0 ? `+GHS ${o.priceModifier.toFixed(2)}` : 'Free'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {config.customSpecifications.length > 0 && (
                    <div className="pt-2 border-t border-ios-gray5 space-y-1">
                      {config.customSpecifications.map((s) => (
                        <div key={s.id} className="flex justify-between text-ios-secondary-label">
                          <span className="truncate">{s.name}</span>
                          <span className="shrink-0">+GHS {s.priceModifier.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ios-gray5 bg-white shrink-0">
        <Button variant="secondary" onClick={onClose}>Discard</Button>
        <Button variant="secondary" disabled={saveMutation.isPending} onClick={() => handleSave(false)}>Save Draft</Button>
        <Button disabled={saveMutation.isPending} onClick={() => handleSave(true)}>Save &amp; Activate</Button>
      </div>

      <AddBaseConfigDialog isOpen={addBaseConfigOpen} onClose={() => setAddBaseConfigOpen(false)} onAdd={addBaseConfig} />
      <AddOptionDialog isOpen={addOptionOpen} onClose={() => setAddOptionOpen(false)} onAdd={addOption} />
      <AddCustomSpecDialog isOpen={addCustomSpecOpen} onClose={() => setAddCustomSpecOpen(false)} onAdd={addCustomSpec} />
    </div>
  );
};

function AddBaseConfigDialog({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (c: BaseConfiguration) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    const type = form.get('type') as BaseConfigurationType;
    const unitPrice = Math.max(0, Number(form.get('unitPrice') || 0));
    const customValue = String(form.get('customValue') || '').trim();
    onAdd({ id: `config_${Date.now()}`, name, type, unitPrice, customValue: type === 'CUSTOM' ? customValue || null : null });
    e.currentTarget.reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Pricing Model">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <input name="name" required placeholder="e.g. A4, Business Card, Standard" className={iosInputCls} />
        </FormField>
        <FormField label="Type">
          <select name="type" defaultValue="PRESET" className={iosInputCls}>
            <option value="PRESET">Preset size</option>
            <option value="CUSTOM">Custom size</option>
          </select>
        </FormField>
        <FormField label="Price (GHS)">
          <input name="unitPrice" type="number" min="0" step="0.01" required className={iosInputCls} />
        </FormField>
        <FormField label="Custom value (optional)">
          <input name="customValue" placeholder={'e.g. "8.5x11"'} className={iosInputCls} />
        </FormField>
        <Button type="submit" className="w-full py-2.5">Add</Button>
      </form>
    </Modal>
  );
}

function AddOptionDialog({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (o: PricingOption) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    onAdd({
      id: `option_${Date.now()}`,
      name,
      enabled: form.get('enabled') === 'on',
      default: form.get('default') === 'on',
      priceModifier: Math.max(0, Number(form.get('priceModifier') || 0)),
    });
    e.currentTarget.reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Option">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <input name="name" required placeholder="e.g. Color, Lamination, Front & Back" className={iosInputCls} />
        </FormField>
        <FormField label="Price modifier (GHS)">
          <input name="priceModifier" type="number" min="0" step="0.01" defaultValue={0} className={iosInputCls} />
        </FormField>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ios-label">
            <input type="checkbox" name="enabled" defaultChecked /> Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-ios-label">
            <input type="checkbox" name="default" /> Pre-selected for customers
          </label>
        </div>
        <Button type="submit" className="w-full py-2.5">Add</Button>
      </form>
    </Modal>
  );
}

function AddCustomSpecDialog({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (s: CustomSpecification) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    onAdd({ id: `spec_${Date.now()}`, name, priceModifier: Math.max(0, Number(form.get('priceModifier') || 0)) });
    e.currentTarget.reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Specification">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <input name="name" required placeholder="e.g. Lamination, Brown envelope" className={iosInputCls} />
        </FormField>
        <FormField label="Price modifier (GHS)">
          <input name="priceModifier" type="number" min="0" step="0.01" defaultValue={0} className={iosInputCls} />
        </FormField>
        <Button type="submit" className="w-full py-2.5">Add</Button>
      </form>
    </Modal>
  );
}
