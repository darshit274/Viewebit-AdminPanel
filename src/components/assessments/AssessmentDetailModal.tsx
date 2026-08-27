import React, { useEffect, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { assessmentService, type AssessmentLead, type UpdateLeadStatusData } from '../../services/assessments';

interface AssessmentDetailModalProps {
  leadId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const DIMENSION_LABELS: Record<string, string> = {
  aiFluency: 'AI Fluency',
  workflowApplication: 'Workflow Application',
  prompting: 'Prompting',
  responsibleAI: 'Responsible AI',
  organisationalReadiness: 'Organisational Readiness'
};

const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({ leadId, onClose, onUpdated }) => {
  const [lead, setLead] = useState<AssessmentLead | null>(null);
  const [status, setStatus] = useState<UpdateLeadStatusData['status']>('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRawAnswers, setShowRawAnswers] = useState(false);

  useEffect(() => {
    assessmentService.getLeadById(leadId).then((data) => {
      setLead(data);
      setStatus(data.status);
      setNotes(data.admin_notes || '');
    });
  }, [leadId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await assessmentService.updateLeadStatus(leadId, { status, admin_notes: notes });
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this assessment submission? This cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await assessmentService.deleteLead(leadId);
      toast.success('Assessment lead deleted successfully');
      onUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete assessment lead');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!lead ? (
          <p className="text-center text-gray-400 py-12">Loading...</p>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h2>
                <p className="text-sm text-gray-500">{lead.job_title} at {lead.agency_name}</p>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              <div><span className="text-gray-500">Work email:</span> {lead.work_email}</div>
              <div><span className="text-gray-500">Phone:</span> {lead.phone || '—'}</div>
              <div><span className="text-gray-500">Agency type:</span> {lead.agency_type}</div>
              <div><span className="text-gray-500">Employees:</span> {lead.employee_count_band}</div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 text-center mb-6">
              <div className="text-3xl font-bold text-indigo-700">{lead.overall_score} / 100</div>
              <div className="text-sm font-medium text-indigo-900">{lead.maturity_level.replace('_', ' ')}</div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Capability Profile</h3>
            <div className="space-y-2 mb-6">
              {Object.entries(lead.dimension_scores || {}).map(([key, score]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{DIMENSION_LABELS[key] || key}</span>
                  <span className="font-medium">{score}</span>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Top Opportunities</h3>
            <ul className="text-sm text-gray-700 mb-6 list-disc pl-5 space-y-1">
              {(Array.isArray(lead.top_opportunities) ? lead.top_opportunities : []).map((o) => (
                <li key={o.key}><strong>{o.title}</strong> — {o.explanation}</li>
              ))}
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2">Top Skill Gaps</h3>
            <ul className="text-sm text-gray-700 mb-6 list-disc pl-5 space-y-1">
              {(Array.isArray(lead.top_gaps) ? lead.top_gaps : []).map((g) => (
                <li key={g.key}><strong>{g.title}</strong> — {g.explanation}</li>
              ))}
            </ul>

            <button
              type="button"
              className="text-sm text-indigo-600 mb-6"
              onClick={() => setShowRawAnswers((v) => !v)}
            >
              {showRawAnswers ? 'Hide raw answers' : 'Show raw answers'}
            </button>
            {showRawAnswers && (
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto mb-6">
                {JSON.stringify(lead.answers, null, 2)}
              </pre>
            )}

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                value={status}
                onChange={(e) => setStatus(e.target.value as UpdateLeadStatusData['status'])}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
                <option value="closed">Closed</option>
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || deleting}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  title="Permanently delete this submission (GDPR erasure)"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 font-medium hover:bg-red-100 disabled:opacity-60"
                >
                  <TrashIcon className="w-5 h-5" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssessmentDetailModal;
