import api from './api';
import { PDF_UPLOAD_TIMEOUT_MS } from '../config/uploadConfig';

export type NodeType = 'unset' | 'container' | 'pdf_holder';
export type ContentType = 'empty' | 'categories' | 'pdfs';
export type CategoryPricingType = 'free' | 'paid' | 'restricted';

export interface PdfCategoryNode {
  id: number;
  uuid: string;
  name: string;
  name_gujarati?: string | null;
  description?: string | null;
  description_gujarati?: string | null;
  icon?: string | null;
  color?: string | null;
  node_type: NodeType;
  parent_category_id: number | null;
  hierarchy_level: number;
  display_order: number;
  is_active: boolean;
  // Pricing — meaningful on root categories only; the whole tree inherits it
  pricing_type?: CategoryPricingType;
  price?: number | string;
  discount_percentage?: number | string;
}

export interface PdfNode {
  id: string;
  title: string;
  description?: string | null;
  original_filename: string;
  file_size: number;
  access_level: 'free' | 'premium' | 'restricted';
  is_free?: boolean;
  price?: number;
  currency?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  category_id?: number | null;
}

export interface ButtonsState {
  can_add_category: boolean;
  can_add_pdf: boolean;
}

export interface RootHierarchyResponse {
  success: boolean;
  data: {
    content_type: ContentType;
    content: PdfCategoryNode[];
    buttons_state: ButtonsState;
    statistics: { root_categories_count: number };
  };
}

export interface CategoryContentResponse {
  success: boolean;
  data: {
    category: {
      id: number;
      uuid: string;
      name: string;
      name_gujarati?: string | null;
      description?: string | null;
      description_gujarati?: string | null;
      node_type: NodeType;
      hierarchy_level: number;
      parent_category?: { id: number; uuid: string; name: string; hierarchy_level: number } | null;
    };
    content_type: ContentType;
    content: PdfCategoryNode[] | PdfNode[];
    buttons_state: ButtonsState;
    statistics: { child_categories_count: number; pdfs_count: number };
  };
}

export interface CategoryPayload {
  name: string;
  name_gujarati?: string;
  description?: string;
  description_gujarati?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  // Root categories only — ignored by the backend for sub-categories
  pricing_type?: CategoryPricingType;
  price?: number | string;
  discount_percentage?: number | string;
}

const BASE = '/admin/pdf-hierarchy';

export const pdfHierarchyService = {
  getRoots: async (): Promise<RootHierarchyResponse> => {
    const res = await api.get(`${BASE}/roots`);
    return res.data;
  },

  getCategoryContent: async (categoryUuid: string): Promise<CategoryContentResponse> => {
    const res = await api.get(`${BASE}/categories/${categoryUuid}`);
    return res.data;
  },

  createRootCategory: async (payload: CategoryPayload) => {
    const res = await api.post(`${BASE}/categories`, payload);
    return res.data;
  },

  createSubCategory: async (parentUuid: string, payload: CategoryPayload) => {
    const res = await api.post(`${BASE}/categories/${parentUuid}/subcategories`, payload);
    return res.data;
  },

  updateCategory: async (categoryUuid: string, payload: Partial<CategoryPayload>) => {
    const res = await api.put(`${BASE}/categories/${categoryUuid}`, payload);
    return res.data;
  },

  deleteCategory: async (categoryUuid: string) => {
    const res = await api.delete(`${BASE}/categories/${categoryUuid}`);
    return res.data;
  },

  reorderCategories: async (items: { uuid: string; display_order: number }[]) => {
    const res = await api.patch(`${BASE}/categories/reorder`, { items });
    return res.data;
  },

  reorderPdfs: async (items: { id: string; display_order: number }[]) => {
    const res = await api.patch(`${BASE}/pdfs/reorder`, { items });
    return res.data;
  },

  /**
   * Upload a brand-new PDF directly into a leaf category. Access/pricing is
   * not sent — the backend derives it from the root category.
   */
  uploadPdf: async (
    categoryUuid: string,
    fields: {
      title: string;
      description?: string;
      tags?: string;
      currency?: string;
      subscription_required?: boolean;
      preview_pages?: string | number;
    },
    file: File,
    onProgress?: (pct: number) => void,
  ) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', fields.title);
    if (fields.description) formData.append('description', fields.description);
    if (fields.tags) formData.append('tags', fields.tags);
    if (fields.currency) formData.append('currency', fields.currency);
    if (fields.subscription_required !== undefined) formData.append('subscription_required', String(fields.subscription_required));
    if (fields.preview_pages !== undefined) formData.append('preview_pages', String(fields.preview_pages));

    const res = await api.post(`${BASE}/categories/${categoryUuid}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Per-request timeout override — uploads can take much longer than the
      // default request timeout. Value comes from VITE_UPLOAD_TIMEOUT_MS so
      // ops can tune it without a code change.
      timeout: PDF_UPLOAD_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data;
  },

  updatePdf: async (pdfId: string, updates: Record<string, any>) => {
    const res = await api.put(`${BASE}/pdfs/${pdfId}`, updates);
    return res.data;
  },

  deletePdf: async (pdfId: string) => {
    const res = await api.delete(`${BASE}/pdfs/${pdfId}`);
    return res.data;
  },
};
