import React, { useEffect, useState } from 'react';
import { Search, Activity, CheckCircle, XCircle, Clock, Phone, Mail, RefreshCcw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { testAttemptsService, StudentTestActivity, AttemptStatus } from '../../services/testAttempts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StudentTestHistoryModal } from '../../components/modals/StudentTestHistoryModal';
import { formatDate } from '../../lib/utils';

type StatusFilter = AttemptStatus | 'all';

const STATUS_BADGE: Record<AttemptStatus, { label: string; className: string }> = {
  active:    { label: 'In Progress', className: 'bg-primary-100 text-primary-800 border border-primary-200' },
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

export const TestAttemptsPage: React.FC = () => {
  const [rows, setRows] = useState<StudentTestActivity[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentUuid, setSelectedStudentUuid] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await testAttemptsService.getStudentActivity({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (res.success) {
        setRows(res.data);
        setPagination(res.pagination);
      } else {
        setError('Failed to load student test activity');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch student test activity';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearch, statusFilter, dateFrom, dateTo]);

  const openHistory = (uuid: string) => {
    setSelectedStudentUuid(uuid);
    setModalOpen(true);
  };

  const closeHistory = () => {
    setModalOpen(false);
    setSelectedStudentUuid(null);
  };

  const renderPaginationButtons = () => {
    const { page, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const pages: (number | '...')[] = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
      .reduce<(number | '...')[]>((acc, p, i, arr) => {
        if (i > 0 && typeof arr[i - 1] === 'number' && (p - (arr[i - 1] as number)) > 1) acc.push('...');
        acc.push(p);
        return acc;
      }, []);

    return (
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setCurrentPage(p as number)}
              className={`px-3 py-1 text-sm border rounded ${
                p === page ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            Test Attempts
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            One row per student showing their latest attempt. Click <span className="font-medium">View</span> for the full history.
          </p>
        </div>
        <button
          onClick={fetchActivity}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-700">{error}</p>
            <button
              onClick={fetchActivity}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No test attempts found</p>
            <p className="text-sm text-gray-500 mt-1">
              {debouncedSearch || statusFilter !== 'all' || dateFrom || dateTo
                ? 'Try adjusting your filters.'
                : 'Once students start attempting tests, they\'ll appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Student</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Latest Test</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Started</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Score</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Duration</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Attempts</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row) => {
                  const a = row.latestAttempt;
                  const badge = a ? (STATUS_BADGE[a.status] || STATUS_BADGE.active) : null;
                  return (
                    <tr key={row.studentUuid} className="hover:bg-gray-50 align-top">
                      {/* Student */}
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900 text-sm truncate max-w-[180px]" title={row.studentName || ''}>{row.studentName || '—'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]" title={row.studentEmail || ''}>{row.studentEmail || ''}</div>
                      </td>

                      {/* Contact */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {row.studentPhone ? (
                          <a href={`tel:${row.studentPhone}`} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                            <Phone className="h-3.5 w-3.5" />
                            {row.studentPhone}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No phone</span>
                        )}
                        {row.studentEmail && (
                          <a href={`mailto:${row.studentEmail}`} className="flex items-center gap-1 text-xs text-gray-500 hover:underline mt-0.5">
                            <Mail className="h-3 w-3" /> Email
                          </a>
                        )}
                      </td>

                      {/* Latest Test — give it room so long names don't wrap to 5+ lines */}
                      <td className="px-3 py-3 min-w-[220px] max-w-[300px]">
                        {a ? (
                          <>
                            <div className="font-medium text-gray-900 text-sm leading-snug" title={a.testName || a.categoryName || ''}>
                              {a.testName || a.categoryName || '—'}
                            </div>
                            {a.testName && a.categoryName && a.testName !== a.categoryName && (
                              <div className="text-xs text-gray-500 truncate" title={a.categoryName || ''}>{a.categoryName}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-0.5">{a.totalQuestions} questions</div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No attempts</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {badge ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Started */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                        {a ? formatDate(a.startedAt) : '—'}
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {a && a.isCompleted && a.percentage !== null ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{Number(a.percentage).toFixed(1)}%</span>
                            <span className="text-xs text-gray-500">({a.totalCorrect}/{a.totalQuestions})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {a ? formatDuration(a.timeSpentSeconds) : '—'}
                        </div>
                      </td>

                      {/* Attempts count */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{row.totalAttempts}</div>
                        <div className="text-xs text-gray-500">{row.completedAttempts} completed</div>
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => openHistory(row.studentUuid)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && rows.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1}
              –{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </div>
            {renderPaginationButtons()}
          </div>
        )}
      </div>

      {/* Modal */}
      <StudentTestHistoryModal
        isOpen={modalOpen}
        studentUuid={selectedStudentUuid}
        onClose={closeHistory}
      />
    </div>
  );
};

export default TestAttemptsPage;
