'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import type { ProjectType, ProjectStatus, CreateProjectInput } from '@/lib/types';

const projectTypes: { value: ProjectType; label: string; description: string }[] = [
  { value: 'breeding', label: 'Breeding', description: 'Fish or coral breeding projects' },
  { value: 'aquascaping', label: 'Aquascaping', description: 'Hardscape and plant layout projects' },
  { value: 'disease_treatment', label: 'Disease Treatment', description: 'Treating sick fish or corals' },
  { value: 'equipment_diy', label: 'Equipment DIY', description: 'Custom equipment builds' },
  { value: 'species_care', label: 'Species Care', description: 'Caring for specific species' },
  { value: 'biotope', label: 'Biotope', description: 'Natural habitat recreation' },
];

const projectStatuses: { value: ProjectStatus; label: string; description: string }[] = [
  { value: 'planning', label: 'Planning', description: 'Researching and preparing' },
  { value: 'in_progress', label: 'In Progress', description: 'Actively working on it' },
  { value: 'completed', label: 'Completed', description: 'Successfully finished' },
  { value: 'on_hold', label: 'On Hold', description: 'Temporarily paused' },
  { value: 'abandoned', label: 'Abandoned', description: 'No longer pursuing' },
];

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTanks, setUserTanks] = useState<any[]>([]);
  const [tanksLoading, setTanksLoading] = useState(true);
  
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    description: '',
    project_type: 'breeding',
    status: 'planning',
  });

  // Fetch user's tanks on mount
  useEffect(() => {
    const fetchTanks = async () => {
      if (!user) {
        setTanksLoading(false);
        return;
      }
      try {
        const response = await api.get(`/api/v1/tanks?user_id=${user.id}`);
        setUserTanks(response.data.tanks || []);
      } catch (err) {
        console.error('Failed to fetch tanks:', err);
      } finally {
        setTanksLoading(false);
      }
    };
    fetchTanks();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.title.trim()) {
        throw new Error('Project title is required');
      }

      // Create project
      const response = await api.post('/api/v1/projects', formData);
      const projectId = response.data.project.id;

      // TODO: Upload cover photo once backend endpoint is available
      // Cover photo upload will be added in a future update
      
      // Redirect to the project detail page
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a Project</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Document your aquarium journey and share your progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Project Title <span className="text-[hsl(var(--error))]">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                placeholder="e.g., Breeding Clownfish, 40G Planted Scape, Custom LED Build"
              />
            </div>

            <div>
              <label htmlFor="project-type" className="block text-sm font-medium mb-2">
                Project Type <span className="text-[hsl(var(--error))]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.project_type === type.value
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-container))]'
                        : 'border-[hsl(var(--outline))] hover:border-[hsl(var(--primary))]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="project-type"
                      value={type.value}
                      checked={formData.project_type === type.value}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value as ProjectType })}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium">{type.label}</span>
                      <span className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">
                        {type.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Current Status <span className="text-[hsl(var(--error))]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectStatuses.map((status) => (
                  <label
                    key={status.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.status === status.value
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-container))]'
                        : 'border-[hsl(var(--outline))] hover:border-[hsl(var(--primary))]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium">{status.label}</span>
                      <span className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">
                        {status.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description <span className="text-[hsl(var(--error))]">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent resize-none"
                placeholder="Describe your project goals, timeline, challenges, and what you hope to achieve..."
              />
            </div>
          </section>

          {/* Related Tank (Optional) */}
          <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Related Tank</h2>
              <p className="text-sm text-[hsl(var(--on-surface-variant))] mb-4">
                Link this project to one of your tanks (optional)
              </p>
            </div>

            {tanksLoading ? (
              <div className="text-center py-4 text-[hsl(var(--on-surface-variant))]">
                Loading your tanks...
              </div>
            ) : userTanks.length === 0 ? (
              <div className="text-center py-4 text-[hsl(var(--on-surface-variant))]">
                You don't have any tanks yet.{' '}
                <a href="/tanks/new" className="text-[hsl(var(--primary))] hover:underline">
                  Create one
                </a>
              </div>
            ) : (
              <div>
                <label htmlFor="tank-id" className="block text-sm font-medium mb-2">
                  Select Tank
                </label>
                <select
                  id="tank-id"
                  value={formData.tank_id || ''}
                  onChange={(e) => setFormData({ ...formData, tank_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                >
                  <option value="">None</option>
                  {userTanks.map((tank) => (
                    <option key={tank.id} value={tank.id}>
                      {tank.name} ({tank.volume_liters.toFixed(1)}L)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Cover Photo Section - Coming Soon */}
          <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Cover Photo</h2>
              <p className="text-sm text-[hsl(var(--on-surface-variant))] mb-4">
                Cover photo uploads coming soon! For now, you can add a cover photo after creating the project.
              </p>
            </div>
          </section>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-full font-semibold border border-[hsl(var(--outline))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
