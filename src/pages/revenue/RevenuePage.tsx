import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, CreditCard, TrendingUp, XCircle, Download, ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { revenueService, RevenueStats } from '../../services/revenue';
import { branchesService, departmentsService, Branch, Department } from '../../services/branches';
import toast from 'react-hot-toast';

const RevenuePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [branchId, setBranchId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('all');
  const [exporting, setExporting] = useState<'revenue' | 'enrollments' | null>(null);

  useEffect(() => {
    branchesService.getBranchesForDropdown().then((res) => {
      setBranches(res?.data || []);
    }).catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!branchId) {
      setDepartments([]);
      setDepartmentId('');
      return;
    }
    departmentsService.getDepartmentsForDropdown(Number(branchId)).then((res) => {
      setDepartments(res?.data || []);
    }).catch(() => setDepartments([]));
  }, [branchId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await revenueService.getStats({
        branch_id: branchId ? Number(branchId) : undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      if (res.success) setStats(res.data);
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      toast.error('Failed to load revenue stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, departmentId, dateFrom, dateTo]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportRevenue = async () => {
    setExporting('revenue');
    try {
      const blob = await revenueService.exportRevenue();
      downloadBlob(blob, `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Revenue report exported successfully');
    } catch (error) {
      console.error('Error exporting revenue:', error);
      toast.error('Failed to export revenue report');
    } finally {
      setExporting(null);
    }
  };

  const handleExportEnrollments = async () => {
    setExporting('enrollments');
    try {
      const blob = await revenueService.exportEnrollments({
        status: enrollmentStatus !== 'all' ? enrollmentStatus : undefined,
        branch_id: branchId ? Number(branchId) : undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
      });
      downloadBlob(blob, `enrollments_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Enrollments report exported successfully');
    } catch (error) {
      console.error('Error exporting enrollments:', error);
      toast.error('Failed to export enrollments report');
    } finally {
      setExporting(null);
    }
  };

  const formatCurrency = (value: number) => `₹${(value || 0).toLocaleString('en-IN')}`;

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue overview across institutions, branches and departments</p>
        </div>
        <button
          onClick={() => navigate('/subscriptions')}
          className="btn-secondary flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View Transactions
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Branch</label>
          <select
            className="input-field min-w-[160px]"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
          <select
            className="input-field min-w-[160px]"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            disabled={!branchId}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" className="input-field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" className="input-field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {(branchId || departmentId || dateFrom || dateTo) && (
          <button
            className="text-sm text-primary-600 hover:underline"
            onClick={() => { setBranchId(''); setDepartmentId(''); setDateFrom(''); setDateTo(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Revenue" value={formatCurrency(stats?.total_revenue || 0)} icon={DollarSign} color="green" />
        <StatsCard title="This Month" value={formatCurrency(stats?.monthly_revenue || 0)} icon={TrendingUp} color="blue" />
        <StatsCard title="Active Subscriptions" value={stats?.active_subscriptions || 0} icon={CreditCard} color="purple" />
        <StatsCard title="Expired Subscriptions" value={stats?.expired_subscriptions || 0} icon={XCircle} color="red" />
      </div>

      {/* Trend chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.revenue_trend || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reports / Export */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Revenue / Transactions</h4>
            <p className="text-xs text-gray-500 mb-3">Export all subscription transactions as CSV.</p>
            <button
              onClick={handleExportRevenue}
              disabled={exporting === 'revenue'}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting === 'revenue' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Admissions / Enrollments</h4>
            <p className="text-xs text-gray-500 mb-3">Export student admissions filtered by status and org scope.</p>
            <div className="flex items-center gap-2">
              <select
                className="input-field"
                value={enrollmentStatus}
                onChange={(e) => setEnrollmentStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="enrolled">Enrolled</option>
              </select>
              <button
                onClick={handleExportEnrollments}
                disabled={exporting === 'enrollments'}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting === 'enrollments' ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;
