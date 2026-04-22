'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import type { Project, ProjectType, ProjectStatus } from '@/lib/types';

const projectTypes: { value: ProjectType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'aquascaping', label: 'Aquascaping' },
  { value: 'disease_treatment', label: 'Disease Treatment' },
  { value: 'equipment_diy', label: 'Equipment DIY' },
  { value: 'species_care', label: 'Species Care' },
  { value: 'biotope', label: 'Biotope' },
];

const projectStatuses: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'abandoned', label: 'Abandoned' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<ProjectType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    loadProjects();
  }, [selectedType, selectedStatus]);

  const loadProjects = async () => {
    try {
      const params: any = {};
      if (selectedType !== 'all') params.project_type = selectedType;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await api.get('/api/v1/projects', { params });
      setProjects(response.data.projects || []);
    } catch (err: any) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breeding: 'Breeding',
      aquascaping: 'Aquascaping',
      disease_treatment: 'Disease Treatment',
      equipment_diy: 'Equipment DIY',
      species_care: 'Species Care',
      biotope: 'Biotope',
    };
    return labels[type] || type;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning',
      in_progress: 'In Progress',
      completed: 'Completed',
      on_hold: 'On Hold',
      abandoned: 'Abandoned',
    };
    return labels[status] || status;
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Projects</h1>
              <p className="text-text-secondary">
                Discover and share aquarium projects from the community
              </p>
            </div>
            {user && (
              <Link
                href="/projects/new"
                className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
              >
                + Start Project
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Project Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Project Type</label>
            <div className="flex flex-wrap gap-2">
              {projectTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedType === type.value
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {projectStatuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status.value
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))]'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-text-secondary">Loading projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="bg-surface rounded-lg p-12 text-center border border-border">
            <div className="text-5xl mb-4">🔬</div>
            <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
            <p className="text-text-secondary mb-6">
              {selectedType === 'all' && selectedStatus === 'all'
                ? 'Be the first to start a project!'
                : 'No projects match your filters. Try adjusting them.'}
            </p>
            {user && (
              <Link
                href="/projects/new"
                className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] hover:shadow-lg transition-shadow"
              >
                Start Your Project
              </Link>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-surface rounded-lg overflow-hidden border border-border hover:border-[hsl(var(--primary))] transition-colors group"
              >
                {/* Project Image */}
                <div className="h-48 relative bg-gradient-to-br from-[hsl(var(--primary-container))] to-[hsl(var(--secondary-container))]">
                  {project.cover_photo_url ? (
                    <Image
                      src={project.cover_photo_url}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <div className="text-6xl">🔬</div>
                    </div>
                  )}
                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/90 text-gray-800">
                      {getProjectTypeLabel(project.project_type)}
                    </span>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1 flex-1">
                      {project.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 whitespace-nowrap ${getStatusBadgeColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>By {project.user?.display_name || project.user?.username || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
