import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, EyeIcon, TrashIcon, PencilIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { TestManagementService, TestSeries, Test } from '../../services/testManagement';
import { TestModal } from './TestModal';
import { Pagination } from '../../components/common/Pagination';

interface TestsViewProps {
  series: TestSeries;
  onTestSelect: (test: Test) => void;
}

export const TestsView: React.FC<TestsViewProps> = ({
  series,
  onTestSelect
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  const { data: testsData, isLoading, error } = useQuery({
    queryKey: ['tests', series.id, currentPage, searchQuery, filterType],
    queryFn: () => TestManagementService.getTestsForSeries(series.id, {
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      test_type: filterType || undefined
    }),
  });

  const deleteTestMutation = useMutation({
    mutationFn: (id: number) => TestManagementService.deleteTest(id),
    onSuccess: () => {
      toast.success('Test deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete test');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCreateTest = () => {
    setSelectedTest(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditTest = (test: Test) => {
    setSelectedTest(test);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteTest = async (test: Test) => {
    if (confirm(`Are you sure you want to delete "${test.title}"? This action cannot be undone.`)) {
      deleteTestMutation.mutate(test.id);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTest(null);
    setIsEditMode(false);
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'practice': return 'bg-blue-100 text-blue-800';
      case 'mock': return 'bg-green-100 text-green-800';
      case 'previous_year': return 'bg-purple-100 text-purple-800';
      case 'sectional': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalPages = Math.ceil((testsData?.data?.total || 0) / itemsPerPage);
  const tests = testsData?.data?.tests || [];

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading tests</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['tests'] })}
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
            Tests - {series.title}
          </h2>
          <p className="text-gray-600 mt-1">
            Manage tests for this series
          </p>
        </div>
        <button
          onClick={handleCreateTest}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Test
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-4 flex-1">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tests..."
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

        <div className="sm:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="practice">Practice</option>
            <option value="mock">Mock Test</option>
            <option value="previous_year">Previous Year</option>
            <option value="sectional">Sectional</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tests List */}
      {!isLoading && (
        <>
          {tests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery || filterType 
                  ? 'No tests found matching your criteria.' 
                  : 'No tests found for this series.'}
              </p>
              <button
                onClick={handleCreateTest}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create First Test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test: Test) => (
                <div
                  key={test.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {test.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTestTypeColor(test.test_type)}`}>
                            {test.test_type.replace('_', ' ').toUpperCase()}
                          </span>
                          {test.is_free && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Free
                            </span>
                          )}
                          {test.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {test.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {test.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="font-medium text-gray-900">Duration:</span>
                          <span className="text-gray-600 ml-1">{formatDuration(test.duration_minutes)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Questions:</span>
                          <span className="text-gray-600 ml-1">{test.actualQuestionsCount || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Max Marks:</span>
                          <span className="text-gray-600 ml-1">{test.max_marks}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Attempts:</span>
                          <span className="text-gray-600 ml-1">{test.totalAttempts || 0}</span>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        {test.negative_marking && (
                          <span>Negative Marking: -{test.negative_marks_per_question}</span>
                        )}
                        {test.max_attempts && (
                          <span>Max Attempts: {test.max_attempts}</span>
                        )}
                        {test.randomize_questions && (
                          <span>Randomized Questions</span>
                        )}
                        {test.show_results_immediately && (
                          <span>Instant Results</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => onTestSelect(test)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
                        title="Manage Questions"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Questions
                      </button>

                      <button
                        onClick={() => handleEditTest(test)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                        title="Edit Test"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTest(test)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                        title="Delete Test"
                        disabled={deleteTestMutation.isPending}
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
        <TestModal
          series={series}
          test={selectedTest}
          isEditMode={isEditMode}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose();
            queryClient.invalidateQueries({ queryKey: ['tests'] });
          }}
        />
      )}
    </div>
  );
};

export default TestsView;