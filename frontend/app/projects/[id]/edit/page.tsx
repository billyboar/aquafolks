'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import type { ProjectType, ProjectStatus, Project } from '@/lib/types';

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

export default function EditProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [userTanks, setUserTanks] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'breeding' as ProjectType,
    status: 'planning' as ProjectStatus,
    tank_id: undefined as number | undefined,
  });

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        const response = await api.get(`/api/v1/projects/${projectId}`);
        const projectData = response.data.project;
        setProject(projectData);
        
        // Pre-fill form
        setFormData({
          title: projectData.title,
          description: projectData.description,
          project_type: projectData.project_type,
          status: projectData.status,
          tank_id: projectData.tank_id,
        });

        // Fetch user's tanks
        if (user) {
          const tanksResponse = await api.get(`/api/v1/tanks?user_id=${user.id}`);
          setUserTanks(tanksResponse.data.tanks || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load project');
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, user]);

  // Check authorization
  useEffect(() => {
    if (!loadingProject && project && user && project.user_id !== user.id) {
      setError('You are not authorized to edit this project');
    }
  }, [project, user, loadingProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.title.trim()) {
        throw new Error('Project title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Project description is required');
      }

      await api.put(`/api/v1/projects/${projectId}`, formData);
      
      // Redirect to the project detail page
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingProject) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-[hsl(var(--on-surface-variant))]">Loading project...</p>
          </div>
        </div>
      </>
    );
  }

  if (!project || (project.user_id !== user.id)) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm">
            {error || 'You are not authorized to edit this project'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Project</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Update your project information
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

          {/* Related Tank */}
          <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Related Tank</h2>
              <p className="text-sm text-[hsl(var(--on-surface-variant))] mb-4">
                Link this project to one of your tanks (optional)
              </p>
            </div>

            {userTanks.length === 0 ? (
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

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="flex-1 px-6 py-3 rounded-full font-semibold border border-[hsl(var(--outline))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
