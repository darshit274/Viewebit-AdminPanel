import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Test {
  id: number;
  uuid: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  sub_category_id: number;
}

interface Question {
  id: number;
  uuid: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  test_id: number;
}

// API functions
const apiBaseUrl = 'http://localhost:5004/api/admin';

const questionsApi = {
  getTestQuestions: async (testUuid: string) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${testUuid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
  },

  createQuestion: async (testUuid: string, question: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    marks: number;
  }) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${testUuid}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(question)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateQuestion: async (uuid: string, question: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    marks: number;
  }) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/questions/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(question)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteQuestion: async (uuid: string) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/questions/${uuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
  }
};

const TestDetailPage: React.FC = () => {
  const { testUuid } = useParams<{ testUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    marks: 1
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['testQuestions', testUuid],
    queryFn: () => questionsApi.getTestQuestions(testUuid!),
    enabled: !!testUuid
  });

  const createMutation = useMutation({
    mutationFn: (question: {
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      explanation: string;
      marks: number;
    }) => questionsApi.createQuestion(testUuid!, question),
    onSuccess: () => {
      toast.success('Question created successfully');
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
      setShowModal(false);
      setFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        explanation: '',
        marks: 1
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create question');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: {
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      explanation: string;
      marks: number;
    }}) => questionsApi.updateQuestion(uuid, data),
    onSuccess: () => {
      toast.success('Question updated successfully');
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
      setShowModal(false);
      setEditingQuestion(null);
      setFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        explanation: '',
        marks: 1
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update question');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: questionsApi.deleteQuestion,
    onSuccess: () => {
      toast.success('Question deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete question');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestion) {
      updateMutation.mutate({ uuid: editingQuestion.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      marks: question.marks
    });
    setShowModal(true);
  };

  const handleDelete = (uuid: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteMutation.mutate(uuid);
    }
  };

  const getOptionClass = (option: string, correctAnswer: string) => {
    return option === correctAnswer ? 'text-green-600 font-medium' : 'text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading questions</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] })}
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const { test, questions } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/test-management" className="text-blue-600 hover:text-blue-800">
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800">
          Tests
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{test.title}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title} - Questions</h1>
            <p className="text-gray-600 mt-1">{test.description}</p>
            <div className="flex gap-4 text-sm text-gray-500 mt-1">
              <span>Duration: {test.duration_minutes} min</span>
              <span>Total Marks: {test.total_marks}</span>
              <span>Questions: {questions.length}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setFormData({
              question_text: '',
              option_a: '',
              option_b: '',
              option_c: '',
              option_d: '',
              correct_answer: 'A',
              explanation: '',
              marks: 1
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Question
        </button>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No questions found</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Create your first question
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.uuid} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Q{index + 1}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(question)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question.uuid)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-900 font-medium">{question.question_text}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('A', question.correct_answer)}`}>
                      {question.correct_answer === 'A' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">A.</span> {question.option_a}
                    </div>
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('B', question.correct_answer)}`}>
                      {question.correct_answer === 'B' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">B.</span> {question.option_b}
                    </div>
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('C', question.correct_answer)}`}>
                      {question.correct_answer === 'C' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">C.</span> {question.option_c}
                    </div>
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('D', question.correct_answer)}`}>
                      {question.correct_answer === 'D' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">D.</span> {question.option_d}
                    </div>
                  </div>
                  
                  {question.explanation && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingQuestion ? 'Edit Question' : 'Add Question'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text *
                </label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option A *
                  </label>
                  <input
                    type="text"
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option B *
                  </label>
                  <input
                    type="text"
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option C *
                  </label>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option D *
                  </label>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer *
                  </label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional explanation for the correct answer"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingQuestion(null);
                    setFormData({
                      question_text: '',
                      option_a: '',
                      option_b: '',
                      option_c: '',
                      option_d: '',
                      correct_answer: 'A',
                      explanation: '',
                      marks: 1
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDetailPage;