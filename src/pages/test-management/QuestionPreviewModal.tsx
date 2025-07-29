import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Question } from '../../services/testManagement';

interface QuestionPreviewModalProps {
  question: Question;
  onClose: () => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  onClose
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Question Preview</h2>
            <div className="flex items-center gap-2 mt-2">
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
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Question Content */}
        <div className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Question</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 mb-2">{question.question}</p>
              {question.question_gujarati && (
                <p className="text-gray-700 text-sm italic">
                  ગુજરાતી: {question.question_gujarati}
                </p>
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Answer Options</h3>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    option.option === question.correct_option
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium mr-3 ${
                      option.option === question.correct_option
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {option.option}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-900">{option.text}</p>
                      {option.text_gujarati && (
                        <p className="text-gray-600 text-sm mt-1 italic">
                          ગુજરાતી: {option.text_gujarati}
                        </p>
                      )}
                    </div>
                    {option.option === question.correct_option && (
                      <span className="ml-2 text-green-600 font-medium text-sm">✓ Correct</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Explanation</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-900 mb-2">{question.explanation}</p>
                {question.explanation_gujarati && (
                  <p className="text-gray-700 text-sm italic">
                    ગુજરાતી: {question.explanation_gujarati}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Topic:</span>
                  <span className="text-gray-600 ml-2">{question.topic || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Sub-topic:</span>
                  <span className="text-gray-600 ml-2">{question.sub_topic || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time Limit:</span>
                  <span className="text-gray-600 ml-2">
                    {question.time_limit ? `${question.time_limit} seconds` : 'No limit'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mandatory:</span>
                  <span className="text-gray-600 ml-2">{question.is_mandatory ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              {question.total_attempts > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Statistics</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Total Attempts:</span>
                      <span className="text-gray-600 ml-2">{question.total_attempts}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Success Rate:</span>
                      <span className="text-gray-600 ml-2">
                        {Math.round((question.correct_attempts / question.total_attempts) * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Avg Time:</span>
                      <span className="text-gray-600 ml-2">{Math.round(question.average_time)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreviewModal;