'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import PhotoManager from '@/components/PhotoManager';
import type { TankType, Tank, TankPhoto } from '@/lib/types';

const tankTypes: { value: TankType; label: string; description: string }[] = [
  { value: 'freshwater', label: 'Freshwater', description: 'Community fish, cichlids, livebearers' },
  { value: 'planted', label: 'Planted', description: 'Aquascaped tanks with live plants' },
  { value: 'saltwater', label: 'Saltwater', description: 'Marine fish only' },
  { value: 'reef', label: 'Reef', description: 'Corals and marine invertebrates' },
  { value: 'brackish', label: 'Brackish', description: 'Mix of fresh and salt water' },
];

export default function EditTankPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tankId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingTank, setLoadingTank] = useState(true);
  const [error, setError] = useState('');
  const [tank, setTank] = useState<Tank | null>(null);
  const [photos, setPhotos] = useState<TankPhoto[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    volume_liters: 0,
    dimensions_length: 0,
    dimensions_width: 0,
    dimensions_height: 0,
    tank_type: 'freshwater' as TankType,
    description: '',
  });

  // Unit conversion
  const [volumeUnit, setVolumeUnit] = useState<'liters' | 'gallons'>('gallons');
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'inches'>('inches');

  // Fetch tank data
  useEffect(() => {
    const fetchTank = async () => {
      if (!tankId) return;
      
      try {
        const response = await api.get(`/api/v1/tanks/${tankId}`);
        const tankData = response.data.tank;
        setTank(tankData);
        
        // Pre-fill form
        setFormData({
          name: tankData.name,
          volume_liters: tankData.volume_liters,
          dimensions_length: tankData.dimensions_length || 0,
          dimensions_width: tankData.dimensions_width || 0,
          dimensions_height: tankData.dimensions_height || 0,
          tank_type: tankData.tank_type,
          description: tankData.description || '',
        });

        // Load photos
        const photosResponse = await api.get(`/api/v1/tanks/${tankId}/photos`);
        setPhotos(photosResponse.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load tank');
      } finally {
        setLoadingTank(false);
      }
    };

    fetchTank();
  }, [tankId]);

  // Check authorization
  useEffect(() => {
    if (!loadingTank && tank && user && tank.user_id !== user.id) {
      setError('You are not authorized to edit this tank');
    }
  }, [tank, user, loadingTank]);

  const handleVolumeChange = (value: number) => {
    const liters = volumeUnit === 'gallons' ? value * 3.78541 : value;
    setFormData({ ...formData, volume_liters: liters });
  };

  const handleDimensionChange = (field: 'dimensions_length' | 'dimensions_width' | 'dimensions_height', value: number) => {
    const cm = dimensionUnit === 'inches' ? value * 2.54 : value;
    const updatedData = { ...formData, [field]: cm };
    
    // Auto-calculate volume if all dimensions are present
    if (updatedData.dimensions_length > 0 && updatedData.dimensions_width > 0 && updatedData.dimensions_height > 0) {
      const volumeCm3 = updatedData.dimensions_length * updatedData.dimensions_width * updatedData.dimensions_height;
      const volumeLiters = volumeCm3 / 1000;
      updatedData.volume_liters = volumeLiters;
    }
    
    setFormData(updatedData);
  };

  const handlePhotosChange = async () => {
    // Reload photos after changes
    try {
      const photosResponse = await api.get(`/api/v1/tanks/${tankId}/photos`);
      setPhotos(photosResponse.data || []);
    } catch (err) {
      console.error('Failed to reload photos:', err);
    }
  };

  const displayVolume = volumeUnit === 'gallons' 
    ? (formData.volume_liters / 3.78541).toFixed(1)
    : formData.volume_liters.toFixed(1);

  const displayLength = dimensionUnit === 'inches'
    ? (formData.dimensions_length / 2.54).toFixed(1)
    : formData.dimensions_length.toFixed(1);

  const displayWidth = dimensionUnit === 'inches'
    ? (formData.dimensions_width / 2.54).toFixed(1)
    : formData.dimensions_width.toFixed(1);

  const displayHeight = dimensionUnit === 'inches'
    ? (formData.dimensions_height / 2.54).toFixed(1)
    : formData.dimensions_height.toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.name.trim()) {
        throw new Error('Tank name is required');
      }
      if (formData.volume_liters <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      await api.put(`/api/v1/tanks/${tankId}`, formData);
      
      // Redirect to the tank detail page
      router.push(`/tanks/${tankId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update tank. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingTank) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-[hsl(var(--on-surface-variant))]">Loading tank...</p>
          </div>
        </div>
      </>
    );
  }

  if (!tank || (tank.user_id !== user.id)) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] px-4 py-3 rounded-lg text-sm">
            {error || 'You are not authorized to edit this tank'}
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
          <h1 className="text-3xl font-bold mb-2">Edit Tank</h1>
          <p className="text-[hsl(var(--on-surface-variant))]">
            Update your tank information
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
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Tank Name <span className="text-[hsl(var(--error))]">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                placeholder="e.g., Living Room Reef, 20G Community Tank"
              />
            </div>

            <div>
              <label htmlFor="tank-type" className="block text-sm font-medium mb-2">
                Tank Type <span className="text-[hsl(var(--error))]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tankTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.tank_type === type.value
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-container))]'
                        : 'border-[hsl(var(--outline))] hover:border-[hsl(var(--primary))]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tank-type"
                      value={type.value}
                      checked={formData.tank_type === type.value}
                      onChange={(e) => setFormData({ ...formData, tank_type: e.target.value as TankType })}
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
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent resize-none"
                placeholder="Describe your tank setup, equipment, or anything special about it..."
              />
            </div>
          </section>

          {/* Tank Specifications */}
          <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold">Tank Specifications</h2>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="volume" className="block text-sm font-medium">
                  Volume <span className="text-[hsl(var(--error))]">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVolumeUnit('gallons')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      volumeUnit === 'gallons'
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))]'
                    }`}
                  >
                    Gallons
                  </button>
                  <button
                    type="button"
                    onClick={() => setVolumeUnit('liters')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      volumeUnit === 'liters'
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))]'
                    }`}
                  >
                    Liters
                  </button>
                </div>
              </div>
              <input
                id="volume"
                type="number"
                step="0.1"
                min="0"
                required
                value={displayVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                placeholder="0.0"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Dimensions (L × W × H)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('inches')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      dimensionUnit === 'inches'
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))]'
                    }`}
                  >
                    Inches
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('cm')}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      dimensionUnit === 'cm'
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'bg-[hsl(var(--surface-container))] text-[hsl(var(--on-surface))]'
                    }`}
                  >
                    CM
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="length" className="block text-xs text-[hsl(var(--on-surface-variant))] mb-1">
                    Length
                  </label>
                  <input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={displayLength}
                    onChange={(e) => handleDimensionChange('dimensions_length', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label htmlFor="width" className="block text-xs text-[hsl(var(--on-surface-variant))] mb-1">
                    Width
                  </label>
                  <input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    value={displayWidth}
                    onChange={(e) => handleDimensionChange('dimensions_width', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label htmlFor="height" className="block text-xs text-[hsl(var(--on-surface-variant))] mb-1">
                    Height
                  </label>
                  <input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={displayHeight}
                    onChange={(e) => handleDimensionChange('dimensions_height', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--outline))] bg-[hsl(var(--surface))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--on-surface-variant))] mt-2">
                {formData.dimensions_length > 0 && formData.dimensions_width > 0 && formData.dimensions_height > 0
                  ? 'Volume is automatically calculated from dimensions'
                  : 'Optional - volume will be auto-calculated when all dimensions are entered'}
              </p>
            </div>
          </section>

          {/* Photo Management */}
          <section className="bg-[hsl(var(--surface-container-lowest))] rounded-lg p-6">
            <PhotoManager
              tankId={tankId}
              existingPhotos={photos}
              onPhotosChange={handlePhotosChange}
            />
          </section>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/tanks/${tankId}`)}
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
