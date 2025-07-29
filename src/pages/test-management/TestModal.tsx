import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { TestManagementService, TestSeries, Test } from '../../services/testManagement';

interface TestModalProps {
  series: TestSeries;
  test?: Test | null;
  isEditMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  title_gujarati: string;
  description: string;
  description_gujarati: string;
  test_type: 'practice' | 'mock' | 'previous_year' | 'sectional';
  duration_minutes: number;
  total_questions: number;
  max_marks: number;
  passing_marks: number;
  negative_marking: boolean;
  negative_marks_per_question: string;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_results_immediately: boolean;
  show_correct_answers: boolean;
  allow_question_review: boolean;
  allow_answer_change: boolean;
  instructions: string;
  instructions_gujarati: string;
  is_free: boolean;
  max_attempts: number;
  display_order: number;
  is_active: boolean;
}

export const TestModal: React.FC<TestModalProps> = ({
  series,
  test,
  isEditMode,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    title_gujarati: '',
    description: '',
    description_gujarati: '',
    test_type: 'practice',
    duration_minutes: 60,
    total_questions: 10,
    max_marks: 10,
    passing_marks: 5,
    negative_marking: false,
    negative_marks_per_question: '0.25',
    randomize_questions: false,
    randomize_options: false,
    show_results_immediately: true,
    show_correct_answers: true,
    allow_question_review: true,
    allow_answer_change: true,
    instructions: '',
    instructions_gujarati: '',
    is_free: series.is_free,
    max_attempts: series.max_attempts_per_test || 3,
    display_order: 1,
    is_active: true
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Populate form with existing data if editing
  useEffect(() => {
    if (isEditMode && test) {
      setFormData({
        title: test.title || '',
        title_gujarati: test.title_gujarati || '',
        description: test.description || '',
        description_gujarati: test.description_gujarati || '',
        test_type: test.test_type || 'practice',
        duration_minutes: test.duration_minutes || 60,
        total_questions: test.total_questions || 10,
        max_marks: test.max_marks || 10,
        passing_marks: test.passing_marks || 5,
        negative_marking: test.negative_marking || false,
        negative_marks_per_question: test.negative_marks_per_question || '0.25',
        randomize_questions: test.randomize_questions || false,
        randomize_options: test.randomize_options || false,
        show_results_immediately: test.show_results_immediately !== false,
        show_correct_answers: test.show_correct_answers !== false,
        allow_question_review: test.allow_question_review !== false,
        allow_answer_change: test.allow_answer_change !== false,
        instructions: test.instructions || '',
        instructions_gujarati: test.instructions_gujarati || '',
        is_free: test.is_free !== false,
        max_attempts: test.max_attempts || 3,
        display_order: test.display_order || 1,
        is_active: test.is_active !== false
      });
    }
  }, [isEditMode, test]);

  const createMutation = useMutation({
    mutationFn: (data: any) => TestManagementService.createTest(series.id, data),
    onSuccess: () => {
      toast.success('Test created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create test');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => TestManagementService.updateTest(test!.id, data),
    onSuccess: () => {
      toast.success('Test updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update test');
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

    if (!formData.test_type) {
      newErrors.test_type = 'Test type is required';
    }

    if (!formData.duration_minutes || formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be greater than 0';
    }

    if (!formData.total_questions || formData.total_questions <= 0) {
      newErrors.total_questions = 'Total questions must be greater than 0';
    }

    if (!formData.max_marks || formData.max_marks <= 0) {
      newErrors.max_marks = 'Max marks must be greater than 0';
    }

    if (formData.passing_marks < 0 || formData.passing_marks > formData.max_marks) {
      newErrors.passing_marks = 'Passing marks must be between 0 and max marks';
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
      negative_marks_per_question: formData.negative_marking ? formData.negative_marks_per_question : '0'
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
              {isEditMode ? 'Edit Test' : 'Create Test'}
            </h2>
            <p className="text-gray-600 mt-1">
              Series: {series.title}
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
                  placeholder="Enter test title"
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
                  placeholder="Enter test description"
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

          {/* Test Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type *
                </label>
                <select
                  value={formData.test_type}
                  onChange={(e) => handleInputChange('test_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.test_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="practice">Practice Test</option>
                  <option value="mock">Mock Test</option>
                  <option value="previous_year">Previous Year</option>
                  <option value="sectional">Sectional Test</option>
                </select>
                {errors.test_type && <p className="text-red-500 text-sm mt-1">{errors.test_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="60"
                />
                {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Questions *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_questions}
                  onChange={(e) => handleInputChange('total_questions', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.total_questions ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10"
                />
                {errors.total_questions && <p className="text-red-500 text-sm mt-1">{errors.total_questions}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Marks *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_marks}
                  onChange={(e) => handleInputChange('max_marks', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.max_marks ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10"
                />
                {errors.max_marks && <p className="text-red-500 text-sm mt-1">{errors.max_marks}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Marks
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.max_marks}
                  value={formData.passing_marks}
                  onChange={(e) => handleInputChange('passing_marks', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.passing_marks ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="5"
                />
                {errors.passing_marks && <p className="text-red-500 text-sm mt-1">{errors.passing_marks}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_attempts}
                  onChange={(e) => handleInputChange('max_attempts', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Negative Marking */}
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="negative_marking"
                  checked={formData.negative_marking}
                  onChange={(e) => handleInputChange('negative_marking', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="negative_marking" className="ml-2 text-sm font-medium text-gray-700">
                  Enable negative marking
                </label>
              </div>

              {formData.negative_marking && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Marks (per question)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={formData.negative_marks_per_question}
                    onChange={(e) => handleInputChange('negative_marks_per_question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.25"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Test Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="randomize_questions"
                  checked={formData.randomize_questions}
                  onChange={(e) => handleInputChange('randomize_questions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="randomize_questions" className="ml-2 text-sm font-medium text-gray-700">
                  Randomize question order
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="randomize_options"
                  checked={formData.randomize_options}
                  onChange={(e) => handleInputChange('randomize_options', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="randomize_options" className="ml-2 text-sm font-medium text-gray-700">
                  Randomize answer options
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_results_immediately"
                  checked={formData.show_results_immediately}
                  onChange={(e) => handleInputChange('show_results_immediately', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_results_immediately" className="ml-2 text-sm font-medium text-gray-700">
                  Show results immediately after test completion
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_correct_answers"
                  checked={formData.show_correct_answers}
                  onChange={(e) => handleInputChange('show_correct_answers', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_correct_answers" className="ml-2 text-sm font-medium text-gray-700">
                  Show correct answers in results
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_question_review"
                  checked={formData.allow_question_review}
                  onChange={(e) => handleInputChange('allow_question_review', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allow_question_review" className="ml-2 text-sm font-medium text-gray-700">
                  Allow question review during test
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_answer_change"
                  checked={formData.allow_answer_change}
                  onChange={(e) => handleInputChange('allow_answer_change', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allow_answer_change" className="ml-2 text-sm font-medium text-gray-700">
                  Allow changing answers during test
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => handleInputChange('is_free', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_free" className="ml-2 text-sm font-medium text-gray-700">
                  Free test (no subscription required)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                  Active (visible to students)
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
                  placeholder="Enter instructions for students taking this test"
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
                  placeholder="આ ટેસ્ટ લેતા વિદ્યાર્થીઓ માટે સૂચનાઓ"
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
              {isLoading ? 'Saving...' : (isEditMode ? 'Update Test' : 'Create Test')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestModal;