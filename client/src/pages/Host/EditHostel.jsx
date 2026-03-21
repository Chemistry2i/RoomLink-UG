import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, X, Building2, MapPin, FileText, DollarSign, Image } from 'lucide-react'
import { DashboardLayout } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { hostSidebarItems } from '../../config/sidebarItems'
import LocationPicker from '../../components/LocationPicker'

const AMENITIES = [
  'WiFi', 'Parking', 'Laundry', 'Kitchen', 'Security', 'CCTV',
  'Study Room', 'Common Area', 'Hot Water', 'Backup Power',
  'Gym', 'Swimming Pool', 'Air Conditioning', 'TV Room',
  'Lounge', 'Garden', 'AC', 'Breakfast Included',
  'Pet Friendly', 'Wheelchair Friendly', 'Library', 'Game Room',
]

export default function EditHostel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateHostel, loading } = useHostelStore()

  const [form, setForm] = useState({
    name: '', description: '', street: '', city: '',
    state: '', country: 'Uganda',
    contactPhone: '', contactEmail: '',
    priceRange: { min: '', max: '' },
    amenities: [],
  })
  const [coordinates, setCoordinates] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const { data } = await api.get(`/hostels/${id}`)
        const h = data.data
        setForm({
          name: h.name || '',
          description: h.description || '',
          street: h.address?.street || '',
          city: h.address?.city || '',
          state: h.address?.state || '',
          country: h.address?.country || 'Uganda',
          contactPhone: h.contactPhone || '',
          contactEmail: h.contactEmail || '',
          priceRange: h.priceRange || { min: '', max: '' },
          amenities: h.amenities || [],
        })
        if (h.coordinates?.coordinates) {
          setCoordinates(h.coordinates.coordinates)
        }
        setExistingImages(h.images || [])
      } catch {
        toast.error('Failed to load hostel details')
        navigate('/host/hostels')
      } finally {
        setFetchLoading(false)
      }
    }
    fetchHostel()
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('priceRange.')) {
      const key = name.split('.')[1]
      setForm({ ...form, priceRange: { ...form.priceRange, [key]: value } })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const total = existingImages.length + newImages.length + files.length
    if (total > 8) return alert('Maximum 8 images allowed')
    setNewImages([...newImages, ...files])
    setNewPreviews([...newPreviews, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index])
    setNewImages(newImages.filter((_, i) => i !== index))
    setNewPreviews(newPreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('description', form.description)
    formData.append('address', JSON.stringify({
      street: form.street,
      city: form.city,
      state: form.state,
      country: form.country,
    }))
    if (coordinates) {
      formData.append('coordinates', JSON.stringify({
        type: 'Point',
        coordinates: coordinates,
      }))
    }
    formData.append('contactPhone', form.contactPhone)
    formData.append('contactEmail', form.contactEmail)
    formData.append('priceRange', JSON.stringify({
      min: Number(form.priceRange.min),
      max: Number(form.priceRange.max),
    }))
    formData.append('amenities', JSON.stringify(form.amenities))
    formData.append('existingImages', JSON.stringify(existingImages))
    newImages.forEach((img) => formData.append('images', img))

    const result = await updateHostel(id, formData)
    if (result) {
      navigate('/host/hostels')
    }
  }

  if (fetchLoading) {
    return (
      <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Hostel</h1>
        <p className="text-sm text-gray-500 mb-6">Update your hostel listing details</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-gray-500" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none" required />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-gray-500" />
              Location & Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input type="text" name="street" value={form.street} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
                <input type="text" name="state" value={form.state} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" name="country" value={form.country} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" required />
              </div>
            </div>

            {/* Map Picker */}
            <LocationPicker
              value={coordinates}
              onChange={setCoordinates}
              className="mt-4"
            />
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-gray-500" />
              Pricing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input type="number" name="priceRange.min" value={form.priceRange.min} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input type="number" name="priceRange.max" value={form.priceRange.max} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-500" />
              Amenities
            </h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.amenities.includes(amenity)
                      ? 'bg-red-50 border-red-300 text-red-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Image size={20} className="text-gray-500" />
              Images
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {existingImages.map((src, i) => (
                <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">NEW</div>
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {existingImages.length + newPreviews.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors">
                  <Upload size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate('/host/hostels')} className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-8 py-2.5 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
