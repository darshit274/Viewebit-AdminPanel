import React, { useState, useEffect } from 'react';
import { X, FileText, BookOpen, Upload, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pdf?: any; // For edit mode
  mode: 'create' | 'edit';
}

export const PdfModal: React.FC<PdfModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pdf,
  mode
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    is_free: true,
    file_url: '',
    file_size: 0,
    // Pricing fields
    price: 0,
    currency: 'INR',
    discount_percentage: 0,
    subscription_required: false,
    preview_pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && pdf) {
      setFormData({
        title: pdf.title || '',
        description: pdf.description || '',
        category: pdf.category || '',
        subject: pdf.subject || '',
        is_free: pdf.is_free !== undefined ? pdf.is_free : true,
        file_url: pdf.file_url || '',
        file_size: pdf.file_size || 0,
        // Pricing fields
        price: pdf.price || 0,
        currency: pdf.currency || 'INR',
        discount_percentage: pdf.discount_percentage || 0,
        subscription_required: pdf.subscription_required || false,
        preview_pages: pdf.preview_pages || 0
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        subject: '',
        is_free: true,
        file_url: '',
        file_size: 0,
        // Pricing fields
        price: 0,
        currency: 'INR',
        discount_percentage: 0,
        subscription_required: false,
        preview_pages: 0
      });
    }
    setErrors({});
  }, [mode, pdf, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.file_url.trim()) {
      newErrors.file_url = 'File URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await api.post('/admin/pdfs', formData);
        toast.success('PDF created successfully');
      } else {
        await api.put(`/admin/pdfs/${pdf.id}`, formData);
        toast.success('PDF updated successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('PDF operation error:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${mode} PDF`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Upload New PDF' : 'Edit PDF'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter PDF title"
              />
            </div>
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Enter PDF description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category and Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.category ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Category</option>
                  <option value="Study Material">Study Material</option>
                  <option value="Previous Papers">Previous Papers</option>
                  <option value="Practice Sets">Practice Sets</option>
                  <option value="Notes">Notes</option>
                  <option value="Reference Books">Reference Books</option>
                  <option value="Sample Papers">Sample Papers</option>
                </select>
              </div>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="input-field pl-10"
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Current Affairs">Current Affairs</option>
                </select>
              </div>
            </div>
          </div>

          {/* File URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File URL *
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                name="file_url"
                value={formData.file_url}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.file_url ? 'border-red-500' : ''}`}
                placeholder="https://example.com/file.pdf"
              />
            </div>
            {errors.file_url && (
              <p className="text-red-500 text-sm mt-1">{errors.file_url}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Enter the direct URL to the PDF file
            </p>
          </div>

          {/* File Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Size (bytes)
            </label>
            <input
              type="number"
              name="file_size"
              value={formData.file_size}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="File size in bytes"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional: Enter file size in bytes for display purposes
            </p>
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Pricing Settings</h4>

            <div className="space-y-4">
              {/* Free/Paid Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_free"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_free" className="ml-2 block text-sm text-gray-700">
                  This PDF is free to access
                </label>
              </div>

              {/* Price and Currency (show only if not free) */}
              {!formData.is_free && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Discount Percentage (show only if not free) */}
              {!formData.is_free && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">Optional discount percentage (0-100)</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subscription Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="subscription_required"
                    id="subscription_required"
                    checked={formData.subscription_required}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="subscription_required" className="ml-2 block text-sm text-gray-700">
                    Requires subscription
                  </label>
                </div>

                {/* Preview Pages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Pages
                  </label>
                  <input
                    type="number"
                    name="preview_pages"
                    value={formData.preview_pages}
                    onChange={handleChange}
                    min="0"
                    className="input-field"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">Number of free preview pages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Upload PDF' : 'Update PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};