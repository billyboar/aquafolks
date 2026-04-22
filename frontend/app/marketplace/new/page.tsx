'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Image from 'next/image';
import type { ListingCategory, ListingPriceType } from '@/lib/types';

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('fish');
  const [condition, setCondition] = useState('n/a');
  const [priceType, setPriceType] = useState<ListingPriceType>('fixed');
  const [price, setPrice] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCountry, setLocationCountry] = useState('USA');
  const [photos, setPhotos] = useState<{ file: File; preview: string; url?: string }[]>([]);

  // Mock payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 10;

    if (photos.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    const photo = photos[index];
    URL.revokeObjectURL(photo.preview);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (priceType !== 'free' && !price) {
      alert('Please enter a price or select "Free"');
      return;
    }

    if (!locationCity || !locationState) {
      alert('Please enter your location');
      return;
    }

    // Move to payment step
    setStep('payment');
  };

  const handleMockPayment = async () => {
    setPaymentProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Upload photos first
    const photoUrls: string[] = [];
    if (photos.length > 0) {
      setUploadingPhotos(true);
      try {
        for (const photo of photos) {
          const formData = new FormData();
          formData.append('photo', photo.file);

          const uploadResponse = await api.post('/api/v1/marketplace/upload-photo', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          photoUrls.push(uploadResponse.data.photo_url);
        }
      } catch (err: any) {
        alert('Failed to upload photos: ' + err.message);
        setPaymentProcessing(false);
        setUploadingPhotos(false);
        return;
      }
      setUploadingPhotos(false);
    }

    // Create listing
    setSubmitting(true);
    try {
      const response = await api.post('/api/v1/marketplace', {
        title: title.trim(),
        description: description.trim(),
        category,
        condition: condition !== 'n/a' ? condition : null,
        price: priceType !== 'free' ? parseFloat(price) : null,
        price_type: priceType,
        location_city: locationCity,
        location_state: locationState,
        location_country: locationCountry,
        photos: photoUrls,
      });

      // Success!
      alert('Listing created successfully!');
      router.push(`/marketplace/${response.data.listing.id}`);
    } catch (err: any) {
      alert('Failed to create listing: ' + (err.response?.data?.error || err.message));
      setStep('form');
    } finally {
      setSubmitting(false);
      setPaymentProcessing(false);
    }
  };

  if (step === 'payment') {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Complete Your Listing</h1>

          <div className="bg-surface rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-semibold mb-4">Listing Summary</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-text-secondary">Title:</span>{' '}
                <span className="font-medium">{title}</span>
              </div>
              <div>
                <span className="text-text-secondary">Category:</span>{' '}
                <span className="font-medium">{category}</span>
              </div>
              <div>
                <span className="text-text-secondary">Price:</span>{' '}
                <span className="font-medium">
                  {priceType === 'free' ? 'FREE' : `$${price}`}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Location:</span>{' '}
                <span className="font-medium">
                  {locationCity}, {locationState}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Photos:</span>{' '}
                <span className="font-medium">{photos.length} uploaded</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-semibold mb-4">🎉 Free Listing!</h2>
            <p className="text-text-secondary mb-4">
              Your listing is completely free! No payment required. This is a mock payment screen
              to demonstrate the flow. In production, premium features like featured listings would
              be available here.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">No charges • 100% Free</span>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-3">Want to boost your listing? (Optional)</h3>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" disabled className="mt-1" />
                  <div>
                    <div className="font-medium">Featured Listing - $2.99</div>
                    <div className="text-sm text-text-secondary">
                      Appear at the top of search results for 7 days
                    </div>
                  </div>
                </label>
                <p className="text-xs text-text-secondary italic pl-6">
                  Premium features coming soon!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('form')}
              disabled={paymentProcessing}
              className="flex-1 px-6 py-3 rounded-lg font-semibold border border-border hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              Back to Edit
            </button>
            <button
              onClick={handleMockPayment}
              disabled={paymentProcessing || uploadingPhotos || submitting}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {uploadingPhotos
                ? 'Uploading Photos...'
                : submitting
                ? 'Creating Listing...'
                : paymentProcessing
                ? 'Processing...'
                : 'Publish Listing'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create a Listing</h1>

        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beautiful Betta Fish - Blue/Red Halfmoon"
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item in detail..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={6}
              required
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="fish">Fish</option>
                <option value="plants">Plants</option>
                <option value="equipment">Equipment</option>
                <option value="full_setup">Full Setup</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="n/a">N/A (for livestock)</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>

          {/* Price Type & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Price Type <span className="text-red-500">*</span>
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as ListingPriceType)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="fixed">Fixed Price</option>
                <option value="negotiable">Negotiable</option>
                <option value="free">Free / Giveaway</option>
              </select>
            </div>

            {priceType !== 'free' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required={priceType !== 'free'}
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g., San Francisco"
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                placeholder="e.g., CA"
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <input
                type="text"
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-2">Photos (up to 10)</label>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group aspect-square">
                    <Image
                      src={photo.preview}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <label className="block w-full px-4 py-8 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-primary transition-colors">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm text-text-secondary">
                Click to upload photos (max 10, 10MB each)
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
                disabled={photos.length >= 10}
              />
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg font-semibold border border-border hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-shadow"
            >
              Continue to Review
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
