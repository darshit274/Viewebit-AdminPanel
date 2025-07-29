import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { TestManagementService, ExamCategory, TestSeries } from '../../services/testManagement';

interface TestSeriesModalProps {
  category: ExamCategory;
  series?: TestSeries | null;
  isEditMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  title_gujarati: string;
  description: string;
  description_gujarati: string;
  price: string;
  original_price: string;
  currency: string;
  is_free: boolean;
  free_test_count: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  access_duration_days: number;
  max_attempts_per_test: number;
  supports_pause_resume: boolean;
  supports_multilanguage: boolean;
  has_negative_marking: boolean;
  negative_marks: string;
  instructions: string;
  instructions_gujarati: string;
  is_featured: boolean;
  is_published: boolean;
}

export const TestSeriesModal: React.FC<TestSeriesModalProps> = ({
  category,
  series,
  isEditMode,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    title_gujarati: '',
    description: '',
    description_gujarati: '',
    price: '0',
    original_price: '0',
    currency: 'INR',
    is_free: true,
    free_test_count: 0,
    difficulty_level: 'mixed',
    access_duration_days: 365,
    max_attempts_per_test: 3,
    supports_pause_resume: true,
    supports_multilanguage: true,
    has_negative_marking: false,
    negative_marks: '0',
    instructions: '',
    instructions_gujarati: '',
    is_featured: false,
    is_published: false
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Populate form with existing data if editing
  useEffect(() => {
    if (isEditMode && series) {
      setFormData({
        title: series.title || '',
        title_gujarati: series.title_gujarati || '',
        description: series.description || '',
        description_gujarati: series.description_gujarati || '',
        price: series.price || '0',
        original_price: series.original_price || '0',
        currency: series.currency || 'INR',
        is_free: series.is_free,
        free_test_count: series.free_test_count || 0,
        difficulty_level: series.difficulty_level || 'mixed',
        access_duration_days: series.access_duration_days || 365,
        max_attempts_per_test: series.max_attempts_per_test || 3,
        supports_pause_resume: series.supports_pause_resume,
        supports_multilanguage: series.supports_multilanguage,
        has_negative_marking: series.has_negative_marking,
        negative_marks: series.negative_marks || '0',
        instructions: series.instructions || '',
        instructions_gujarati: series.instructions_gujarati || '',
        is_featured: series.is_featured,
        is_published: series.is_published
      });
    }
  }, [isEditMode, series]);

  const createMutation = useMutation({
    mutationFn: (data: any) => TestManagementService.createTestSeries(data),
    onSuccess: () => {
      toast.success('Test series created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create test series');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => TestManagementService.updateTestSeries(series!.id, data),
    onSuccess: () => {
      toast.success('Test series updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update test series');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.is_free) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Price must be greater than 0 for paid series';
      }
    }

    if (!formData.difficulty_level) {
      newErrors.difficulty_level = 'Difficulty level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      category_id: category.id,
      price: formData.is_free ? '0' : formData.price,
      original_price: formData.is_free ? '0' : formData.original_price,
      negative_marks: formData.has_negative_marking ? formData.negative_marks : '0'
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Test Series' : 'Create Test Series'}
            </h2>
            <p className="text-gray-600 mt-1">
              Category: {category.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (English) *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter series title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Gujarati)
                </label>
                <input
                  type="text"
                  value={formData.title_gujarati}
                  onChange={(e) => handleInputChange('title_gujarati', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ગુજરાતી શીર્ષક"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (English)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter series description"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Gujarati)
                </label>
                <textarea
                  value={formData.description_gujarati}
                  onChange={(e) => handleInputChange('description_gujarati', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ગુજરાતી વર્ણન"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => handleInputChange('is_free', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_free" className="ml-2 text-sm font-medium text-gray-700">
                  This is a free test series
                </label>
              </div>

              {!formData.is_free && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => handleInputChange('original_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Test Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.free_test_count}
                  onChange={(e) => handleInputChange('free_test_count', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of free tests in this series"
                />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level *
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.difficulty_level ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                  <option value="mixed">Mixed</option>
                </select>
                {errors.difficulty_level && <p className="text-red-500 text-sm mt-1">{errors.difficulty_level}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.access_duration_days}
                  onChange={(e) => handleInputChange('access_duration_days', parseInt(e.target.value) || 365)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts Per Test
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_attempts_per_test}
                  onChange={(e) => handleInputChange('max_attempts_per_test', parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="supports_pause_resume"
                  checked={formData.supports_pause_resume}
                  onChange={(e) => handleInputChange('supports_pause_resume', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="supports_pause_resume" className="ml-2 text-sm font-medium text-gray-700">
                  Support pause and resume functionality
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="supports_multilanguage"
                  checked={formData.supports_multilanguage}
                  onChange={(e) => handleInputChange('supports_multilanguage', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="supports_multilanguage" className="ml-2 text-sm font-medium text-gray-700">
                  Support multiple languages (English + Gujarati)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has_negative_marking"
                  checked={formData.has_negative_marking}
                  onChange={(e) => handleInputChange('has_negative_marking', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="has_negative_marking" className="ml-2 text-sm font-medium text-gray-700">
                  Enable negative marking
                </label>
              </div>

              {formData.has_negative_marking && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Marks (per question)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={formData.negative_marks}
                    onChange={(e) => handleInputChange('negative_marks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.25"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-gray-700">
                  Featured test series
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 text-sm font-medium text-gray-700">
                  Publish immediately
                </label>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (English)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter instructions for students"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (Gujarati)
                </label>
                <textarea
                  value={formData.instructions_gujarati}
                  onChange={(e) => handleInputChange('instructions_gujarati', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="વિદ્યાર્થીઓ માટે સૂચનાઓ"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (isEditMode ? 'Update Series' : 'Create Series')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestSeriesModal;