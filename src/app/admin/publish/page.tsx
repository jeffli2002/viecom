'use client';

import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import { Upload, X } from 'lucide-react';
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
  const redirectToLogin = useCallback(() => {
    window.location.href = '/admin/login';
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/publish/submissions?status=${statusFilter}`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load submissions');
      }
      const data = await response.json();
      const entries: SubmissionResponse[] = Array.isArray(data.submissions) ? data.submissions : [];
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
  }, [statusFilter, redirectToLogin]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const handleFormChange = (submissionId: string, updates: Partial<SubmissionFormState>) => {
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
        toast.success(decision === 'approved' ? 'Submission approved' : 'Submission rejected');
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
    const reason = window.prompt('Provide a rejection reason for the creator:')?.trim();
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
      <LandingShowcaseConfigurator />
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
                  <p>Created at {new Date(submission.createdAt).toLocaleString()}</p>
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
                      onChange={(e) => handleFormChange(submission.id, { notes: e.target.value })}
                      placeholder="Optional notes for audit log"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                    onClick={() => handleApprove(submission)}
                  >
                    Approve & Publish
                  </button>
                  <button
                    type="button"
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
type LandingShowcaseEntry = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  ctaUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
};

function LandingShowcaseConfigurator() {
  const [entries, setEntries] = useState<LandingShowcaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [landingSubmissions, setLandingSubmissions] = useState<SubmissionResponse[]>([]);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: 'other',
    ctaUrl: '',
    imageUrl: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draggedAdminIndex, setDraggedAdminIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!file && form.imageUrl) {
      setPreviewUrl(form.imageUrl);
    } else if (!file && !form.imageUrl) {
      setPreviewUrl(null);
    }
  }, [file, form.imageUrl]);

  const handleAdminUnauthorized = useCallback(() => {
    window.location.href = '/admin/login';
  }, []);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/landing-showcase', { cache: 'no-store' });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
      const data = await response.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load landing showcase entries');
    } finally {
      setIsLoading(false);
    }
  }, [handleAdminUnauthorized]);

  const fetchLandingSubmissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/publish/submissions?status=approved', {
        cache: 'no-store',
      });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
      const data = await response.json();
      if (Array.isArray(data.submissions)) {
        const landingOnly = data.submissions.filter(
          (submission: SubmissionResponse) => submission.publishToLanding
        );
        setLandingSubmissions(landingOnly);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load landing page submissions');
    }
  }, [handleAdminUnauthorized]);

  useEffect(() => {
    void fetchEntries();
    void fetchLandingSubmissions();
  }, [fetchEntries, fetchLandingSubmissions]);

  const uploadFileDirectly = async (uploadFile: File) => {
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('fileName', uploadFile.name);
    formData.append('contentType', uploadFile.type || 'application/octet-stream');

    const response = await fetch('/api/admin/uploads/direct', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.publicUrl) {
      throw new Error(data?.error || 'Upload failed. Please try again.');
    }
    return data.publicUrl as string;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const selected = files[0];
    setFile(selected);
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(selected);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer?.files?.length) {
      handleFileSelect(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleCreateEntry = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsSaving(true);
    try {
      let imageUrl = form.imageUrl.trim();
      if (file) {
        imageUrl = await uploadFileDirectly(file);
      }
      if (!imageUrl) {
        throw new Error('Image is required');
      }
      const response = await fetch('/api/admin/landing-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          category: form.category,
          ctaUrl: form.ctaUrl.trim() || null,
        }),
      });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create entry');
      }
      toast.success('Showcase entry added');
      setForm({
        title: '',
        subtitle: '',
        category: 'other',
        ctaUrl: '',
        imageUrl: '',
      });
      setFile(null);
      setPreviewUrl(null);
      setIsModalOpen(false);
      await fetchEntries();
      await fetchLandingSubmissions();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to create entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Remove this showcase entry?')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/landing-showcase/${entryId}`, {
        method: 'DELETE',
      });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to remove entry');
      }
      toast.success('Entry removed');
      await fetchEntries();
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove entry');
    }
  };

  const handleReorder = async (from: number, to: number) => {
    if (to < 0 || to >= entries.length || from === to) {
      return;
    }
    const updatedEntries = [...entries];
    const [moved] = updatedEntries.splice(from, 1);
    updatedEntries.splice(to, 0, moved);
    setEntries(updatedEntries);
    try {
      const response = await fetch('/api/admin/landing-showcase/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: updatedEntries.map((entry) => entry.id) }),
      });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to reorder entries');
      void fetchEntries();
    }
  };

  const handleLandingSubmissionRemove = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/publish/submissions/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, publishToLanding: false }),
      });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to remove landing submission');
      }
      toast.success('Removed from landing showcase');
      await fetchLandingSubmissions();
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove landing submission');
    }
  };

  const _handleLandingSubmissionToggle = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/publish/submissions/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, publishToLanding: true }),
      });
      if (response.status === 401) {
        handleAdminUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to add landing submission');
      }
      toast.success('Added to landing showcase');
      await fetchLandingSubmissions();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add landing submission');
    }
  };

  const combinedLandingItems = [
    ...entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      previewUrl: entry.imageUrl,
      type: 'admin' as const,
      data: entry,
    })),
    ...landingSubmissions.map((submission) => ({
      id: submission.id,
      title: submission.title || 'User submission',
      previewUrl: submission.previewUrl ?? submission.assetUrl,
      type: 'submission' as const,
      data: submission,
    })),
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-teal-500">Landing Page Showcase</p>
          <h2 className="text-2xl font-bold text-slate-900">Featured slots</h2>
          <p className="text-sm text-slate-500">
            Upload custom creatives, reorder highlights, and control visibility.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          onClick={() => setIsModalOpen(true)}
        >
          Add Showcase Entry
        </button>
      </div>
      <div className="rounded-xl border border-dashed border-slate-200 p-4">
        {isLoading ? (
          <p className="text-center text-sm text-slate-500">Loading showcase entries...</p>
        ) : combinedLandingItems.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No landing entries yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {combinedLandingItems.map((item) => {
              const isSubmission = item.type === 'submission';
              const previewUrl = item.previewUrl;
              const isVideo =
                previewUrl?.match(/\\.mp4$|\\.webm$|\\.mov$/i) ||
                (isSubmission &&
                  (item.data as SubmissionResponse).assetUrl.match(/\\.mp4$|\\.webm$|\\.mov$/i));
              const adminIndex =
                item.type === 'admin' ? entries.findIndex((entry) => entry.id === item.id) : -1;
              const isDraggable = !isSubmission && adminIndex >= 0;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="relative flex h-40 w-32 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  draggable={isDraggable}
                  onDragStart={() => {
                    if (isDraggable) {
                      setDraggedAdminIndex(adminIndex);
                    }
                  }}
                  onDragOver={(event) => {
                    if (isDraggable && draggedAdminIndex !== null) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => {
                    if (isDraggable && draggedAdminIndex !== null && adminIndex >= 0) {
                      event.preventDefault();
                      if (draggedAdminIndex !== adminIndex) {
                        handleReorder(draggedAdminIndex, adminIndex);
                      }
                      setDraggedAdminIndex(null);
                    }
                  }}
                  onDragEnd={() => setDraggedAdminIndex(null)}
                >
                  <button
                    type="button"
                    onClick={() =>
                      isSubmission ? handleLandingSubmissionRemove(item.id) : handleDelete(item.id)
                    }
                    className="absolute right-1 top-1 z-10 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Remove entry"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="h-28 w-full bg-slate-100">
                    {isVideo ? (
                      <video
                        src={previewUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 px-2 py-1 text-center text-xs font-semibold text-slate-700">
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 text-slate-700">
            <h3 className="text-xl font-semibold">Add Landing Showcase</h3>
            <div className="space-y-2">
              <label htmlFor="showcase-title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="showcase-title"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="showcase-subtitle" className="text-sm font-medium">
                Subtitle
              </label>
              <input
                id="showcase-subtitle"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.subtitle}
                onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="showcase-category" className="text-sm font-medium">
                Category
              </label>
              <select
                id="showcase-category"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {SHOWCASE_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="showcase-cta-url" className="text-sm font-medium">
                CTA URL (optional)
              </label>
              <input
                id="showcase-cta-url"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.ctaUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Upload Image</span>
              <section
                id="showcase-image-upload"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center ${
                  isDragging ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50'
                }`}
                aria-label="Upload image by dragging and dropping or clicking"
              >
                {previewUrl || form.imageUrl ? (
                  <div className="mt-4 w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-48 w-full object-cover" />
                    ) : form.imageUrl ? (
                      <img src={form.imageUrl} alt="Preview" className="h-48 w-full object-cover" />
                    ) : null}
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-400" />
                    <p className="mt-3 text-sm text-slate-600">
                      Drag & drop an image, or{' '}
                      <button
                        type="button"
                        className="text-teal-500 underline"
                        onClick={() => document.getElementById('landing-upload-input')?.click()}
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                  </>
                )}
                <input
                  id="landing-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </section>
              <p className="text-xs text-slate-500">Or provide an image URL:</p>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
                onClick={handleCreateEntry}
                disabled={isSaving}
              >
                {isSaving ? 'Uploading...' : 'Add Showcase'}
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
