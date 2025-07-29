import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, EyeIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { TestManagementService, ExamCategory, TestSeries } from '../../services/testManagement';
import { TestSeriesModal } from './TestSeriesModal';
import { Pagination } from '../../components/common/Pagination';

interface TestSeriesViewProps {
  category: ExamCategory;
  onSeriesSelect: (series: TestSeries) => void;
}

export const TestSeriesView: React.FC<TestSeriesViewProps> = ({
  category,
  onSeriesSelect
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<TestSeries | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  const { data: seriesData, isLoading, error } = useQuery({
    queryKey: ['test-series', category.id, currentPage, searchQuery],
    queryFn: () => TestManagementService.getTestSeries({
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      category_id: category.id
    }),
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id: number) => TestManagementService.deleteTestSeries(id),
    onSuccess: () => {
      toast.success('Test series deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['test-series'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete test series');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: (id: number) => TestManagementService.togglePublishStatus(id),
    onSuccess: () => {
      toast.success('Publish status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['test-series'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update publish status');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCreateSeries = () => {
    setSelectedSeries(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditSeries = (series: TestSeries) => {
    setSelectedSeries(series);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteSeries = async (series: TestSeries) => {
    if (confirm(`Are you sure you want to delete "${series.title}"? This action cannot be undone.`)) {
      deleteSeriesMutation.mutate(series.id);
    }
  };

  const handleTogglePublish = (series: TestSeries) => {
    const action = series.is_published ? 'unpublish' : 'publish';
    if (confirm(`Are you sure you want to ${action} "${series.title}"?`)) {
      togglePublishMutation.mutate(series.id);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSeries(null);
    setIsEditMode(false);
  };

  const totalPages = Math.ceil((seriesData?.data?.total || 0) / itemsPerPage);
  const series = seriesData?.data?.testSeries || [];

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading test series</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['test-series'] })}
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Test Series - {category.name}
          </h2>
          <p className="text-gray-600 mt-1">
            Manage test series for {category.name} category
          </p>
        </div>
        <button
          onClick={handleCreateSeries}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Test Series
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search test series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Test Series List */}
      {!isLoading && (
        <>
          {series.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No test series found matching your search.' : 'No test series found for this category.'}
              </p>
              <button
                onClick={handleCreateSeries}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create First Test Series
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {series.map((seriesItem: TestSeries) => (
                <div
                  key={seriesItem.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {seriesItem.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {seriesItem.is_published ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              Draft
                            </span>
                          )}
                          {seriesItem.is_featured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          )}
                          {seriesItem.is_free && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Free
                            </span>
                          )}
                        </div>
                      </div>

                      {seriesItem.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {seriesItem.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Price:</span>
                          <span className="text-gray-600 ml-1">
                            {seriesItem.is_free ? 'Free' : `₹${seriesItem.price}`}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Tests:</span>
                          <span className="text-gray-600 ml-1">{seriesItem.actualTestsCount || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Questions:</span>
                          <span className="text-gray-600 ml-1">{seriesItem.actualQuestionsCount || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Enrollments:</span>
                          <span className="text-gray-600 ml-1">{seriesItem.total_enrollments}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => onSeriesSelect(seriesItem)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
                        title="View Tests"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Tests
                      </button>

                      <button
                        onClick={() => handleEditSeries(seriesItem)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                        title="Edit Series"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleTogglePublish(seriesItem)}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          seriesItem.is_published
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={seriesItem.is_published ? 'Unpublish' : 'Publish'}
                        disabled={togglePublishMutation.isPending}
                      >
                        {seriesItem.is_published ? 'Unpublish' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleDeleteSeries(seriesItem)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                        title="Delete Series"
                        disabled={deleteSeriesMutation.isPending}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <TestSeriesModal
          category={category}
          series={selectedSeries}
          isEditMode={isEditMode}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose();
            queryClient.invalidateQueries({ queryKey: ['test-series'] });
          }}
        />
      )}
    </div>
  );
};

export default TestSeriesView;