import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { SearchableSelect } from '../common/SearchableSelect';

interface User {
  uuid: string;
  username: string;
  email: string;
}

interface TestSeries {
  id: number;
  title: string;
  price: number;
  validity_days: number;
}

interface PdfCategory {
  id: number;
  uuid: string;
  name: string;
  pricing_type: 'free' | 'paid' | 'restricted';
  price: number | string;
}

type SubscriptionType = 'test_series' | 'pdf_category';

interface GrantSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GrantSubscriptionModal: React.FC<GrantSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('test_series');

  const [users, setUsers] = useState<User[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [pdfCategories, setPdfCategories] = useState<PdfCategory[]>([]);

  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<TestSeries | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PdfCategory | null>(null);

  const [formData, setFormData] = useState({
    user_id: '',
    test_series_id: '',
    pdf_category_uuid: '',
    payment_method: 'admin_grant',
    amount_paid: 0,
    currency: 'INR',
    expiry_days: 365,
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers('');
      fetchTestSeries('');
      fetchPdfCategories();
    } else {
      setSelectedUser(null);
      setSelectedSeries(null);
      setSelectedCategory(null);
      setSubscriptionType('test_series');
    }
  }, [isOpen]);

  const fetchUsers = async (search: string) => {
    try {
      setUsersLoading(true);
      const response = await api.get('/admin/students', {
        params: { limit: 100, search },
      });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTestSeries = async (search: string) => {
    try {
      setSeriesLoading(true);
      const response = await api.get('/admin/test-management', {
        params: { limit: 100, search },
      });
      const data = response.data?.data || [];
      setTestSeries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching test series:', error);
      toast.error('Failed to fetch test series');
      setTestSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  };

  const fetchPdfCategories = async () => {
    try {
      setCatLoading(true);
      const response = await api.get('/admin/pdf-hierarchy/roots');
      // Response shape: { data: { content: [...], content_type, ... } }
      const all: PdfCategory[] = response.data?.data?.content || [];
      setPdfCategories(Array.isArray(all) ? all.filter((c) => c.pricing_type === 'paid') : []);
    } catch (error) {
      console.error('Error fetching PDF categories:', error);
      toast.error('Failed to fetch PDF categories');
      setPdfCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionId = `ADMIN_GRANT_${Date.now()}_${formData.user_id.slice(0, 8)}`;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + formData.expiry_days);

      const payload: Record<string, any> = {
        user_id: formData.user_id,
        transaction_id: transactionId,
        payment_method: formData.payment_method,
        amount_paid: formData.amount_paid,
        currency: formData.currency,
        status: 'completed',
        expiry_date: expiryDate.toISOString(),
      };

      if (subscriptionType === 'test_series') {
        payload.test_series_id = formData.test_series_id;
      } else {
        payload.pdf_category_uuid = formData.pdf_category_uuid;
      }

      await api.post('/admin/subscriptions/manual', payload);

      toast.success('Subscription granted successfully!');
      onSuccess();
      onClose();

      setFormData({
        user_id: '',
        test_series_id: '',
        pdf_category_uuid: '',
        payment_method: 'admin_grant',
        amount_paid: 0,
        currency: 'INR',
        expiry_days: 365,
      });
      setSelectedUser(null);
      setSelectedSeries(null);
      setSelectedCategory(null);
    } catch (error: any) {
      console.error('Error granting subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to grant subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setFormData((fd) => ({ ...fd, user_id: userId }));
    if (!userId) { setSelectedUser(null); return; }
    const u = users.find((u) => u.uuid === userId);
    if (u) setSelectedUser(u);
  };

  const handleTestSeriesChange = (testSeriesId: string) => {
    if (!testSeriesId) {
      setSelectedSeries(null);
      setFormData((fd) => ({ ...fd, test_series_id: '', amount_paid: 0, expiry_days: 365 }));
      return;
    }
    const ts = testSeries.find((ts) => ts.id.toString() === testSeriesId) || selectedSeries;
    if (ts) setSelectedSeries(ts);
    setFormData((fd) => ({
      ...fd,
      test_series_id: testSeriesId,
      amount_paid: ts?.price ?? fd.amount_paid,
      expiry_days: ts?.validity_days ?? fd.expiry_days,
    }));
  };

  const handleCategoryChange = (uuid: string) => {
    if (!uuid) {
      setSelectedCategory(null);
      setFormData((fd) => ({ ...fd, pdf_category_uuid: '', amount_paid: 0, expiry_days: 365 }));
      return;
    }
    const cat = pdfCategories.find((c) => c.uuid === uuid) || selectedCategory;
    if (cat) setSelectedCategory(cat);
    setFormData((fd) => ({
      ...fd,
      pdf_category_uuid: uuid,
      amount_paid: cat ? Number(cat.price) : fd.amount_paid,
      expiry_days: 365,
    }));
  };

  const handleTypeSwitch = (type: SubscriptionType) => {
    setSubscriptionType(type);
    setSelectedSeries(null);
    setSelectedCategory(null);
    setFormData((fd) => ({
      ...fd,
      test_series_id: '',
      pdf_category_uuid: '',
      amount_paid: 0,
      expiry_days: 365,
    }));
  };

  const userOptions = useMemo(() => {
    const opts = users.map((u) => ({ value: u.uuid, label: u.username, sublabel: u.email }));
    if (selectedUser && !opts.find((o) => o.value === selectedUser.uuid)) {
      opts.unshift({ value: selectedUser.uuid, label: selectedUser.username, sublabel: selectedUser.email });
    }
    return opts;
  }, [users, selectedUser]);

  const testSeriesOptions = useMemo(() => {
    const opts = testSeries.map((ts) => ({ value: ts.id.toString(), label: ts.title, sublabel: `₹${ts.price}` }));
    if (selectedSeries && !opts.find((o) => o.value === selectedSeries.id.toString())) {
      opts.unshift({ value: selectedSeries.id.toString(), label: selectedSeries.title, sublabel: `₹${selectedSeries.price}` });
    }
    return opts;
  }, [testSeries, selectedSeries]);

  const pdfCategoryOptions = useMemo(() => {
    const opts = pdfCategories.map((c) => ({
      value: c.uuid,
      label: c.name,
      sublabel: `₹${Number(c.price).toFixed(2)}`,
    }));
    if (selectedCategory && !opts.find((o) => o.value === selectedCategory.uuid)) {
      opts.unshift({
        value: selectedCategory.uuid,
        label: selectedCategory.name,
        sublabel: `₹${Number(selectedCategory.price).toFixed(2)}`,
      });
    }
    return opts;
  }, [pdfCategories, selectedCategory]);

  const itemSelected = subscriptionType === 'test_series' ? !!formData.test_series_id : !!formData.pdf_category_uuid;
  const itemLabel   = subscriptionType === 'test_series'
    ? (selectedSeries?.title || testSeries.find((ts) => ts.id.toString() === formData.test_series_id)?.title || '')
    : (selectedCategory?.name || pdfCategories.find((c) => c.uuid === formData.pdf_category_uuid)?.name || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Grant Subscription</h2>
              <p className="text-sm text-gray-600">Give a subscription to any user</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subscription Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Type</label>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('test_series')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    subscriptionType === 'test_series'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Test Series
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('pdf_category')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    subscriptionType === 'pdf_category'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  PDF Category
                </button>
              </div>
            </div>

            {/* User Selection */}
            <SearchableSelect
              label="Select User"
              required
              options={userOptions}
              value={formData.user_id}
              onChange={handleUserChange}
              onSearch={fetchUsers}
              loading={usersLoading}
              placeholder="Search users by name, email, or phone…"
              emptyText="No users match your search"
            />

            {/* Test Series or PDF Category */}
            {subscriptionType === 'test_series' ? (
              <SearchableSelect
                label="Test Series"
                required
                options={testSeriesOptions}
                value={formData.test_series_id}
                onChange={handleTestSeriesChange}
                onSearch={fetchTestSeries}
                loading={seriesLoading}
                placeholder="Search test series by title…"
                emptyText="No test series match your search"
              />
            ) : (
              <SearchableSelect
                label="PDF Category"
                required
                options={pdfCategoryOptions}
                value={formData.pdf_category_uuid}
                onChange={handleCategoryChange}
                loading={catLoading}
                placeholder="Select a paid PDF category…"
                emptyText="No paid PDF categories found"
              />
            )}

            {/* Subscription Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Set to 0 for free subscription</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <input
                  value={formData.expiry_days === 0 ? 'Lifetime' : `${formData.expiry_days} Days`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grant Type</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin_grant">Admin Grant (Free)</option>
                <option value="manual_payment">Manual Payment</option>
                <option value="refund_compensation">Refund/Compensation</option>
                <option value="promotional">Promotional Offer</option>
              </select>
            </div>

            {/* Summary */}
            {formData.user_id && itemSelected && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Subscription Summary</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">User:</span> {selectedUser?.username}</p>
                  <p>
                    <span className="font-medium">
                      {subscriptionType === 'test_series' ? 'Test Series' : 'PDF Category'}:
                    </span>{' '}
                    {itemLabel}
                  </p>
                  <p><span className="font-medium">Amount:</span> ₹{formData.amount_paid} {formData.amount_paid === 0 ? '(Free)' : ''}</p>
                  <p><span className="font-medium">Duration:</span> {formData.expiry_days === 0 ? 'Lifetime' : `${formData.expiry_days} Days`}</p>
                  <p><span className="font-medium">Type:</span> {formData.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !formData.user_id || !itemSelected}
            >
              {loading ? 'Granting...' : 'Grant Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
