import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, UserPlus, X, CheckCircle, XCircle, Smartphone, SmartphoneNfc } from 'lucide-react';
import { LoadingSpinner, CardSkeleton } from '../../components/common/LoadingSpinner';
import { ApiError, ErrorBoundary } from '../../components/common/ErrorBoundary';
import { studentsService } from '../../services/students';
import { StudentModal } from '../../components/modals/StudentModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

export const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });

  // Simple state management instead of useApi hook
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Modal states
  const [studentModal, setStudentModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', student: null as any });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, student: null as any, loading: false });
  const [deviceResetModal, setDeviceResetModal] = useState({ isOpen: false, student: null as any, loading: false });

  // Debounce search input — wait 400ms after user stops typing before hitting the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await studentsService.getStudents({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        is_verified: verificationFilter === 'all' ? undefined : verificationFilter === 'verified',
      });

      const backendData = response.data;

      if (backendData && backendData.success) {
        setStudents(backendData.data || []);
        setPagination(backendData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      } else {
        setError('Invalid response format');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentPage, pageSize, debouncedSearch, sortBy, sortOrder, statusFilter, verificationFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
    setCurrentPage(1);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setVerificationFilter('all');
    setDateFilter({ from: '', to: '' });
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  };

  const applyAdvancedFilters = () => {
    setCurrentPage(1);
    setShowAdvancedFilters(false);
    // useEffect will trigger fetchStudents automatically since filter states changed
  };

  const hasActiveFilters = statusFilter !== 'all' ||
                          verificationFilter !== 'all' ||
                          !!debouncedSearch;

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Prepare filters for export
      const exportFilters = {
        search: debouncedSearch,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        is_verified: verificationFilter === 'all' ? undefined : verificationFilter === 'verified',
      };

      const blob = await studentsService.exportStudents(exportFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Students data exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export students data');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean, isEmailVerified: boolean) => {
    if (!isEmailVerified) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Unverified</span>;
    }
    if (isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>;
  };

  // CRUD handlers
  const handleAddStudent = () => {
    setStudentModal({ isOpen: true, mode: 'create', student: null });
  };

  const handleEditStudent = (student: any) => {
    setStudentModal({ isOpen: true, mode: 'edit', student });
  };

  const handleDeleteStudent = (student: any) => {
    setConfirmModal({ isOpen: true, student, loading: false });
  };

  const handleConfirmDelete = async () => {
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      await studentsService.deleteStudent(confirmModal.student.uuid);
      toast.success('Student deleted successfully');
      fetchStudents();
      setConfirmModal({ isOpen: false, student: null, loading: false });
    } catch (error: any) {
      console.error('Delete student error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleModalSuccess = () => {
    fetchStudents();
  };

  const handleResetDevice = (student: any) => {
    setDeviceResetModal({ isOpen: true, student, loading: false });
  };

  const handleConfirmResetDevice = async () => {
    try {
      setDeviceResetModal(prev => ({ ...prev, loading: true }));
      await studentsService.resetUserDevice(deviceResetModal.student.uuid);
      toast.success(`Device lock removed for ${deviceResetModal.student.username}`);
      fetchStudents();
      setDeviceResetModal({ isOpen: false, student: null, loading: false });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset device lock');
      setDeviceResetModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyStudent = async (student: any) => {
    try {
      await studentsService.verifyStudent(student.uuid);
      toast.success(`Student ${student.isEmailVerified ? 'unverified' : 'verified'} successfully`);
      fetchStudents(); // Refresh the list
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update verification status');
    }
  };

  if (error) {
    return <ApiError error={error} onRetry={fetchStudents} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage and monitor student accounts</p>
          </div>
          <button 
            onClick={handleAddStudent}
            className="btn-primary inline-flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              {/* Search input */}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Search Students
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email or phone..."
                    className="input-field pl-10 pr-10 w-full"
                    autoComplete="off"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {loading && debouncedSearch && (
                  <p className="text-xs text-gray-400 mt-1">Searching…</p>
                )}
              </div>

              {/* Page size */}
              <div className="w-full sm:w-36">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Per page
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="input-field w-full"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`btn-secondary flex-1 sm:flex-none ${hasActiveFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1.5 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {[statusFilter !== 'all', verificationFilter !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  {exportLoading ? 'Exporting…' : 'Export'}
                </button>
              </div>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 self-center">Active filters:</span>
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Search: "{debouncedSearch}"
                    <button type="button" onClick={handleSearchClear} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Status: {statusFilter}
                    <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {verificationFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {verificationFilter === 'verified' ? 'Verified' : 'Unverified'}
                    <button type="button" onClick={() => setVerificationFilter('all')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}

                <button type="button" onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-600 underline">
                  Clear all
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="card p-6 border-t-2 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="input-field"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Date
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Reset
              </button>
              <button
                onClick={applyAdvancedFilters}
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.isEmailVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => !s.isEmailVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Trash2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(s.created_at) > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Students List</h3>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: pageSize }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="mx-auto h-24 w-24 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No students have registered yet.'}
              </p>
              {!searchTerm && (
                <button onClick={handleAddStudent} className="btn-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('username')}
                    >
                      Name
                      {sortBy === 'username' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortBy === 'email' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Joined
                      {sortBy === 'created_at' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: any) => (
                    <tr key={student.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {student.profileImage ? (
                            <img 
                              className="h-8 w-8 rounded-full" 
                              src={student.profileImage} 
                              alt={student.username}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {student.username?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{student.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{student.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{student.phone || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(true, student.isEmailVerified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {formatDate(student.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.device_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                            <Smartphone className="h-3 w-3" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                            <SmartphoneNfc className="h-3 w-3" />
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditStudent(student)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleVerifyStudent(student)}
                            className={`${student.isEmailVerified ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={student.isEmailVerified ? 'Unverify Student' : 'Verify Student'}
                          >
                            {student.isEmailVerified ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleResetDevice(student)}
                            className={student.device_id ? 'text-orange-600 hover:text-orange-900' : 'text-gray-300 cursor-not-allowed'}
                            title={student.device_id ? 'Reset Device Lock' : 'No device linked'}
                            disabled={!student.device_id}
                          >
                            <Smartphone className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                  {' '}–{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, pagination.total)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span> students
                </p>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <button onClick={() => setCurrentPage(1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">1</button>
                        {currentPage > 4 && <span className="px-1 text-gray-400">…</span>}
                      </>
                    )}

                    {/* Window of pages around current */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => p >= currentPage - 2 && p <= currentPage + 2)
                      .map(p => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                            currentPage === p
                              ? 'bg-primary-600 text-white border-primary-600 font-medium'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))
                    }

                    {/* Last page */}
                    {currentPage < pagination.totalPages - 2 && (
                      <>
                        {currentPage < pagination.totalPages - 3 && <span className="px-1 text-gray-400">…</span>}
                        <button onClick={() => setCurrentPage(pagination.totalPages)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          {pagination.totalPages}
                        </button>
                      </>
                    )}

                    <div className="ml-2 flex gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        ‹ Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <StudentModal
          isOpen={studentModal.isOpen}
          onClose={() => setStudentModal({ isOpen: false, mode: 'create', student: null })}
          onSuccess={handleModalSuccess}
          student={studentModal.student}
          mode={studentModal.mode}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, student: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Student"
          message={`Are you sure you want to delete "${confirmModal.student?.username}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />

        <ConfirmModal
          isOpen={deviceResetModal.isOpen}
          onClose={() => setDeviceResetModal({ isOpen: false, student: null, loading: false })}
          onConfirm={handleConfirmResetDevice}
          title="Reset Device Lock"
          message={`Remove the device lock for "${deviceResetModal.student?.username}"? They will be able to login from any device on their next login attempt.`}
          confirmText="Reset Device"
          type="warning"
          loading={deviceResetModal.loading}
        />
      </div>
    </ErrorBoundary>
  );
};