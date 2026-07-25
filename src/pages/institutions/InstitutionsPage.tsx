import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { institutionsService, Institution } from '../../services/branches';

const PRICING_MODE_LABELS: Record<Institution['pricing_mode'], string> = {
  school: 'School (always free)',
  private_educator: 'Private Educator (educator sets price)',
  coaching_center: 'Coaching Center (admin sets price)',
};

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
  onSuccess: () => void;
}

const InstitutionModal: React.FC<InstitutionModalProps> = ({ isOpen, onClose, institution, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    contact_email: '',
    pricing_mode: 'coaching_center' as Institution['pricing_mode'],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name || '',
        slug: institution.slug || '',
        logo_url: institution.logo_url || '',
        contact_email: institution.contact_email || '',
        pricing_mode: institution.pricing_mode || 'coaching_center',
      });
    } else {
      setFormData({ name: '', slug: '', logo_url: '', contact_email: '', pricing_mode: 'coaching_center' });
    }
  }, [institution, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (institution) {
        await institutionsService.updateInstitution(institution.id, formData);
        toast.success('Institution updated successfully');
      } else {
        await institutionsService.createInstitution(formData);
        toast.success('Institution created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save institution');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{institution ? 'Edit Institution' : 'Add Institution'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. ABC Public School"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. abc-public-school"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <input
              type="text"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Mode *</label>
            <select
              value={formData.pricing_mode}
              onChange={(e) => setFormData({ ...formData, pricing_mode: e.target.value as Institution['pricing_mode'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {(Object.keys(PRICING_MODE_LABELS) as Institution['pricing_mode'][]).map((mode) => (
                <option key={mode} value={mode}>{PRICING_MODE_LABELS[mode]}</option>
              ))}
            </select>
          </div>

          <div className="border-t pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Saving...' : institution ? 'Update Institution' : 'Create Institution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const InstitutionsPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, institution: null as Institution | null, loading: false });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const response = await institutionsService.getInstitutions({ search: searchTerm });
      setInstitutions(response.data || []);
    } catch (error) {
      toast.error('Failed to load institutions');
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInstitutions();
  };

  const handleAdd = () => {
    setSelectedInstitution(null);
    setShowModal(true);
  };

  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution);
    setShowModal(true);
  };

  const handleDelete = (institution: Institution) => {
    setConfirmModal({ isOpen: true, institution, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.institution) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await institutionsService.deleteInstitution(confirmModal.institution.id);
      toast.success('Institution deleted successfully');
      loadInstitutions();
      setConfirmModal({ isOpen: false, institution: null, loading: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete institution');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
          <p className="text-gray-600">Manage schools, private educators, and coaching centers on the platform</p>
        </div>
        <button onClick={handleAdd} className="btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Institution
        </button>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search institutions by name or slug..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Institutions</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : institutions.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No institutions found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first institution.</p>
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Institution
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {institutions.map((institution) => (
              <div key={institution.uuid} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary-50">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{institution.name}</h4>
                      <p className="text-sm text-gray-600">{institution.slug}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${institution.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {institution.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">{PRICING_MODE_LABELS[institution.pricing_mode]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleEdit(institution)} className="p-2 text-gray-400 hover:text-primary-600">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(institution)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <InstitutionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        institution={selectedInstitution}
        onSuccess={loadInstitutions}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, institution: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Institution"
        message={`Are you sure you want to delete "${confirmModal.institution?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};
