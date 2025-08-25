import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PDFEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdf: any;
  courses: any[];
  testSeries: any[];
  examTypes: any[];
  onUpdate: () => void;
}

export const PDFEditModal: React.FC<PDFEditModalProps> = ({
  isOpen,
  onClose,
  pdf,
  courses,
  testSeries,
  examTypes,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    access_level: 'free',
    test_series_id: '',
    exam_type_id: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pdf && isOpen) {
      setFormData({
        title: pdf.title || '',
        description: pdf.description || '',
        course_id: pdf.course_id?.toString() || '',
        access_level: pdf.access_level || 'free',
        test_series_id: pdf.test_series_id?.toString() || '',
        exam_type_id: pdf.exam_type_id?.toString() || '',
        tags: pdf.tags ? (Array.isArray(pdf.tags) ? pdf.tags.join(', ') : pdf.tags) : ''
      });
    }
  }, [pdf, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdf?.id) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        course_id: formData.course_id ? parseInt(formData.course_id) : null,
        test_series_id: formData.test_series_id || null,
        exam_type_id: formData.exam_type_id ? parseInt(formData.exam_type_id) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null
      };

      await api.put(`/admin/pdfs/${pdf.id}`, updateData);
      toast.success('PDF updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Update PDF error:', error);
      toast.error(error.response?.data?.message || 'Failed to update PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen || !pdf) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit PDF</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter PDF title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter PDF description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select course</option>
                {Array.isArray(courses) && courses.length > 0 ? courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                )) : (
                  <option value="" disabled>Loading courses...</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Series
              </label>
              <select
                name="test_series_id"
                value={formData.test_series_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select test series</option>
                {Array.isArray(testSeries) && testSeries.length > 0 ? testSeries.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.title}
                  </option>
                )) : (
                  <option value="" disabled>Loading test series...</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                name="exam_type_id"
                value={formData.exam_type_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select exam type</option>
                {Array.isArray(examTypes) && examTypes.length > 0 ? examTypes.map((examType) => (
                  <option key={examType.id} value={examType.id}>
                    {examType.name}
                  </option>
                )) : (
                  <option value="" disabled>Loading exam types...</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter tags separated by commas"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple tags with commas (e.g., physics, chemistry, biology)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};