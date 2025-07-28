import React, { useState, useEffect } from 'react';
import { X, Play, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { questionsService, Question } from '../../services/questions';
import { testSeriesService } from '../../services/testSeries';
import toast from 'react-hot-toast';

interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: {
    id: string;
    title: string;
    description?: string;
    duration_minutes?: number;
    total_marks?: number;
    pass_percentage?: number;
    negative_marking?: boolean;
    instructions?: string;
    total_questions?: number;
  } | null;
}

export const TestPreviewModal: React.FC<TestPreviewModalProps> = ({
  isOpen,
  onClose,
  test
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isOpen && test) {
      loadQuestions();
      if (test.duration_minutes) {
        setTimeRemaining(test.duration_minutes * 60); // Convert minutes to seconds
      }
    }
  }, [isOpen, test]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            handleSubmitTest();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const loadQuestions = async () => {
    if (!test) return;
    
    setLoading(true);
    try {
      const response = await testSeriesService.getTestSeriesQuestions(test.id);
      if (response.success && response.data) {
        setQuestions(response.data);
      } else {
        setQuestions([]);
        toast.error('No questions found for this test');
      }
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load test questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleStartTest = () => {
    setIsActive(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleSubmitTest = () => {
    setIsActive(false);
    setShowResults(true);
  };

  const handleResetTest = () => {
    setIsActive(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    if (test?.duration_minutes) {
      setTimeRemaining(test.duration_minutes * 60);
    }
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;

    questions.forEach(question => {
      totalMarks += question.marks;
      const userAnswer = answers[question.id];
      
      if (userAnswer !== undefined) {
        // Find correct options from the question options
        const correctOptions = question.options.filter(option => option.is_correct);
        const correctAnswerTexts = correctOptions.map(option => option.option_text);
        
        let isCorrect = false;
        if (question.question_type === 'MULTIPLE_CHOICE' && Array.isArray(userAnswer)) {
          // For multiple choice, check if all selected answers are correct
          isCorrect = userAnswer.length === correctAnswerTexts.length &&
                     userAnswer.every(answer => correctAnswerTexts.includes(answer as string));
        } else {
          // For single choice, true/false, etc.
          isCorrect = correctAnswerTexts.includes(userAnswer as string);
        }
        
        if (isCorrect) {
          correctAnswers++;
          obtainedMarks += question.marks;
        } else if (test?.negative_marking && question.negative_marks) {
          obtainedMarks -= question.negative_marks;
        }
      }
    });

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const passed = test?.pass_percentage ? percentage >= test.pass_percentage : false;

    return {
      correctAnswers,
      totalQuestions: questions.length,
      obtainedMarks: Math.max(0, obtainedMarks),
      totalMarks,
      percentage: Math.max(0, percentage),
      passed
    };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: Question, index: number) => {
    const userAnswer = answers[question.id];
    
    return (
      <div key={question.id} className="space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Question {index + 1} of {questions.length}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Marks: {question.marks}</span>
            {question.negative_marks && (
              <span>Negative: -{question.negative_marks}</span>
            )}
          </div>
        </div>
        
        <p className="text-gray-800 leading-relaxed">{question.question_text}</p>
        
        <div className="space-y-3">
          {(question.question_type === 'SINGLE_CHOICE' || question.question_type === 'TRUE_FALSE') && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.option_text}
                    checked={userAnswer === option.option_text}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={!isActive}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">{option.option_text}</span>
                </label>
              ))}
            </div>
          )}
          
          {question.question_type === 'MULTIPLE_CHOICE' && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option.option_text}
                    checked={Array.isArray(userAnswer) && userAnswer.includes(option.option_text)}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(userAnswer) ? userAnswer : [];
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...currentAnswers, option.option_text]);
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter(ans => ans !== option.option_text));
                      }
                    }}
                    disabled={!isActive}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">{option.option_text}</span>
                </label>
              ))}
            </div>
          )}
          
          {question.question_type === 'FILL_IN_THE_BLANK' && (
            <textarea
              value={userAnswer as string || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={!isActive}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your answer..."
              rows={3}
            />
          )}
        </div>
        
        {showResults && question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
            <p className="text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const results = calculateResults();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            results.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {results.passed ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {results.passed ? 'Congratulations!' : 'Test Completed'}
          </h3>
          <p className="text-gray-600">
            {results.passed ? 'You have passed the test!' : 'Better luck next time!'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{results.correctAnswers}</p>
            <p className="text-sm text-gray-600">Correct Answers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{results.totalQuestions}</p>
            <p className="text-sm text-gray-600">Total Questions</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{results.obtainedMarks.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Marks Obtained</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{results.percentage.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Percentage</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleResetTest}
            className="flex-1 btn-secondary inline-flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Test
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {test.title} - Preview
            </h2>
            {isActive && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg font-medium mb-2">No questions found</p>
              <p className="text-sm">This test doesn't have any questions yet.</p>
            </div>
          ) : showResults ? (
            <div className="p-6">
              {renderResults()}
            </div>
          ) : !isActive ? (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{test.title}</h3>
                {test.description && (
                  <p className="text-gray-600 mb-6">{test.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                  <p className="text-sm text-gray-600">Questions</p>
                </div>
                {test.duration_minutes && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{test.duration_minutes}</p>
                    <p className="text-sm text-gray-600">Minutes</p>
                  </div>
                )}
                {test.total_marks && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{test.total_marks}</p>
                    <p className="text-sm text-gray-600">Total Marks</p>
                  </div>
                )}
              </div>
              
              {test.instructions && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                  <p className="text-blue-800">{test.instructions}</p>
                </div>
              )}
              
              <div className="text-center">
                <button
                  onClick={handleStartTest}
                  className="btn-primary inline-flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Test Preview
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {renderQuestion(questions[currentQuestionIndex], currentQuestionIndex)}
              
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                
                <span className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} of {questions.length}
                </span>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    className="btn-primary"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    className="btn-primary inline-flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};