'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useReports, useUpdateReport, type Report, type ReportStatus } from '@/lib/api/admin';

export default function AdminReports() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [moderatorNote, setModeratorNote] = useState('');

  const { data: reports, isLoading, refetch } = useReports({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const updateReport = useUpdateReport();

  // Check if user has access
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    router.push('/');
    return null;
  }

  const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
    try {
      await updateReport.mutateAsync({
        id: reportId,
        status,
        moderator_note: moderatorNote || undefined,
      });
      setModeratorNote('');
      setSelectedReport(null);
      refetch();
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getReportableTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tank: 'Tank',
      listing: 'Listing',
      project: 'Project',
      comment: 'Comment',
      user: 'User',
    };
    return labels[type] || type;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate_content: 'Inappropriate Content',
      harassment: 'Harassment',
      misinformation: 'Misinformation',
      copyright: 'Copyright Violation',
      scam: 'Scam',
      fake_listing: 'Fake Listing',
      animal_abuse: 'Animal Abuse',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Reports</h1>
              <p className="text-gray-600 mt-1">Review and manage user-reported content</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading reports...</div>
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">No reports found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {getReportableTypeLabel(report.reportable_type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Report #{report.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Reason:</strong> {getReasonLabel(report.reason)}
                    </div>
                    {report.description && (
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Description:</strong> {report.description}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Reported by: {report.reporter_username} • {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      {selectedReport?.id === report.id ? 'Cancel' : 'Review'}
                    </button>
                  </div>
                </div>

                {/* Review Panel */}
                {selectedReport?.id === report.id && (
                  <div className="border-t pt-4 mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moderator Note (optional)
                      </label>
                      <textarea
                        value={moderatorNote}
                        onChange={(e) => setModeratorNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Add a note about your decision..."
                      />
                    </div>
                    {report.moderator_note && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-1">Previous Note:</div>
                        <div className="text-sm text-gray-600">{report.moderator_note}</div>
                        {report.reviewed_by_username && (
                          <div className="text-xs text-gray-500 mt-1">
                            By {report.reviewed_by_username} on {new Date(report.reviewed_at || '').toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {report.status !== 'reviewing' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                          disabled={updateReport.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Mark Under Review
                        </button>
                      )}
                      {report.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          disabled={updateReport.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}
                      {report.status !== 'dismissed' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          disabled={updateReport.isPending}
                          className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
