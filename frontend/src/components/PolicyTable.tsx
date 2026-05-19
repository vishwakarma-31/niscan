import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye, Download, Trash2 } from 'lucide-react';
import type { Policy, PolicyStatus } from '@/types/policy.types';
import { apiService } from '@/services/api';

interface PolicyTableProps {
  policies: Policy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: PolicyStatus | undefined) => void;
  onDelete: (id: string) => void;
  searchValue?: string;
  statusFilter?: PolicyStatus;
  isAdmin: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

export function PolicyTable({
  policies,
  pagination,
  isLoading,
  onPageChange,
  onSearch,
  onStatusFilter,
  onDelete,
  searchValue = '',
  statusFilter,
  isAdmin,
}: PolicyTableProps) {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  const handleView = (id: string) => {
    navigate(`/policies/${id}`);
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await apiService.policies.getDownloadUrl(id);
      window.open(res.downloadUrl, '_blank');
    } catch {
      // api handles the error
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      onDelete(id);
    }
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    const pages: (number | string)[] = [];
    const { page, totalPages } = pagination;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(page + 1, totalPages - 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="card overflow-hidden">
      {/* filter bar */}
      <div className="p-4 border-b border-gray-300 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by policy number, customer, vehicle..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter || ''}
          onChange={(e) => onStatusFilter(e.target.value as PolicyStatus || undefined)}
          className="input w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* the table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Policy #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Insurer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Premium
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Uploaded By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-200/30 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-slate-600" />
                    <p>No policies found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr
                  key={policy.id}
                  className="hover:bg-white/30 transition-colors cursor-pointer"
                  onClick={() => handleView(policy.id)}
                >
                  <td className="px-4 py-4">
                    <span className="font-mono-policy text-sm text-blue-600">
                      {policy.policy_number || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-800">{policy.customer_name || '-'}</td>
                  <td className="px-4 py-4 font-mono-policy text-sm text-gray-700">
                    {policy.vehicle_number || '-'}
                  </td>
                  <td className="px-4 py-4 text-gray-700">{policy.insurer || '-'}</td>
                  <td className="px-4 py-4 text-gray-800">{formatPremium(policy.premium)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={policy.status} />
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-sm">
                    {policy.uploader_name || '-'}
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-sm">
                    {formatDate(policy.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleView(policy.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(policy.id)}
                        className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pages */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-300 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((page, i) =>
              typeof page === 'number' ? (
                <button
                  key={i}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === pagination.page
                      ? 'bg-blue-600 text-slate-950 font-medium'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={i} className="px-2 text-gray-500">
                  {page}
                </span>
              )
            )}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}