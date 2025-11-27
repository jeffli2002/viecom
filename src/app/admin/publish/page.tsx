'use client';

import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type SubmissionResponse = {
  id: string;
  assetUrl: string;
  previewUrl: string | null;
  title: string | null;
  prompt: string | null;
  category: string | null;
  status: 'pending' | 'approved' | 'rejected';
  publishToLanding: boolean;
  publishToShowcase: boolean;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  categoryLabel?: string;
};

type SubmissionFormState = {
  publishToLanding: boolean;
  publishToShowcase: boolean;
  category: string;
  notes: string;
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export default function AdminPublishPage() {
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [formState, setFormState] = useState<Record<string, SubmissionFormState>>({});
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/publish/submissions?status=${statusFilter}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load submissions');
      }
      const data = await response.json();
      const entries: SubmissionResponse[] = Array.isArray(data.submissions)
        ? data.submissions
        : [];
      setSubmissions(entries);
      const defaults: Record<string, SubmissionFormState> = {};
      entries.forEach((item) => {
        defaults[item.id] = {
          publishToLanding: item.publishToLanding ?? false,
          publishToShowcase: item.publishToShowcase ?? true,
          category: item.category ?? 'other',
          notes: item.adminNotes ?? '',
        };
      });
      setFormState(defaults);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load publish submissions');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const handleFormChange = (
    submissionId: string,
    updates: Partial<SubmissionFormState>
  ) => {
    setFormState((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        ...updates,
      },
    }));
  };

  const sendDecision = useCallback(
    async (
      submissionId: string,
      decision: 'approved' | 'rejected',
      extras?: Partial<SubmissionFormState> & { rejectionReason?: string }
    ) => {
      try {
        const payload = {
          status: decision,
          publishToLanding: extras?.publishToLanding,
          publishToShowcase: extras?.publishToShowcase,
          category: extras?.category,
          adminNotes: extras?.notes,
          rejectionReason: extras?.rejectionReason,
        };
        const response = await fetch(`/api/admin/publish/submissions/${submissionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || 'Request failed');
        }
        toast.success(
          decision === 'approved' ? 'Submission approved' : 'Submission rejected'
        );
        await fetchSubmissions();
      } catch (error) {
        console.error(error);
        toast.error('Failed to update submission');
      }
    },
    [fetchSubmissions]
  );

  const handleApprove = (submission: SubmissionResponse) => {
    const current = formState[submission.id];
    if (!current) {
      return;
    }
    if (!current.publishToLanding && !current.publishToShowcase) {
      toast.error('Select at least one destination.');
      return;
    }
    sendDecision(submission.id, 'approved', current);
  };

  const handleReject = (submission: SubmissionResponse) => {
    const reason = window
      .prompt('Provide a rejection reason for the creator:')
      ?.trim();
    sendDecision(submission.id, 'rejected', {
      ...formState[submission.id],
      rejectionReason: reason || 'Not approved for showcase.',
    });
  };

  const emptyState = useMemo(
    () => !isLoading && submissions.length === 0,
    [isLoading, submissions]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Publish Audit</h1>
          <p className="text-slate-500">
            Review user submissions and decide where they should appear.
          </p>
        </div>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Loading submissions...
        </div>
      )}

      {emptyState && (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          No submissions found for this filter.
        </div>
      )}

      <div className="grid gap-6">
        {submissions.map((submission) => {
          const form = formState[submission.id] ?? {
            publishToLanding: false,
            publishToShowcase: true,
            category: 'other',
            notes: '',
          };
          return (
            <div
              key={submission.id}
              className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-[220px,1fr]"
            >
              <div className="flex flex-col gap-3">
                <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <Image
                    src={submission.previewUrl ?? submission.assetUrl}
                    alt={submission.title ?? 'Submission asset'}
                    width={320}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </div>
                <a
                  href={submission.assetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-center text-teal-500 hover:underline"
                >
                  Open full asset
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-teal-500">
                    {submission.status}
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {submission.title || 'Untitled asset'}
                  </h2>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {submission.prompt || 'No prompt provided'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p>
                    Submitted by{' '}
                    <span className="font-semibold text-slate-900">
                      {submission.user?.email || 'Unknown'}
                    </span>
                  </p>
                  <p>
                    Created at{' '}
                    {new Date(submission.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.publishToLanding}
                      onChange={(e) =>
                        handleFormChange(submission.id, {
                          publishToLanding: e.target.checked,
                        })
                      }
                    />
                    <span>Feature on landing page</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.publishToShowcase}
                      onChange={(e) =>
                        handleFormChange(submission.id, {
                          publishToShowcase: e.target.checked,
                        })
                      }
                    />
                    <span>Include in showcase page</span>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">Category</p>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={form.category}
                      onChange={(e) =>
                        handleFormChange(submission.id, { category: e.target.value })
                      }
                    >
                      {SHOWCASE_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">Notes</p>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={form.notes}
                      onChange={(e) =>
                        handleFormChange(submission.id, { notes: e.target.value })
                      }
                      placeholder="Optional notes for audit log"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                    onClick={() => handleApprove(submission)}
                  >
                    Approve & Publish
                  </button>
                  <button
                    className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => handleReject(submission)}
                  >
                    Reject
                  </button>
                  <a
                    href={submission.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open asset
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
