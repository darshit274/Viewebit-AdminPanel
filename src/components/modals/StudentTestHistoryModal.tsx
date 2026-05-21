import React, { useEffect, useState } from 'react';
import { X, Activity, CheckCircle, Clock, Mail, Phone, Calendar, Trophy, Layers, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { testAttemptsService, StudentHistoryResponse, AttemptStatus } from '../../services/testAttempts';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDate } from '../../lib/utils';

const STATUS_BADGE: Record<AttemptStatus, { label: string; className: string }> = {
  active:    { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  paused:    { label: 'Paused',      className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  completed: { label: 'Completed',   className: 'bg-green-100 text-green-800 border border-green-200' },
  expired:   { label: 'Expired',     className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  cancelled: { label: 'Cancelled',   className: 'bg-red-100 text-red-800 border border-red-200' },
};

const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
};

interface Props {
  isOpen: boolean;
  studentUuid: string | null;
  onClose: () => void;
}

export const StudentTestHistoryModal: React.FC<Props> = ({ isOpen, studentUuid, onClose }) => {
  const [data, setData] = useState<StudentHistoryResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentUuid) return;
    setData(null);
    setError(null);
    setLoading(true);
    testAttemptsService
      .getStudentHistory(studentUuid)
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError('Failed to load student history');
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Failed to load student history';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [isOpen, studentUuid]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Student Test History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="py-16 text-center px-6">
              <p className="text-red-600">{error}</p>
            </div>
          ) : !data ? null : (
            <div className="p-6 space-y-6">
              {/* Student info card */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{data.student.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-700">
                      <a href={`mailto:${data.student.email}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Mail className="h-4 w-4" /> {data.student.email}
                      </a>
                      {data.student.phone && (
                        <a href={`tel:${data.student.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                          <Phone className="h-4 w-4" /> {data.student.phone}
                        </a>
                      )}
                      {data.student.signedUpAt && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-4 w-4" /> Joined {formatDate(data.student.signedUpAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.student.isEmailVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Email Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Not Verified
                      </span>
                    )}
                    {data.student.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SummaryStat icon={<Activity className="h-5 w-5 text-blue-600" />} label="Total Attempts" value={data.summary.totalAttempts} />
                <SummaryStat icon={<CheckCircle className="h-5 w-5 text-green-600" />} label="Completed" value={data.summary.completedAttempts} />
                <SummaryStat icon={<Clock className="h-5 w-5 text-yellow-600" />} label="In Progress" value={data.summary.inProgressAttempts} />
                <SummaryStat icon={<Target className="h-5 w-5 text-purple-600" />} label="Unique Tests" value={data.summary.uniqueTests} />
                <SummaryStat
                  icon={<Trophy className="h-5 w-5 text-orange-600" />}
                  label="Avg Score"
                  value={data.summary.avgPercentage !== null ? `${data.summary.avgPercentage}%` : '—'}
                />
              </div>

              {/* Attempts list */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1">
                  <Layers className="h-4 w-4" /> All Attempts ({data.attempts.length})
                </h4>
                {data.attempts.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    No test attempts yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Series / Category / Test</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.attempts.map((a, idx) => {
                          const badge = STATUS_BADGE[a.status] || STATUS_BADGE.active;
                          return (
                            <tr key={a.sessionId} className="hover:bg-gray-50">
                              <td className="px-3 py-3 text-sm text-gray-500">{idx + 1}</td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-gray-900 text-sm">{a.testName || a.categoryName || '—'}</div>
                                <div className="text-xs text-gray-500 mt-0.5 break-all">{a.hierarchyPath}</div>
                                {a.totalQuestions ? (
                                  <div className="text-xs text-gray-400 mt-0.5">{a.totalQuestions} questions</div>
                                ) : null}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                                <div>{formatDate(a.startedAt)}</div>
                                {a.completedAt && a.isCompleted && (
                                  <div className="text-xs text-gray-400 mt-0.5">Completed {formatDate(a.completedAt)}</div>
                                )}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm">
                                {a.isCompleted && a.percentage !== null ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                    <span className="font-medium text-gray-900">{Number(a.percentage).toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500">({a.totalCorrect}/{a.totalQuestions})</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  {formatDuration(a.timeSpentSeconds)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryStat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-white rounded-lg border border-gray-200 px-3 py-3 flex items-center gap-3">
    <div className="flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);
