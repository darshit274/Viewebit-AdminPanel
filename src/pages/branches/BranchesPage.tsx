import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Building2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { branchesService, institutionsService, Branch, Institution } from '../../services/branches';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  institutions: Institution[];
  onSuccess: () => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, branch, institutions, onSuccess }) => {
  const [formData, setFormData] = useState({
    institution_id: '',
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branch) {
      setFormData({
        institution_id: branch.institution_id?.toString() || '',
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        city: branch.city || '',
        state: branch.state || '',
      });
    } else {
      setFormData({
        institution_id: institutions[0]?.id?.toString() || '',
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
      });
    }
  }, [branch, institutions, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (branch) {
        await branchesService.updateBranch(branch.uuid, {
          name: formData.name,
          code: formData.code,
          address: formData.address,
          city: formData.city,
          state: formData.state,
        });
        toast.success('Branch updated successfully');
      } else {
        await branchesService.createBranch({
          institution_id: parseInt(formData.institution_id),
          name: formData.name,
          code: formData.code,
          address: formData.address,
          city: formData.city,
          state: formData.state,
        });
        toast.success('Branch created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{branch ? 'Edit Branch' : 'Add Branch'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!branch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
              <select
                value={formData.institution_id}
                onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Delhi HQ"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. DEL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="border-t pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : branch ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, branch: null as Branch | null, loading: false });

  useEffect(() => {
    loadBranches();
    loadInstitutions();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const response = await branchesService.getBranches({ search: searchTerm });
      setBranches(response.data || []);
    } catch (error) {
      toast.error('Failed to load branches');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      const response = await institutionsService.getInstitutionsForDropdown();
      setInstitutions(response.data || []);
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBranches();
  };

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setShowModal(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  const handleDeleteBranch = (branch: Branch) => {
    setConfirmModal({ isOpen: true, branch, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.branch) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await branchesService.deleteBranch(confirmModal.branch.uuid);
      toast.success('Branch deleted successfully');
      loadBranches();
      setConfirmModal({ isOpen: false, branch: null, loading: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete branch');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      await branchesService.toggleBranchStatus(branch.uuid);
      toast.success(`Branch ${branch.is_active ? 'deactivated' : 'activated'} successfully`);
      loadBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches &amp; Departments</h1>
          <p className="text-gray-600">Manage your institution's branches across cities</p>
        </div>
        <button onClick={handleAddBranch} className="btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </button>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search branches by name, code, or city..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Branches</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first branch.</p>
            <button onClick={handleAddBranch} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {branches.map((branch) => (
              <div key={branch.uuid} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center space-x-4 flex-1 cursor-pointer"
                    onClick={() => navigate(`/branches/${branch.uuid}`)}
                  >
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary-50">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{branch.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        {branch.city && <><MapPin className="h-3 w-3" />{branch.city}{branch.state ? `, ${branch.state}` : ''}</>}
                        {branch.code && <span className="ml-2 text-gray-400">({branch.code})</span>}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {branch.departments?.length || 0} department{branch.departments?.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleToggleStatus(branch)} className="p-2 text-gray-400 hover:text-gray-600" title={branch.is_active ? 'Deactivate' : 'Activate'}>
                      {branch.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button onClick={() => handleEditBranch(branch)} className="p-2 text-gray-400 hover:text-primary-600">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteBranch(branch)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BranchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        branch={selectedBranch}
        institutions={institutions}
        onSuccess={loadBranches}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, branch: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Branch"
        message={`Are you sure you want to delete "${confirmModal.branch?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};
