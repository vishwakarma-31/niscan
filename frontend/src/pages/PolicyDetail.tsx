import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Save, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { ExtractionConfidencePanel } from '@/components/ExtractionConfidencePanel';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import type { Policy, PolicyStatus } from '@/types/policy.types';
import toast from 'react-hot-toast';

const statusOptions: { value: PolicyStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatPremium(amount: number | null): string {
  if (amount === null) return '-';
  return `₹${amount.toLocaleString('en-IN')}`;
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  const statusClasses: Record<PolicyStatus, string> = {
    pending: 'status-badge status-pending',
    active: 'status-badge status-active',
    expired: 'status-badge status-expired',
    cancelled: 'status-badge status-cancelled',
  };

  const statusLabels: Record<PolicyStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  return <span className={statusClasses[status]}>{statusLabels[status]}</span>;
}

interface InfoItem {
  label: string;
  value: string | null;
  isMono?: boolean;
}

export default function PolicyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, subscribe } = useSocket();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PolicyStatus | ''>('');
  const [isRevealed, setIsRevealed] = useState(false);

  const fetchPolicy = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await apiService.policies.getById(id);
      setPolicy(res.policy);
      setSelectedStatus(res.policy.status);
    } catch {
      toast.error('Failed to load policy');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  useEffect(() => {
    const unsub = subscribe<{ policy_id: string }>('policy:extraction_complete', (data) => {
      if (data.policy_id === id) {
        fetchPolicy();
        setIsRevealed(false);
        setTimeout(() => setIsRevealed(true), 100);
        toast.success('Extraction updated');
      }
    });

    return () => unsub();
  }, [subscribe, id, fetchPolicy]);

  const handleStatusSave = async () => {
    if (!id || !selectedStatus) return;
    setIsSaving(true);
    try {
      const res = await apiService.policies.updateStatus(id, selectedStatus);
      setPolicy(res.policy);
      toast.success('Status updated successfully');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const res = await apiService.policies.getDownloadUrl(id);
      window.open(res.downloadUrl, '_blank');
    } catch {
      toast.error('Failed to get download URL');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await apiService.policies.delete(id);
      toast.success('Policy deleted successfully');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete policy');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading policy...</span>
        </div>
      </div>
    );
  }

  if (!policy) {
    return null;
  }

  const infoItems: InfoItem[] = [
    { label: 'Customer Name', value: policy.customer_name },
    { label: 'Customer Email', value: policy.customer_email },
    { label: 'Vehicle Number', value: policy.vehicle_number, isMono: true },
    { label: 'Insurer', value: policy.insurer },
    { label: 'Premium', value: formatPremium(policy.premium) },
    { label: 'Policy Number', value: policy.policy_number, isMono: true },
    { label: 'Uploaded By', value: policy.uploader_name || policy.uploaded_by },
    { label: 'Created Date', value: formatDate(policy.created_at) },
    { label: 'Last Updated', value: formatDate(policy.updated_at) },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-mono-policy text-blue-600">
                {policy.policy_number || 'Policy'}
              </h1>
              <StatusBadge status={policy.status} />
            </div>
            <p className="text-gray-600 mt-1">
              {policy.customer_name || 'Unknown Customer'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownload}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>

        {/* Status Manager (Admin only) */}
        {user?.role === 'admin' && (
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Update Status</label>
            </div>
            <div className="flex flex-1 gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PolicyStatus)}
                className="input flex-1 sm:max-w-xs"
              >
                <option value="">Select status...</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusSave}
                disabled={!selectedStatus || isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
        )}

        {/* Policy Info Grid */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Policy Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p
                  className={`text-sm text-gray-800 ${
                    item.isMono ? 'font-mono-policy' : ''
                  }`}
                >
                  {item.value || '-'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Extraction Confidence Panel */}
        <ExtractionConfidencePanel
          extractionConfidence={policy.extraction_confidence}
          isRevealed={isRevealed}
        />
      </div>
    </div>
  );
}