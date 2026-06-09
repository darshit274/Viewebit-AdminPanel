/**
 * PDF Hierarchy admin page — mirrors SimpleDynamicHierarchyPage's UX but for
 * PDFs. Routes:
 *   /pdf-hierarchy                              → list root pdf categories
 *   /pdf-hierarchy/categories/:categoryUuid     → drill into a category
 *
 * Each category is either a "container" (has sub-categories) or a "pdf_holder"
 * (contains PDFs directly). Admins create the tree top-down; PDFs are
 * attached at leaf level from the existing PDF library.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, FolderPlus, Upload, Pencil, Trash2,
  Folder, FileText, GripVertical, Search, Loader2, Save, X, FileUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  pdfHierarchyService, PdfCategoryNode, PdfNode, ContentType, ButtonsState,
} from '../services/pdfHierarchy';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { PDF_UPLOAD_MAX_SIZE_BYTES, PDF_UPLOAD_MAX_SIZE_MB } from '../config/uploadConfig';

interface CategoryFormData {
  name: string;
  name_gujarati: string;
  description: string;
  description_gujarati: string;
}

const blankForm: CategoryFormData = {
  name: '',
  name_gujarati: '',
  description: '',
  description_gujarati: '',
};

const PdfHierarchyPage: React.FC = () => {
  const { categoryUuid } = useParams<{ categoryUuid?: string }>();
  const navigate = useNavigate();
  const isRoot = !categoryUuid;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current category node (null when at root)
  const [currentCategory, setCurrentCategory] = useState<{
    id: number; uuid: string; name: string; node_type: string;
    hierarchy_level: number;
    parent_category?: { uuid: string; name: string; hierarchy_level: number } | null;
  } | null>(null);

  const [contentType, setContentType] = useState<ContentType>('empty');
  const [categories, setCategories] = useState<PdfCategoryNode[]>([]);
  const [pdfs, setPdfs] = useState<PdfNode[]>([]);
  const [buttonsState, setButtonsState] = useState<ButtonsState>({ can_add_category: true, can_add_pdf: false });

  // Modals
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: PdfCategoryNode | null }>({
    open: false, editing: null,
  });
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(blankForm);
  const [savingCategory, setSavingCategory] = useState(false);

  // Upload modal — admins upload PDFs directly inside a category (no shared library)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    access_level: 'free' as 'free' | 'premium' | 'restricted',
    tags: '',
    price: '0',
    currency: 'INR',
    preview_pages: '0',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF metadata edit modal
  const [editPdfModal, setEditPdfModal] = useState<{ open: boolean; pdf: PdfNode | null }>({
    open: false, pdf: null,
  });
  const [editPdfForm, setEditPdfForm] = useState({
    title: '', description: '', access_level: 'free' as 'free' | 'premium' | 'restricted',
    price: '0', currency: 'INR', preview_pages: '0',
  });
  const [savingPdfMeta, setSavingPdfMeta] = useState(false);

  const [confirm, setConfirm] = useState<{
    open: boolean; loading: boolean; title: string; message: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, loading: false, title: '', message: '', onConfirm: async () => {} });

  // Search + paging in the displayed list
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isRoot) {
        const res = await pdfHierarchyService.getRoots();
        if (!res.success) throw new Error('Failed to load');
        setCurrentCategory(null);
        setContentType(res.data.content_type);
        setCategories(res.data.content as PdfCategoryNode[]);
        setPdfs([]);
        setButtonsState(res.data.buttons_state);
      } else {
        const res = await pdfHierarchyService.getCategoryContent(categoryUuid);
        if (!res.success) throw new Error('Failed to load');
        setCurrentCategory(res.data.category as any);
        setContentType(res.data.content_type);
        if (res.data.content_type === 'pdfs') {
          setPdfs(res.data.content as PdfNode[]);
          setCategories([]);
        } else if (res.data.content_type === 'categories') {
          setCategories(res.data.content as PdfCategoryNode[]);
          setPdfs([]);
        } else {
          setCategories([]); setPdfs([]);
        }
        setButtonsState(res.data.buttons_state);
      }
      setCurrentPage(1);
      setSearch('');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to load';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [categoryUuid]);

  // ===== Category modal =====
  const openCreateCategory = () => {
    setCategoryForm(blankForm);
    setCategoryModal({ open: true, editing: null });
  };
  const openEditCategory = (c: PdfCategoryNode) => {
    setCategoryForm({
      name: c.name,
      name_gujarati: c.name_gujarati || '',
      description: c.description || '',
      description_gujarati: c.description_gujarati || '',
    });
    setCategoryModal({ open: true, editing: c });
  };
  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSavingCategory(true);
    try {
      if (categoryModal.editing) {
        await pdfHierarchyService.updateCategory(categoryModal.editing.uuid, categoryForm);
        toast.success('Category updated');
      } else if (isRoot) {
        await pdfHierarchyService.createRootCategory(categoryForm);
        toast.success('Root category created');
      } else {
        await pdfHierarchyService.createSubCategory(categoryUuid!, categoryForm);
        toast.success('Sub-category created');
      }
      setCategoryModal({ open: false, editing: null });
      await fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to save');
    } finally {
      setSavingCategory(false);
    }
  };

  const askDeleteCategory = (c: PdfCategoryNode) => {
    setConfirm({
      open: true,
      loading: false,
      title: `Delete "${c.name}"?`,
      message: 'The category must be empty before it can be deleted. Move or delete its contents first.',
      onConfirm: async () => {
        setConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await pdfHierarchyService.deleteCategory(c.uuid);
          toast.success('Category deleted');
          await fetchData();
        } catch (e: any) {
          toast.error(e.response?.data?.message || e.message || 'Delete failed');
        } finally {
          setConfirm({ open: false, loading: false, title: '', message: '', onConfirm: async () => {} });
        }
      },
    });
  };

  // ===== Upload PDF directly into this category =====
  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadForm({
      title: '', description: '', access_level: 'free',
      tags: '', price: '0', currency: 'INR', preview_pages: '0',
    });
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openUpload = () => {
    resetUploadForm();
    setUploadModalOpen(true);
  };

  const handleFileSelect = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (f.size > PDF_UPLOAD_MAX_SIZE_BYTES) {
      toast.error(`File size must be less than ${PDF_UPLOAD_MAX_SIZE_MB}MB`);
      return;
    }
    setUploadFile(f);
    // Pre-fill title from filename if empty
    if (!uploadForm.title.trim()) {
      const t = f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
      setUploadForm((s) => ({ ...s, title: t }));
    }
  };

  const submitUpload = async () => {
    if (!uploadFile) {
      toast.error('Please choose a PDF file');
      return;
    }
    if (!uploadForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!categoryUuid) return;
    setUploading(true);
    try {
      await pdfHierarchyService.uploadPdf(
        categoryUuid,
        {
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || undefined,
          access_level: uploadForm.access_level,
          tags: uploadForm.tags.trim() || undefined,
          price: uploadForm.price,
          currency: uploadForm.currency,
          preview_pages: uploadForm.preview_pages,
        },
        uploadFile,
        (pct) => setUploadProgress(pct),
      );
      toast.success('PDF uploaded successfully');
      setUploadModalOpen(false);
      resetUploadForm();
      await fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ===== Edit PDF metadata =====
  const openEditPdf = (pdf: PdfNode) => {
    setEditPdfForm({
      title: pdf.title || '',
      description: pdf.description || '',
      access_level: pdf.access_level,
      price: String(pdf.price ?? 0),
      currency: pdf.currency || 'INR',
      preview_pages: '0',
    });
    setEditPdfModal({ open: true, pdf });
  };

  const submitEditPdf = async () => {
    if (!editPdfModal.pdf) return;
    if (!editPdfForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSavingPdfMeta(true);
    try {
      await pdfHierarchyService.updatePdf(editPdfModal.pdf.id, {
        title: editPdfForm.title.trim(),
        description: editPdfForm.description.trim(),
        access_level: editPdfForm.access_level,
        price: parseFloat(editPdfForm.price) || 0,
        currency: editPdfForm.currency,
        preview_pages: parseInt(editPdfForm.preview_pages) || 0,
      });
      toast.success('PDF updated');
      setEditPdfModal({ open: false, pdf: null });
      await fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Update failed');
    } finally {
      setSavingPdfMeta(false);
    }
  };

  const askDeletePdf = (pdf: PdfNode) => {
    setConfirm({
      open: true,
      loading: false,
      title: `Delete "${pdf.title}"?`,
      message: 'This permanently deletes the PDF file from the server. This cannot be undone.',
      onConfirm: async () => {
        setConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await pdfHierarchyService.deletePdf(pdf.id);
          toast.success('PDF deleted');
          await fetchData();
        } catch (e: any) {
          toast.error(e.response?.data?.message || e.message || 'Delete failed');
        } finally {
          setConfirm({ open: false, loading: false, title: '', message: '', onConfirm: async () => {} });
        }
      },
    });
  };

  // ===== Reorder =====
  const applyCategoryReorder = async (reordered: PdfCategoryNode[]) => {
    const slots = [...categories].map((c) => c.display_order).sort((a, b) => a - b);
    const withOrders = reordered.map((c, i) => ({ ...c, display_order: slots[i] ?? i + 1 }));
    setCategories(withOrders);
    try {
      await pdfHierarchyService.reorderCategories(
        withOrders.map(({ uuid, display_order }) => ({ uuid, display_order }))
      );
    } catch (e: any) {
      toast.error('Failed to save order');
      setCategories(categories);
    }
  };

  const applyPdfReorder = async (reordered: PdfNode[]) => {
    const slots = [...pdfs].map((p) => p.display_order).sort((a, b) => a - b);
    const withOrders = reordered.map((p, i) => ({ ...p, display_order: slots[i] ?? i + 1 }));
    setPdfs(withOrders);
    try {
      await pdfHierarchyService.reorderPdfs(
        withOrders.map(({ id, display_order }) => ({ id, display_order }))
      );
    } catch (e: any) {
      toast.error('Failed to save order');
      setPdfs(pdfs);
    }
  };

  const handleCategoryDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex((c) => c.uuid === active.id);
    const newIdx = categories.findIndex((c) => c.uuid === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    applyCategoryReorder(arrayMove(categories, oldIdx, newIdx));
  };

  const handlePdfDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = pdfs.findIndex((p) => p.id === active.id);
    const newIdx = pdfs.findIndex((p) => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    applyPdfReorder(arrayMove(pdfs, oldIdx, newIdx));
  };

  // ===== Filtering + paging =====
  const filteredCats = useMemo(
    () => categories.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );
  const filteredPdfs = useMemo(
    () => pdfs.filter((p) => !search || (p.title || '').toLowerCase().includes(search.toLowerCase())),
    [pdfs, search]
  );
  const showList = contentType === 'pdfs' ? filteredPdfs : filteredCats;
  const totalPages = Math.max(1, Math.ceil(showList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagedCats = filteredCats.slice(pageStart, pageStart + pageSize);
  const pagedPdfs = filteredPdfs.slice(pageStart, pageStart + pageSize);

  // ===== Render =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary-600" />
            PDF Categories
          </h1>
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-1">
            <Link to="/pdf-hierarchy" className="hover:text-blue-600">Root</Link>
            {currentCategory?.parent_category && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <Link
                  to={`/pdf-hierarchy/categories/${currentCategory.parent_category.uuid}`}
                  className="hover:text-blue-600"
                >
                  {currentCategory.parent_category.name}
                </Link>
              </>
            )}
            {currentCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-900">{currentCategory.name}</span>
              </>
            )}
          </nav>
        </div>

        <div className="flex gap-2">
          {!isRoot && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {buttonsState.can_add_category && (
            <button
              onClick={openCreateCategory}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FolderPlus className="h-4 w-4" /> Add Category
            </button>
          )}
          {buttonsState.can_add_pdf && !isRoot && (
            <button
              onClick={openUpload}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="h-4 w-4" /> Upload PDF
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={contentType === 'pdfs' ? 'Search PDFs…' : 'Search categories…'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="py-16 text-center px-6">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg">
              Try again
            </button>
          </div>
        ) : contentType === 'empty' ? (
          <div className="py-16 text-center px-6">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              {isRoot ? 'No PDF categories yet' : 'This category is empty'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isRoot
                ? 'Start by adding a root category.'
                : 'Add a sub-category to keep organising, or add PDFs to make this a leaf.'}
            </p>
          </div>
        ) : contentType === 'categories' ? (
          <div className="p-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDrag}>
              <SortableContext items={filteredCats.map((c) => c.uuid)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {pagedCats.map((c) => {
                    const globalIdx = categories.findIndex((cc) => cc.uuid === c.uuid);
                    return (
                      <SortableCategoryRow
                        key={c.uuid}
                        category={c}
                        index={globalIdx}
                        total={categories.length}
                        onOpen={() => navigate(`/pdf-hierarchy/categories/${c.uuid}`)}
                        onEdit={() => openEditCategory(c)}
                        onDelete={() => askDeleteCategory(c)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="p-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePdfDrag}>
              <SortableContext items={filteredPdfs.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {pagedPdfs.map((p) => (
                    <SortablePdfRow
                      key={p.id}
                      pdf={p}
                      onEdit={() => openEditPdf(p)}
                      onDelete={() => askDeletePdf(p)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              Showing {pageStart + 1}–{Math.min(pageStart + pageSize, showList.length)} of {showList.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >Prev</button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {categoryModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={submitCategory}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {categoryModal.editing ? 'Edit Category' : isRoot ? 'Add Root Category' : 'Add Sub-Category'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Gujarati)</label>
                  <input
                    type="text"
                    value={categoryForm.name_gujarati}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, name_gujarati: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતી નામ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Gujarati)</label>
                  <textarea
                    value={categoryForm.description_gujarati}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, description_gujarati: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ open: false, editing: null })}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60"
                >
                  {savingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {categoryModal.editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upload PDF</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Adding to <span className="font-medium">{currentCategory?.name || 'this category'}</span>
                </p>
              </div>
              <button onClick={() => !uploading && setUploadModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* File picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-gray-50"
                >
                  <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  {uploadFile ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700">Click to choose a PDF, or drag & drop</p>
                      <p className="text-xs text-gray-500 mt-1">Max {PDF_UPLOAD_MAX_SIZE_MB} MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((s) => ({ ...s, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Algebra Notes — Chapter 1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((s) => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Access + price row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                  <select
                    value={uploadForm.access_level}
                    onChange={(e) => setUploadForm((s) => ({ ...s, access_level: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium (paid)</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                {uploadForm.access_level === 'premium' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (INR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={uploadForm.price}
                      onChange={(e) => setUploadForm((s) => ({ ...s, price: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm((s) => ({ ...s, tags: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="algebra, notes, chapter 1"
                />
              </div>

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded">
                    <div className="h-full bg-primary-600 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60"
              >Cancel</button>
              <button
                onClick={submitUpload}
                disabled={uploading || !uploadFile || !uploadForm.title.trim()}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit PDF metadata modal */}
      {editPdfModal.open && editPdfModal.pdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit PDF</h2>
              <p className="text-xs text-gray-500 mt-0.5">{editPdfModal.pdf.original_filename}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editPdfForm.title}
                  onChange={(e) => setEditPdfForm((s) => ({ ...s, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editPdfForm.description}
                  onChange={(e) => setEditPdfForm((s) => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                  <select
                    value={editPdfForm.access_level}
                    onChange={(e) => setEditPdfForm((s) => ({ ...s, access_level: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                {editPdfForm.access_level === 'premium' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (INR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPdfForm.price}
                      onChange={(e) => setEditPdfForm((s) => ({ ...s, price: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setEditPdfModal({ open: false, pdf: null })}
                disabled={savingPdfMeta}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60"
              >Cancel</button>
              <button
                onClick={submitEditPdf}
                disabled={savingPdfMeta}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60"
              >
                {savingPdfMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="Confirm"
        loading={confirm.loading}
        onClose={() => setConfirm({ open: false, loading: false, title: '', message: '', onConfirm: async () => {} })}
        onConfirm={confirm.onConfirm}
      />
    </div>
  );
};

// ===== Sortable rows =====

interface SortableCategoryRowProps {
  category: PdfCategoryNode;
  index: number;
  total: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableCategoryRow: React.FC<SortableCategoryRowProps> = ({
  category, index, total, onOpen, onEdit, onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.uuid });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition">
      <button {...attributes} {...listeners} className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none" type="button" title="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <Folder className="h-5 w-5 text-yellow-500 flex-shrink-0" />
      <button onClick={onOpen} className="flex-1 text-left min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{category.name}</div>
        {category.name_gujarati && (
          <div className="text-xs text-gray-500 truncate">{category.name_gujarati}</div>
        )}
        <div className="text-xs text-gray-400 mt-0.5">
          {category.node_type === 'container' && 'Container (has sub-categories)'}
          {category.node_type === 'pdf_holder' && 'Contains PDFs'}
          {category.node_type === 'unset' && 'Empty'}
        </div>
      </button>
      <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
        #{index + 1} / {total}
      </span>
      <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
      <button onClick={onOpen} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded" title="Open">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

interface SortablePdfRowProps {
  pdf: PdfNode;
  onEdit: () => void;
  onDelete: () => void;
}

const SortablePdfRow: React.FC<SortablePdfRowProps> = ({ pdf, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pdf.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition">
      <button {...attributes} {...listeners} className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none" type="button" title="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{pdf.title}</div>
        <div className="text-xs text-gray-500 truncate">{pdf.original_filename}</div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded ${
        pdf.is_free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {pdf.is_free ? 'Free' : 'Premium'}
      </span>
      <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit metadata">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete PDF">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PdfHierarchyPage;
