import React, { useState, useEffect } from 'react';
import { ShieldCheck, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { rolesService, AdminUser, AdminRole, PERMISSION_KEYS } from '../../services/roles';
import { useAuth } from '../../hooks/useAuth';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  institution_admin: 'Institution Admin',
  branch_admin: 'Branch Admin',
};

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUser | null;
  onSuccess: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, admin, onSuccess }) => {
  const [role, setRole] = useState<AdminRole>('admin');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setRole(admin.role);
      setPermissions(admin.permissions || {});
    }
  }, [admin, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setLoading(true);
    try {
      await rolesService.updateAdminRole(admin.id, { role, permissions });
      toast.success('Role & permissions updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Edit Role &amp; Permissions</h2>
        <p className="text-sm text-gray-600 mb-6">{admin.name} — {admin.email}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
              <span className="text-xs text-gray-500 ml-1">(scopes down institution/branch admins — super_admin always has full access)</span>
            </label>
            <div className="space-y-2 border border-gray-200 rounded-md p-3">
              {PERMISSION_KEYS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!permissions[key]}
                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RolesPermissionsPage: React.FC = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await rolesService.getAdmins({ search: searchTerm });
      setAdmins(response.data || []);
    } catch (error) {
      toast.error('Failed to load admins');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdmins();
  };

  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
        <p className="text-gray-600">Manage admin roles and what each layer of management can access</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search admins by name or email..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Roles</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No admins found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {ROLE_LABELS[admin.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.branch?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { setSelectedAdmin(admin); setShowModal(true); }}
                        className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={!isSuperAdmin}
                        title={isSuperAdmin ? 'Edit role' : 'Only super admins can edit roles'}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RoleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        admin={selectedAdmin}
        onSuccess={loadAdmins}
      />
    </div>
  );
};
