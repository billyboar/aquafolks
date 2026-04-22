'use client';

import { useState } from 'react';
import { useCreateReport, type ReportableType, type ReportReason } from '@/lib/api/admin';

interface ReportButtonProps {
  reportableType: ReportableType;
  reportableId: string;
  reportedUserId?: string;
  className?: string;
}

export default function ReportButton({
  reportableType,
  reportableId,
  reportedUserId,
  className = '',
}: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');

  const createReport = useCreateReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createReport.mutateAsync({
        reportable_type: reportableType,
        reportable_id: reportableId,
        reported_user_id: reportedUserId,
        reason,
        description: description || undefined,
      });

      // Reset form
      setReason('spam');
      setDescription('');
      setShowModal(false);
      alert('Report submitted successfully. Our moderation team will review it.');
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`text-sm text-gray-500 hover:text-red-600 ${className}`}
        title="Report this content"
      >
        Report
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Content</h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="spam">Spam</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="harassment">Harassment</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="scam">Scam</option>
                  <option value="fake_listing">Fake Listing</option>
                  <option value="animal_abuse">Animal Abuse</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please provide any additional information..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setReason('spam');
                    setDescription('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReport.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {createReport.isPending ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
