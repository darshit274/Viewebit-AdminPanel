import React, { useState, useEffect } from 'react';
import { Plus, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { educatorsService, Educator } from '../../services/educators';
import { institutionsService, branchesService, departmentsService, Institution, Branch, Department } from '../../services/branches';

interface EducatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EducatorModal: React.FC<EducatorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', designation: '', employee_code: '',
    institution_id: '', branch_id: '', department_id: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      institutionsService.getInstitutionsForDropdown().then((res) => setInstitutions(res.data || [])).catch(() => setInstitutions([]));
      setFormData({ name: '', email: '', password: '', designation: '', employee_code: '', institution_id: '', branch_id: '', department_id: '' });
      setBranches([]);
      setDepartments([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.institution_id) {
      branchesService.getBranches({}).then((res) => {
        const filtered = (res.data || []).filter((b: Branch) => b.institution_id === parseInt(formData.institution_id));
        setBranches(filtered);
      }).catch(() => setBranches([]));
    } else {
      setBranches([]);
    }
    setFormData((prev) => ({ ...prev, branch_id: '', department_id: '' }));
  }, [formData.institution_id]);

  useEffect(() => {
    if (formData.branch_id) {
      departmentsService.getDepartments(parseInt(formData.branch_id)).then((res) => setDepartments(res.data || [])).catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
    setFormData((prev) => ({ ...prev, department_id: '' }));
  }, [formData.branch_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setLoading(true);
    try {
      await educatorsService.createEducator({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        designation: formData.designation || undefined,
        employee_code: formData.employee_code || undefined,
        institution_id: formData.institution_id ? parseInt(formData.institution_id) : undefined,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : undefined,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
      });
      toast.success('Educator created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create educator');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Educator</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Senior Faculty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
              <input
                type="text"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Organization Assignment (optional)</p>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={formData.institution_id}
                onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Institution</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!formData.institution_id}
              >
                <option value="">Branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!formData.branch_id}
              >
                <option value="">Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Creating...' : 'Create Educator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EducatorsPage: React.FC = () => {
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadEducators();
  }, []);

  const loadEducators = async () => {
    setLoading(true);
    try {
      const response = await educatorsService.getEducators({ search: searchTerm });
      setEducators(response.data || []);
    } catch (error) {
      toast.error('Failed to load educators');
      setEducators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEducators();
  };

  const handleToggleStatus = async (educator: Educator) => {
    try {
      await educatorsService.toggleStatus(educator.id);
      toast.success(`Educator ${educator.isActive ? 'deactivated' : 'activated'} successfully`);
      loadEducators();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Educators</h1>
          <p className="text-gray-600">Manage faculty accounts and their branch/department assignment</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Educator
        </button>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search educators by name, email, or employee code..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : educators.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No educators found</h3>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Educator
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch / Dept</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {educators.map((educator) => (
                  <tr key={educator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{educator.name}</div>
                      <div className="text-sm text-gray-500">{educator.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educator.designation || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {educator.branch?.name || '—'}{educator.department ? ` / ${educator.department.name}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${educator.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {educator.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleToggleStatus(educator)} className="p-2 text-gray-400 hover:text-gray-600" title={educator.isActive ? 'Deactivate' : 'Activate'}>
                        {educator.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EducatorModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={loadEducators} />
    </div>
  );
};
