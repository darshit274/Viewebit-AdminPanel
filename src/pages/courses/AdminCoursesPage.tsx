import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { courseManagementService, AdminCourseListItem } from '../../services/courseManagement';

const STATUS_BADGE: Record<AdminCourseListItem['status'], string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
};

const PRICING_MODE_LABELS: Record<'school' | 'private_educator' | 'coaching_center', string> = {
  school: 'School (always free)',
  private_educator: 'Private Educator (educator sets price)',
  coaching_center: 'Coaching Center (admin sets price)',
};

interface SetPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: AdminCourseListItem | null;
  onSuccess: () => void;
}

const SetPriceModal: React.FC<SetPriceModalProps> = ({ isOpen, onClose, course, onSuccess }) => {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      setPrice(course.testSeries?.price !== undefined && course.testSeries?.price !== null ? String(course.testSeries.price) : '');
    }
  }, [isOpen, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setLoading(true);
    try {
      await courseManagementService.setCoursePrice(course.uuid, price ? parseFloat(price) : 0);
      toast.success('Price updated');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set price');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Set Price — {course.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹)
              <span className="text-xs text-gray-500 ml-1">(0 for a free course)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="border-t pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Saving...' : 'Save Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceModalCourse, setPriceModalCourse] = useState<AdminCourseListItem | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await courseManagementService.getCourses();
      setCourses(response.data || []);
    } catch (error) {
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <p className="text-gray-600">Every course created by an educator, across all institutions</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {courses.map((course) => {
              const pricingMode = course.educator?.institution?.pricing_mode || 'coaching_center';
              return (
                <div key={course.uuid} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary-50">
                        <BookOpen className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-600">
                          {course.educator?.name || 'Unknown educator'} · {course.educator?.institution?.name || 'No institution'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[course.status]}`}>
                            {course.status}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {PRICING_MODE_LABELS[pricingMode as keyof typeof PRICING_MODE_LABELS]}
                          </span>
                          <span className="text-sm text-gray-500">
                            {course.testSeries
                              ? course.testSeries.pricing_type === 'paid'
                                ? `₹${course.testSeries.price}`
                                : 'Free'
                              : 'No pricing set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {pricingMode === 'coaching_center' && (
                      <button
                        onClick={() => setPriceModalCourse(course)}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-md hover:bg-primary-50"
                      >
                        Set Price
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SetPriceModal
        isOpen={!!priceModalCourse}
        onClose={() => setPriceModalCourse(null)}
        course={priceModalCourse}
        onSuccess={loadCourses}
      />
    </div>
  );
};

export default AdminCoursesPage;
