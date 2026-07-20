import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { branchesService, departmentsService, Branch, Department } from '../../services/branches';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  branchId: number;
  onSuccess: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ isOpen, onClose, department, branchId, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({ name: department?.name || '', code: department?.code || '' });
  }, [department, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (department) {
        await departmentsService.updateDepartment(department.uuid, formData);
        toast.success('Department updated successfully');
      } else {
        await departmentsService.createDepartment({ branch_id: branchId, ...formData });
        toast.success('Department created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{department ? 'Edit Department' : 'Add Department'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Science & Medical"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="border-t pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Saving...' : department ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BranchDetailPage: React.FC = () => {
  const { branchUuid } = useParams<{ branchUuid: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, department: null as Department | null, loading: false });

  useEffect(() => {
    if (branchUuid) loadBranch();
  }, [branchUuid]);

  const loadBranch = async () => {
    setLoading(true);
    try {
      const response = await branchesService.getBranchById(branchUuid!);
      setBranch(response.data);
    } catch (error) {
      toast.error('Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = () => {
    setSelectedDept(null);
    setShowModal(true);
  };

  const handleEditDept = (dept: Department) => {
    setSelectedDept(dept);
    setShowModal(true);
  };

  const handleDeleteDept = (dept: Department) => {
    setConfirmModal({ isOpen: true, department: dept, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.department) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await departmentsService.deleteDepartment(confirmModal.department.uuid);
      toast.success('Department deleted successfully');
      loadBranch();
      setConfirmModal({ isOpen: false, department: null, loading: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    try {
      await departmentsService.toggleDepartmentStatus(dept.uuid);
      toast.success(`Department ${dept.is_active ? 'deactivated' : 'activated'} successfully`);
      loadBranch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>;
  }

  if (!branch) {
    return <div className="p-12 text-center text-gray-600">Branch not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/branches')} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
          <p className="text-gray-600">
            {branch.city && `${branch.city}${branch.state ? `, ${branch.state}` : ''} · `}
            {branch.institution?.name}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Departments — {branch.name}</h3>
          <button onClick={handleAddDept} className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </button>
        </div>

        {!branch.departments || branch.departments.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
            <p className="text-gray-600 mb-6">Add departments to organize faculty and courses within this branch.</p>
            <button onClick={handleAddDept} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {branch.departments.map((dept) => (
              <div key={dept.uuid} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h4 className="text-md font-medium text-gray-900">{dept.name}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    {dept.code && <span className="text-sm text-gray-500">{dept.code}</span>}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleToggleStatus(dept)} className="p-2 text-gray-400 hover:text-gray-600">
                    {dept.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => handleEditDept(dept)} className="p-2 text-gray-400 hover:text-primary-600">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteDept(dept)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DepartmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        department={selectedDept}
        branchId={branch.id}
        onSuccess={loadBranch}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, department: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${confirmModal.department?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};
