import React, { useState, useEffect } from 'react';
import { UserCheck, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { admissionsService, Admission, ApplicationStatus, AdmissionStats } from '../../services/admissions';

const STATUS_TABS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  enrolled: 'bg-primary-50 text-primary-700',
  rejected: 'bg-red-100 text-red-800',
};

export const AdmissionsPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('pending');
  const [processingUuid, setProcessingUuid] = useState<string | null>(null);

  useEffect(() => {
    loadAdmissions();
    loadStats();
  }, [statusFilter]);

  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const response = await admissionsService.getAdmissions({
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setAdmissions(response.data || []);
    } catch (error) {
      toast.error('Failed to load admissions');
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await admissionsService.getAdmissionStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading admission stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdmissions();
  };

  const handleUpdateStatus = async (uuid: string, status: ApplicationStatus) => {
    setProcessingUuid(uuid);
    try {
      await admissionsService.updateAdmissionStatus(uuid, status);
      toast.success(`Application ${status}`);
      loadAdmissions();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update application');
    } finally {
      setProcessingUuid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admissions &amp; Enrollments</h1>
        <p className="text-gray-600">Review and process student applications</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-600">Enrolled</p>
            <p className="text-2xl font-bold text-gray-900">{stats.enrolled}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-medium text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                statusFilter === tab.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : admissions.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admissions.map((admission) => (
                  <tr key={admission.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{admission.username}</div>
                      <div className="text-sm text-gray-500">{admission.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admission.branch?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[admission.application_status]}`}>
                        {admission.application_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {admission.application_status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(admission.uuid, 'approved')}
                            disabled={processingUuid === admission.uuid}
                            className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(admission.uuid, 'rejected')}
                            disabled={processingUuid === admission.uuid}
                            className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {admission.application_status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(admission.uuid, 'enrolled')}
                          disabled={processingUuid === admission.uuid}
                          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          Mark Enrolled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
