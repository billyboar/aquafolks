'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import PhotoViewer from '@/components/PhotoViewer';
import VideoEmbed from '@/components/VideoEmbed';
import ReportButton from '@/components/ReportButton';
import type { Project, ProjectUpdate } from '@/lib/types';
import { useProjectSubscriptionStatus, useSubscribeToProject, useUnsubscribeFromProject } from '@/lib/api/notifications';

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedTank, setRelatedTank] = useState<any>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateContent, setUpdateContent] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateMedia, setUpdateMedia] = useState<{file: File, preview: string, type: 'image' | 'video'}[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<{url: string, caption?: string}[]>([]);
  const [photoViewerInitialIndex, setPhotoViewerInitialIndex] = useState(0);

  // Subscription hooks
  const { data: isSubscribed, isLoading: subscriptionLoading } = useProjectSubscriptionStatus(projectId);
  const subscribe = useSubscribeToProject();
  const unsubscribe = useUnsubscribeFromProject();

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/api/v1/projects/${projectId}`);
      setProject(response.data.project);
      
      // Load updates
      const updatesResponse = await api.get(`/api/v1/projects/${projectId}/updates`);
      setUpdates(updatesResponse.data.updates || []);

      // Load related tank if exists
      if (response.data.project.tank_id) {
        try {
          const tankResponse = await api.get(`/api/v1/tanks/${response.data.project.tank_id}`);
          setRelatedTank(tankResponse.data.tank);
        } catch {
          // Tank might have been deleted
        }
      }
    } catch (err: any) {
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/v1/projects/${projectId}`);
      router.push('/projects');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent.trim()) return;

    setUpdateSubmitting(true);
    try {
      // Upload media files first if any
      const mediaUrls: {media_url: string, media_type: 'image' | 'video', display_order: number}[] = [];
      
      if (updateMedia.length > 0) {
        setUploadingMedia(true);
        for (let i = 0; i < updateMedia.length; i++) {
          const media = updateMedia[i];
          const formData = new FormData();
          formData.append('media', media.file);
          
          const uploadResponse = await api.post('/api/v1/projects/upload-media', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          mediaUrls.push({
            media_url: uploadResponse.data.media_url,
            media_type: uploadResponse.data.media_type,
            display_order: i,
          });
        }
        setUploadingMedia(false);
      }

      // Add video URL if provided
      if (videoUrl.trim()) {
        mediaUrls.push({
          media_url: videoUrl.trim(),
          media_type: 'video',
          display_order: mediaUrls.length,
        });
      }

      // Create the update with media
      await api.post(`/api/v1/projects/${projectId}/updates`, {
        title: 'Progress Update',
        content: updateContent,
        media: mediaUrls.length > 0 ? mediaUrls : undefined,
      });
      
      // Clean up
      updateMedia.forEach(m => URL.revokeObjectURL(m.preview));
      setUpdateContent('');
      setUpdateMedia([]);
      setVideoUrl('');
      setShowUpdateForm(false);
      
      // Reload updates
      const updatesResponse = await api.get(`/api/v1/projects/${projectId}/updates`);
      setUpdates(updatesResponse.data.updates || []);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add update');
    } finally {
      setUpdateSubmitting(false);
      setUploadingMedia(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 5;
    
    if (updateMedia.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} media files allowed`);
      return;
    }

    const newMedia = files.map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        file,
        preview: URL.createObjectURL(file),
        type: (isVideo ? 'video' : 'image') as 'image' | 'video',
      };
    });

    setUpdateMedia([...updateMedia, ...newMedia]);
  };

  const handleRemoveMedia = (index: number) => {
    const media = updateMedia[index];
    URL.revokeObjectURL(media.preview);
    setUpdateMedia(updateMedia.filter((_, i) => i !== index));
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (!confirm('Delete this update?')) return;

    try {
      await api.delete(`/api/v1/projects/updates/${updateId}`);
      setUpdates(updates.filter(u => u.id !== updateId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete update');
    }
  };

  const handleImageClick = (photos: {url: string, caption?: string}[], index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerInitialIndex(index);
    setPhotoViewerOpen(true);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]',
      in_progress: 'bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.planning;
  };

  const handleSubscriptionToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe.mutateAsync(projectId);
      } else {
        await subscribe.mutateAsync(projectId);
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-[hsl(var(--on-surface-variant))]">Loading project...</p>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm mb-6">
            {error || 'Project not found'}
          </div>
          <Link
            href="/projects"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            ← Back to Projects
          </Link>
        </div>
      </>
    );
  }

  const isOwner = user?.id === project.user_id;

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="text-sm text-[hsl(var(--primary))] hover:underline mb-4 inline-block"
          >
            ← Back to Projects
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))]">
                  {getProjectTypeLabel(project.project_type)}
                </span>
                <span className={`px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isOwner && user && (
                <>
                  <button
                    onClick={handleSubscriptionToggle}
                    disabled={subscriptionLoading || subscribe.isPending || unsubscribe.isPending}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                      isSubscribed
                        ? 'bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))] hover:bg-[hsl(var(--primary-container)/0.8)]'
                        : 'border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))]'
                    }`}
                  >
                    {isSubscribed ? (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Subscribed
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Subscribe
                      </>
                    )}
                  </button>
                  <ReportButton
                    reportableType="project"
                    reportableId={projectId}
                    reportedUserId={project.user_id}
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-red-600"
                  />
                </>
              )}
              {isOwner && (
                <Link
                  href={`/projects/${projectId}/edit`}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                >
                  Edit Project
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Likes Section */}
        <div className="mb-8">
          <LikeButton likeableType="project" likeableId={projectId} />
        </div>

        {/* Cover Photo */}
        {project.cover_photo_url && project.cover_photo_url.trim() !== '' && (
          <div className="mb-8">
            <div
              className="h-96 relative rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick([{ url: project.cover_photo_url, caption: project.title }], 0)}
            >
              <Image
                src={project.cover_photo_url}
                alt={project.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-[hsl(var(--on-surface-variant))] whitespace-pre-wrap">
                {project.description}
              </p>
            </section>

            {/* Project Updates Timeline */}
            <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Progress Updates</h2>
                {isOwner && !showUpdateForm && (
                  <button
                    onClick={() => setShowUpdateForm(true)}
                    className="px-4 py-2 text-sm rounded-full bg-[hsl(var(--primary))] text-white hover:shadow-lg transition-shadow"
                  >
                    Add Update
                  </button>
                )}
              </div>

              {showUpdateForm && (
                <form onSubmit={handleSubmitUpdate} className="mb-6 p-4 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--outline))]">
                  <textarea
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent resize-none"
                    rows={4}
                    placeholder="What progress have you made? Share an update..."
                    required
                  />
                  
                  {/* Media Previews */}
                  {updateMedia.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {updateMedia.map((media, index) => (
                        <div key={index} className="relative group">
                          {media.type === 'image' ? (
                            <Image
                              src={media.preview}
                              alt="Upload preview"
                              width={200}
                              height={200}
                              className="w-full h-32 object-cover rounded-lg"
                              unoptimized
                            />
                          ) : (
                            <video
                              src={media.preview}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 items-center flex-wrap">
                    {/* Media Upload Button */}
                    <label className="px-4 py-2 text-sm rounded-full border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors cursor-pointer">
                      📷 Add Photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMediaSelect}
                        className="hidden"
                        disabled={updateSubmitting || uploadingMedia}
                      />
                    </label>

                    {/* Video URL Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="🎥 Or paste video URL (YouTube, Vimeo, etc.)"
                        className="px-4 py-2 text-sm rounded-full border border-[hsl(var(--outline))] bg-[hsl(var(--surface-container-lowest))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] w-80"
                        disabled={updateSubmitting || uploadingMedia}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updateSubmitting || uploadingMedia}
                      className="px-4 py-2 text-sm rounded-full bg-[hsl(var(--primary))] text-white hover:shadow-lg transition-shadow disabled:opacity-50"
                    >
                      {uploadingMedia ? 'Uploading...' : updateSubmitting ? 'Posting...' : 'Post Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateForm(false);
                        setUpdateContent('');
                        updateMedia.forEach(m => URL.revokeObjectURL(m.preview));
                        setUpdateMedia([]);
                        setVideoUrl('');
                      }}
                      className="px-4 py-2 text-sm rounded-full border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {updates.length === 0 ? (
                <p className="text-sm text-[hsl(var(--on-surface-variant))]">
                  No updates yet. {isOwner && 'Share your progress!'}
                </p>
              ) : (
                <div className="space-y-4">
                  {updates.map((update) => (
                    <div
                      key={update.id}
                      className="p-4 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--outline-variant))]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-[hsl(var(--on-surface-variant))]">
                          {new Date(update.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteUpdate(update.id)}
                            className="text-xs text-[hsl(var(--error))] hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-[hsl(var(--on-surface))] whitespace-pre-wrap mb-3">
                        {update.content}
                      </p>
                      
                      {/* Display Media */}
                      {update.media && update.media.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {update.media.map((media, mediaIndex) => (
                            <div key={media.id} className="relative">
                              {media.media_type === 'image' ? (
                                <div
                                  onClick={() => {
                                    const imagePhotos = update.media!
                                      .filter(m => m.media_type === 'image')
                                      .map(m => ({ url: m.media_url, caption: m.caption }));
                                    const imageIndex = update.media!
                                      .filter(m => m.media_type === 'image')
                                      .findIndex(m => m.id === media.id);
                                    handleImageClick(imagePhotos, imageIndex);
                                  }}
                                  className="cursor-pointer hover:opacity-90 transition-opacity"
                                >
                                  <Image
                                    src={media.media_url}
                                    alt={media.caption || 'Update image'}
                                    width={400}
                                    height={300}
                                    className="w-full h-48 object-cover rounded-lg"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <VideoEmbed 
                                  url={media.media_url}
                                  className="w-full"
                                />
                              )}
                              {media.caption && (
                                <p className="text-xs text-[hsl(var(--on-surface-variant))] mt-1">
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[hsl(var(--on-surface-variant))] mb-1">Project Type</div>
                  <div className="font-medium">{getProjectTypeLabel(project.project_type)}</div>
                </div>

                <div>
                  <div className="text-[hsl(var(--on-surface-variant))] mb-1">Status</div>
                  <div className="font-medium">{getStatusLabel(project.status)}</div>
                </div>

                {relatedTank && (
                  <div>
                    <div className="text-[hsl(var(--on-surface-variant))] mb-1">Related Tank</div>
                    <Link
                      href={`/tanks/${relatedTank.id}`}
                      className="font-medium text-[hsl(var(--primary))] hover:underline"
                    >
                      {relatedTank.name}
                    </Link>
                  </div>
                )}

                <div>
                  <div className="text-[hsl(var(--on-surface-variant))] mb-1">Started</div>
                  <div className="font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>

                {project.updated_at !== project.created_at && (
                  <div>
                    <div className="text-[hsl(var(--on-surface-variant))] mb-1">Last Updated</div>
                    <div className="font-medium">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {isOwner && (
              <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <div className="space-y-2">
                  <Link
                    href={`/projects/${projectId}/edit`}
                    className="block w-full px-4 py-2 text-center rounded-lg border border-[hsl(var(--outline))] hover:bg-[hsl(var(--surface-container))] transition-colors"
                  >
                    Edit Project
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="block w-full px-4 py-2 text-center rounded-lg border border-[hsl(var(--error))] text-[hsl(var(--error))] hover:bg-[hsl(var(--error-container))] transition-colors"
                  >
                    Delete Project
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-3xl">
          <CommentSection commentableType="project" commentableId={projectId} />
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {photoViewerOpen && (
        <PhotoViewer
          photos={photoViewerPhotos}
          initialIndex={photoViewerInitialIndex}
          onClose={() => setPhotoViewerOpen(false)}
        />
      )}
    </>
  );
}
