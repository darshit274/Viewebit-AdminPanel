import React, { useState, useEffect } from 'react';
import { Search, Download, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { gdprService, GdprSubjectSummary, GdprSubjectType, DataSubjectRequestRecord } from '../../services/gdpr';

interface AnonymizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: GdprSubjectSummary | null;
  onSuccess: () => void;
}

const AnonymizeModal: React.FC<AnonymizeModalProps> = ({ isOpen, onClose, subject, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !reason.trim()) return;
    setLoading(true);
    try {
      await gdprService.anonymizeSubject(subject.subjectType, subject.uuid, reason.trim());
      toast.success('Record anonymized');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to anonymize record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !subject) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Anonymize {subject.name}</h2>
        <p className="text-sm text-gray-600 mb-6">
          This permanently scrubs this {subject.subjectType}'s personal information (name, email, phone, etc.)
          and blocks login. Financial/payment records are kept intact. This cannot be undone.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for this request
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="e.g. Data subject requested erasure via support ticket #1234"
              autoFocus
              required
            />
          </div>
          <div className="border-t pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50" disabled={loading || !reason.trim()}>
              {loading ? 'Anonymizing...' : 'Anonymize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DataSubjectRequestsPage: React.FC = () => {
  const [subjectType, setSubjectType] = useState<GdprSubjectType>('student');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<GdprSubjectSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [requests, setRequests] = useState<DataSubjectRequestRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const loadRequests = async (targetPage: number) => {
    setRequestsLoading(true);
    try {
      const response = await gdprService.listRequests(targetPage, 20);
      setRequests(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setPage(targetPage);
    } catch (error) {
      toast.error('Failed to load recent requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const response = await gdprService.search(query.trim(), subjectType);
      setResult(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No matching record found');
    } finally {
      setSearching(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      const blob = await gdprService.exportSubject(result.subjectType, result.uuid);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.subjectType}-${result.uuid}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
      loadRequests(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to export data');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Privacy & Data Requests</h1>
        <p className="text-gray-600">Fulfill GDPR data access and erasure requests for students and educators</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <select
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value as GdprSubjectType)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="student">Student</option>
            <option value="educator">Educator</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email or UUID"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {result && (
          <div className="mt-6 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{result.name}</h3>
              <p className="text-sm text-gray-600">{result.email}</p>
              {result.is_anonymized && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <ShieldAlert className="h-3 w-3" /> Already anonymized
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-md hover:bg-primary-50"
              >
                <Download className="h-4 w-4" /> Export Data
              </button>
              <button
                onClick={() => setModalOpen(true)}
                disabled={result.is_anonymized}
                className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                Anonymize / Erase
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
        </div>
        {requestsLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No requests logged yet</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{r.request_type === 'export' ? 'Export' : 'Anonymize'}</span>
                  <span className="text-gray-500"> · {r.subject_type} · {r.subject_uuid.slice(0, 8)}</span>
                  {r.reason && <p className="text-gray-500 mt-1">{r.reason}</p>}
                </div>
                <span className="text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 flex justify-end gap-2 border-t border-gray-200">
          <button
            onClick={() => loadRequests(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => loadRequests(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <AnonymizeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subject={result}
        onSuccess={() => {
          if (result) setResult({ ...result, is_anonymized: true });
          loadRequests(1);
        }}
      />
    </div>
  );
};

export default DataSubjectRequestsPage;
