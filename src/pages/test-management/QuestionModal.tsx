import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Test, Question } from '../../services/testManagement';

interface QuestionModalProps {
  test: Test;
  question?: Question | null;
  isEditMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  test,
  question,
  isEditMode,
  onClose,
  onSuccess
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Question' : 'Add Question'}
            </h2>
            <p className="text-gray-600 mt-1">
              Test: {test.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Question Management functionality coming soon!</p>
            <p className="text-sm text-gray-400">
              This will include:
              <br />• Rich text editor for questions
              <br />• Multiple choice options management
              <br />• Image/media upload support
              <br />• Gujarati translation fields
              <br />• Difficulty and subject categorization
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;