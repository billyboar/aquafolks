'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Image from 'next/image'

type ListingCategory = 'fish' | 'plants' | 'equipment' | 'full_setup' | 'other'
type Condition = 'new' | 'used' | 'n/a'
type PriceType = 'fixed' | 'negotiable' | 'free'

interface PhotoPreview {
  url: string
  file?: File
  isExisting?: boolean
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ListingCategory>('fish')
  const [condition, setCondition] = useState<Condition>('n/a')
  const [priceType, setPriceType] = useState<PriceType>('fixed')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [existingPhotoIds, setExistingPhotoIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch existing listing data
  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3000/api/v1/marketplace/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch listing')
      return res.json()
    }
  })

  // Populate form when listing data loads
  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '')
      setDescription(listing.description || '')
      setCategory(listing.category || 'fish')
      setCondition(listing.condition || 'n/a')
      setPriceType(listing.price_type || 'fixed')
      setPrice(listing.price ? listing.price.toString() : '')
      setCity(listing.city || '')
      setState(listing.state || '')
      setCountry(listing.country || '')
      
      // Load existing photos
      if (listing.photos && listing.photos.length > 0) {
        const existingPhotos = listing.photos.map((photo: any) => ({
          url: photo.photo_url,
          isExisting: true
        }))
        setPhotos(existingPhotos)
        setExistingPhotoIds(listing.photos.map((photo: any) => photo.id))
      }
    }
  }, [listing])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (photos.length + files.length > 10) {
      alert('Maximum 10 photos allowed')
      return
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 10MB per photo.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotos(prev => [...prev, {
          url: event.target?.result as string,
          file,
          isExisting: false
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    if (photos[index].isExisting) {
      setExistingPhotoIds(prev => prev.filter((_, i) => i !== index))
    }
  }

  const uploadPhotosMutation = useMutation({
    mutationFn: async (newPhotos: File[]) => {
      const token = localStorage.getItem('token')
      const uploadedUrls: string[] = []

      for (const file of newPhotos) {
        const formData = new FormData()
        formData.append('photo', file)

        const res = await fetch('http://localhost:3000/api/v1/marketplace/upload-photo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })

        if (!res.ok) throw new Error('Photo upload failed')
        const data = await res.json()
        uploadedUrls.push(data.photo_url)
      }

      return uploadedUrls
    }
  })

  const updateListingMutation = useMutation({
    mutationFn: async (photoUrls: string[]) => {
      const token = localStorage.getItem('token')
      
      // Combine existing photo URLs with newly uploaded ones
      const existingPhotoUrls = photos
        .filter(p => p.isExisting)
        .map(p => p.url)
      
      const allPhotoUrls = [...existingPhotoUrls, ...photoUrls]

      const payload = {
        title,
        description,
        category,
        condition,
        price_type: priceType,
        price: priceType === 'free' ? null : parseFloat(price),
        city,
        state,
        country,
        photo_urls: allPhotoUrls
      }

      const res = await fetch(`http://localhost:3000/api/v1/marketplace/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update listing')
      }

      return res.json()
    },
    onSuccess: () => {
      router.push(`/marketplace/${listingId}`)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !description || !city || !state || !country) {
      alert('Please fill in all required fields')
      return
    }

    if (priceType !== 'free' && (!price || parseFloat(price) <= 0)) {
      alert('Please enter a valid price')
      return
    }

    if (photos.length === 0) {
      alert('Please add at least one photo')
      return
    }

    setLoading(true)

    try {
      // Upload only new photos
      const newPhotoFiles = photos
        .filter(p => !p.isExisting && p.file)
        .map(p => p.file!)

      let uploadedUrls: string[] = []
      if (newPhotoFiles.length > 0) {
        uploadedUrls = await uploadPhotosMutation.mutateAsync(newPhotoFiles)
      }

      await updateListingMutation.mutateAsync(uploadedUrls)
    } catch (error: any) {
      alert(error.message || 'Failed to update listing')
      setLoading(false)
    }
  }

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600 mx-auto mb-4"></div>
          <p className="text-cream-700">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream-700">Listing not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cream-900 mb-2">Edit Listing</h1>
          <p className="text-cream-600">Update your marketplace listing</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-cream-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                placeholder="e.g. Beautiful Blue Betta Fish"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-cream-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                placeholder="Describe your item in detail..."
                required
              />
            </div>

            {/* Category and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cream-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-cream-700 mb-2">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as Condition)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="n/a">N/A</option>
                </select>
              </div>
            </div>

            {/* Price Type and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cream-700 mb-2">
                  Price Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as PriceType)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                  required
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="free">Free</option>
                </select>
              </div>

              {priceType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-cream-700 mb-2">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                    placeholder="0.00"
                    required={priceType !== 'free'}
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-cream-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cream-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cream-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-cream-700 mb-2">
                Photos <span className="text-red-500">*</span> <span className="text-cream-500 font-normal">(Max 10, 10MB each)</span>
              </label>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-cream-100">
                        <Image
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-aqua-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 10 && (
                <label className="flex items-center justify-center w-full h-32 px-4 border-2 border-dashed border-cream-300 rounded-lg cursor-pointer hover:border-aqua-500 transition-colors">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-cream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-cream-600">Add Photos ({photos.length}/10)</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-cream-300 text-cream-700 rounded-lg hover:bg-cream-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-aqua-600 text-white rounded-lg hover:bg-aqua-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Updating...
                  </span>
                ) : (
                  'Update Listing'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
