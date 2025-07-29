import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { TestManagementService, Test, Question } from '../../services/testManagement';
import { QuestionModal } from './QuestionModal';
import { QuestionPreviewModal } from './QuestionPreviewModal';
import { Pagination } from '../../components/common/Pagination';

interface QuestionsViewProps {
  test: Test;
}

export const QuestionsView: React.FC<QuestionsViewProps> = ({ test }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  const { data: questionsData, isLoading, error } = useQuery({
    queryKey: ['questions', test.id, currentPage, searchQuery, filterDifficulty, filterSubject],
    queryFn: () => TestManagementService.getQuestionsForTest(test.id, {
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      difficulty: filterDifficulty || undefined,
      subject: filterSubject || undefined
    }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => TestManagementService.deleteQuestion(id),
    onSuccess: () => {
      toast.success('Question deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete question');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handlePreviewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowPreviewModal(true);
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (confirm(`Are you sure you want to delete this question? This action cannot be undone.`)) {
      deleteQuestionMutation.mutate(question.id);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedQuestion(null);
    setIsEditMode(false);
  };

  const handlePreviewModalClose = () => {
    setShowPreviewModal(false);
    setSelectedQuestion(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil((questionsData?.data?.total || 0) / itemsPerPage);
  const questions = questionsData?.data?.questions || [];

  // Get unique subjects for filter
  const subjects = Array.from(new Set(questions.map((q: Question) => q.subject).filter(Boolean)));

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading questions</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['questions'] })}
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
            Questions - {test.title}
          </h2>
          <p className="text-gray-600 mt-1">
            Manage questions for this test ({questions.length} of {test.total_questions} questions)
          </p>
          {questions.length < test.total_questions && (
            <p className="text-orange-600 text-sm mt-1">
              ⚠️ This test needs {test.total_questions - questions.length} more questions
            </p>
          )}
        </div>
        <button
          onClick={handleCreateQuestion}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-4 flex-1">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
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

        <div className="flex gap-4">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Questions List */}
      {!isLoading && (
        <>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery || filterDifficulty || filterSubject
                  ? 'No questions found matching your criteria.'
                  : 'No questions found for this test.'}
              </p>
              <button
                onClick={handleCreateQuestion}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question: Question, index: number) => (
                <div
                  key={question.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-medium text-gray-500">
                          Q{((currentPage - 1) * itemsPerPage) + index + 1}.
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty.toUpperCase()}
                          </span>
                          {question.subject && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {question.subject}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {question.marks} marks
                          </span>
                          {question.is_mandatory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Mandatory
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-3">
                        <p className="text-gray-900 font-medium mb-1">
                          {truncateText(question.question)}
                        </p>
                        {question.question_gujarati && (
                          <p className="text-gray-700 text-sm">
                            {truncateText(question.question_gujarati)}
                          </p>
                        )}
                      </div>

                      {/* Options Preview */}
                      <div className="mb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {question.options.slice(0, 4).map((option, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded border ${
                                option.option === question.correct_option
                                  ? 'border-green-300 bg-green-50 text-green-800'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <span className="font-medium">{option.option}.</span> {truncateText(option.text, 50)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Statistics */}
                      {question.total_attempts > 0 && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Attempts: {question.total_attempts}</span>
                          <span>
                            Success Rate: {Math.round((question.correct_attempts / question.total_attempts) * 100)}%
                          </span>
                          <span>Avg Time: {Math.round(question.average_time)}s</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => handlePreviewQuestion(question)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                        title="Preview Question"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
                        title="Edit Question"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(question)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                        title="Delete Question"
                        disabled={deleteQuestionMutation.isPending}
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

      {/* Modals */}
      {showModal && (
        <QuestionModal
          test={test}
          question={selectedQuestion}
          isEditMode={isEditMode}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose();
            queryClient.invalidateQueries({ queryKey: ['questions'] });
          }}
        />
      )}

      {showPreviewModal && selectedQuestion && (
        <QuestionPreviewModal
          question={selectedQuestion}
          onClose={handlePreviewModalClose}
        />
      )}
    </div>
  );
};

export default QuestionsView;