import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Wifi, WifiOff } from 'lucide-react';
import { SummaryCards } from '@/components/SummaryCards';
import { PolicyTable } from '@/components/PolicyTable';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import type { Policy, PolicySummary, PolicyStatus, PolicyFilters } from '@/types/policy.types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isConnected, subscribe } = useSocket();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [summary, setSummary] = useState<PolicySummary | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const searchValue = searchParams.get('search') || '';
  const statusFilter = (searchParams.get('status') as PolicyStatus) || undefined;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const fetchPolicies = useCallback(async () => {
    setIsLoadingPolicies(true);
    try {
      const filters: PolicyFilters = {
        search: searchValue || undefined,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      };
      const res = await apiService.policies.getAll(filters);
      setPolicies(res.policies);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load policies');
    } finally {
      setIsLoadingPolicies(false);
    }
  }, [searchValue, statusFilter, currentPage]);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await apiService.policies.getSummary();
      setSummary(data);
    } catch {
      toast.error('Failed to load summary');
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
    fetchSummary();
  }, [fetchPolicies, fetchSummary]);

  useEffect(() => {
    const unsubStatus = subscribe<{ policy_id: string; status: PolicyStatus }>(
      'policy:status_updated',
      (data) => {
        setPolicies((prev) =>
          prev.map((p) => (p.id === data.policy_id ? { ...p, status: data.status } : p))
        );
        fetchSummary();
        toast.success(`Policy status updated to ${data.status}`);
      }
    );

    const unsubExtraction = subscribe<{ policy_id: string }>(
      'policy:extraction_complete',
      () => {
        fetchPolicies();
        fetchSummary();
        toast.success('New policy extracted successfully');
      }
    );

    return () => {
      unsubStatus();
      unsubExtraction();
    };
  }, [subscribe, fetchPolicies, fetchSummary]);

  const handleSearch = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams);
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleStatusFilter = useCallback(
    (status: PolicyStatus | undefined) => {
      const params = new URLSearchParams(searchParams);
      if (status) {
        params.set('status', status);
      } else {
        params.delete('status');
      }
      params.set('page', '1');
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', String(page));
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await apiService.policies.delete(id);
        toast.success('Policy deleted successfully');
        fetchPolicies();
        fetchSummary();
      } catch {
        toast.error('Failed to delete policy');
      }
    },
    [fetchPolicies, fetchSummary]
  );

  const handleExportCSV = async () => {
    try {
      const blob = await apiService.policies.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `policies_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  useEffect(() => {
    const exportParam = searchParams.get('export');
    if (exportParam === 'true') {
      handleExportCSV();
      searchParams.delete('export');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Policy Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                Welcome back, {user?.name}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                  user?.role === 'admin'
                    ? 'bg-blue-100 text-blue-500'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload Policy
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={summary} isLoading={isLoadingSummary} />

        {/* Policy Table */}
        <PolicyTable
          policies={policies}
          pagination={pagination}
          isLoading={isLoadingPolicies}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onDelete={handleDelete}
          searchValue={searchValue}
          statusFilter={statusFilter}
          isAdmin={user?.role === 'admin'}
        />
      </div>
    </div>
  );
}