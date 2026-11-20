import api from '../config/api';

/**
 * Pricing v2 — products described by choices (attributes) and options, priced
 * from versioned price lists by the server's one quote engine.
 * Backend: /api/pricing/v2/* (ops only).
 */

export type PricingUnit = 'item' | 'sqft' | 'sqm' | 'side' | 'sheet';
export type SizeMode = 'none' | 'preset' | 'custom' | 'both';
export type ModifierKind = 'per_item' | 'per_measure' | 'per_side' | 'per_order' | 'percent';

export interface OptionDef {
  key: string;
  name: string;
  specs?: { sides?: number; widthMm?: number; heightMm?: number; [k: string]: unknown };
  /** A size from the size library (its dimensions come from there) */
  sizeKey?: string | null;
}

export interface AttributeDef {
  key: string;
  name: string;
  selection: 'one' | 'any';
  required: boolean;
  defaultOptionKeys: string[];
  options: OptionDef[];
}

export interface RuleDef {
  kind: 'requires' | 'excludes' | 'quantity';
  optionKey?: string | null;
  targetOptionKey?: string | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  message?: string | null;
}

export interface Limits {
  minWidthMm?: number | null;
  maxWidthMm?: number | null;
  minHeightMm?: number | null;
  maxHeightMm?: number | null;
  stepMm?: number | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
}

export interface DefinitionInput {
  pricingUnit: PricingUnit;
  customPricingUnit?: PricingUnit | null;
  sizeMode: SizeMode;
  limits: Limits;
  attributes: AttributeDef[];
  rules: RuleDef[];
  artworkSpec?: Record<string, unknown>;
}

export interface ProductDefinition extends DefinitionInput {
  id: string;
  name: string;
  pricingModel: 'legacy' | 'v2';
  hasDefinition: boolean;
  ownerBranchId: string | null;
  /** Printdecore's live prices for it */
  livePrices: number;
  /** It has a price on the old pricing, which switching must not drop */
  pricedToday: boolean;
}

export interface EditorProduct {
  id: string;
  name: string;
  isActive: boolean;
  category: string;
  formulaType: string;
  pricingModel: 'legacy' | 'v2';
  pricingUnit: PricingUnit | null;
  hasDefinition: boolean;
  attributes: number;
  livePrices: number;
  draftPrices: number;
  orderItems: number;
  pricedToday: boolean;
}

export interface QuantityBreak { min: number; unitPrice: number }

export interface PriceEntry {
  match: Record<string, string>;
  unitPrice: number;
  breaks: QuantityBreak[];
  breakBasis: 'quantity' | 'measure';
  setupFee: number;
  minimumCharge: number;
}

export interface PriceModifier {
  optionKey: string;
  kind: ModifierKind;
  amount: number;
  label?: string;
}

export interface VersionSummary {
  id: string;
  priceListId: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  effectiveFrom: string | null;
  roundingStep: number | null;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
  products?: number;
}

export interface PriceList {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
  liveVersionId: string | null;
  versions: VersionSummary[];
}

export interface SizePreset { key: string; name: string; widthMm: number; heightMm: number; shared: boolean }

export interface QuoteLine { kind: string; label: string; detail?: string; amount: number; optionKey?: string }

export type QuoteResult =
  | {
      ok: true;
      currency: string;
      lines: QuoteLine[];
      subtotal: number;
      vat: { ratePct: number; amount: number } | null;
      total: number;
      unitPrice: number;
      measure: { unit: PricingUnit; perItem: number; printedSides: number; sheets: number; areaSqft?: number };
      choices: Record<string, string | string[]>;
    }
  | { ok: false; errors: Array<{ code: string; message: string; attribute?: string }> };

export interface PreviewRequest {
  quantity: number;
  choices?: Record<string, string | string[]>;
  size?: { widthMm: number; heightMm: number };
  pages?: number;
}

export interface RequoteSummary {
  productId: string;
  productName: string;
  checked: number;
  maxDiff: number;
  flagged: Array<{ orderItemId: string; orderId: string; channel: string; charged: number; requoted: number | null; reason: string }>;
}

export interface Margins {
  items: Array<{ orderItemId: string; orderId: string; branchName: string; createdAt: string; charged: number; vendorCost: number | null; margin: number | null; note?: string }>;
  totals: { orders: number; revenue: number; margin: number; marginPct: number | null };
}

// ── Migration (phase 6) ──

export type ProductStage = 'switched' | 'switched_shops_only' | 'ready_to_switch' | 'ready_shops_only' | 'needs_prices' | 'not_set_up';
export type VendorStage = 'migrated' | 'ready' | 'needs_review' | 'prices_differ' | 'blocked' | 'waiting' | 'nothing_to_move';

export interface OptionMatch {
  vendorKey: string;
  vendorName: string;
  targetKey: string | null;
  how: 'same_key' | 'same_name' | 'reviewed' | 'dropped' | 'unmatched';
}

export interface VendorPlan {
  agentServiceId: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  isActive: boolean;
  stage: VendorStage;
  problems: string[];
  matches: OptionMatch[];
  disabledOptionKeys: string[];
  strategy: 'same' | 'own' | null;
  checks: { checked: number; flagged: Array<{ label: string; before: number | null; after: number | null; note?: string }> };
}

export interface MigrationOverview {
  products: Array<EditorProduct & { stage: ProductStage }>;
  vendors: VendorPlan[];
  review: Array<OptionMatch & { agentServiceId: string; branchName: string; productId: string; productName: string }>;
}

export interface MappingInput {
  vendorOptionKey: string;
  vendorOptionName?: string;
  action: 'map' | 'drop';
  targetOptionKey?: string | null;
}

type Ok<T> = { success: boolean; data: T };
const base = '/pricing/v2';

/** The editor's message for a failed call — and every problem the server listed */
export const editorError = (e: unknown): { message: string; problems: string[] } => {
  const data = (e as { response?: { data?: { message?: string; problems?: string[] } } })?.response?.data;
  return { message: data?.message || "Something went wrong", problems: data?.problems ?? [] };
};

export const pricingV2Service = {
  products: async () => (await api.get<Ok<{ liveVersionId: string | null; draftVersionId: string | null; products: EditorProduct[] }>>(`${base}/products`)).data.data,
  product: async (id: string) => (await api.get<Ok<ProductDefinition>>(`${base}/products/${id}`)).data.data,
  saveDefinition: async (id: string, d: DefinitionInput) => (await api.put<Ok<ProductDefinition>>(`${base}/products/${id}/definition`, d)).data.data,
  convert: async (id: string) => (await api.post<Ok<{ draft: VersionSummary; notes: string[] }>>(`${base}/products/${id}/convert`)).data.data,
  switchModel: async (id: string, to: 'v2' | 'legacy', force = false) =>
    (await api.post<Ok<{ pricingModel: 'v2' | 'legacy'; report: RequoteSummary[]; shopsOnly: boolean }>>(`${base}/products/${id}/switch`, { to, force })).data.data,
  requote: async (id: string) => (await api.post<Ok<RequoteSummary | null>>(`${base}/products/${id}/requote`)).data.data,
  margins: async (id: string) => (await api.get<Ok<Margins>>(`${base}/products/${id}/margins`)).data.data,

  sizes: async () => (await api.get<Ok<SizePreset[]>>(`${base}/sizes`)).data.data,
  addSize: async (s: { key: string; name: string; widthMm: number; heightMm: number }) => (await api.post<Ok<SizePreset[]>>(`${base}/sizes`, s)).data.data,

  priceLists: async () => (await api.get<Ok<PriceList[]>>(`${base}/price-lists`)).data.data,
  openDraft: async (priceListId: string, fromVersionId?: string) =>
    (await api.post<Ok<VersionSummary>>(`${base}/price-lists/${priceListId}/draft`, { fromVersionId })).data.data,
  updateVersion: async (id: string, patch: { roundingStep?: number | null; notes?: string | null }) =>
    (await api.patch<Ok<VersionSummary>>(`${base}/versions/${id}`, patch)).data.data,
  publish: async (id: string, effectiveFrom?: string) => (await api.post<Ok<VersionSummary>>(`${base}/versions/${id}/publish`, { effectiveFrom })).data.data,
  discard: async (id: string) => (await api.delete(`${base}/versions/${id}`)).data,

  productPrices: async (versionId: string, productId: string) =>
    (await api.get<Ok<{ version: { id: string; status: string; version: number; roundingStep: number | null }; entries: PriceEntry[]; modifiers: PriceModifier[] }>>(
      `${base}/versions/${versionId}/products/${productId}`,
    )).data.data,
  saveProductPrices: async (versionId: string, productId: string, prices: { entries: PriceEntry[]; modifiers: PriceModifier[] }) =>
    (await api.put(`${base}/versions/${versionId}/products/${productId}`, prices)).data.data,
  importCsv: async (versionId: string, productId: string, csv: string, dryRun: boolean) =>
    (await api.post<Ok<{ dryRun: boolean; diff: { added: unknown[]; changed: Array<{ match: Record<string, string>; from: number; to: number }>; removed: unknown[]; unchanged: number } }>>(
      `${base}/versions/${versionId}/products/${productId}/import`,
      { csv, dryRun },
    )).data.data,

  preview: async (productId: string, priceListVersionId: string | undefined, request: PreviewRequest) =>
    (await api.post<Ok<QuoteResult>>(`${base}/preview`, { productId, priceListVersionId, ...request })).data.data,

  migration: async () => (await api.get<Ok<MigrationOverview>>(`${base}/migration`)).data.data,
  vendorPlan: async (agentServiceId: string) => (await api.get<Ok<VendorPlan>>(`${base}/migration/vendors/${agentServiceId}`)).data.data,
  saveMappings: async (agentServiceId: string, items: MappingInput[]) =>
    (await api.put<Ok<VendorPlan>>(`${base}/migration/vendors/${agentServiceId}/mappings`, { items })).data.data,
  migrateVendor: async (agentServiceId: string, force = false) =>
    (await api.post<Ok<VendorPlan>>(`${base}/migration/vendors/${agentServiceId}/migrate`, { force })).data.data,
};
