import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Building2, MapPin, FileText, DollarSign, Image } from 'lucide-react'
import { DashboardLayout } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import { hostSidebarItems } from '../../config/sidebarItems'
import LocationPicker from '../../components/LocationPicker'

const AMENITIES = [
  'WiFi', 'Parking', 'Laundry', 'Kitchen', 'Security', 'CCTV',
  'Study Room', 'Common Area', 'Hot Water', 'Backup Power',
  'Gym', 'Swimming Pool', 'Air Conditioning', 'TV Room',
  'Lounge', 'Garden', 'AC', 'Breakfast Included',
  'Pet Friendly', 'Wheelchair Friendly', 'Library', 'Game Room',
]

export default function AddHostel() {
  const navigate = useNavigate()
  const { createHostel, loading } = useHostelStore()

  const [form, setForm] = useState({
    name: '',
    description: '',
    street: '',
    city: '',
    state: '',
    country: 'Uganda',
    contactPhone: '',
    contactEmail: '',
    priceRange: { min: '', max: '' },
    amenities: [],
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [coordinates, setCoordinates] = useState(null) // [lng, lat]

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
    if (images.length + files.length > 8) {
      return alert('Maximum 8 images allowed')
    }
    setImages([...images, ...files])
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setPreviews([...previews, ...newPreviews])
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index])
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
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
    formData.append('coordinates', JSON.stringify({
      type: 'Point',
      coordinates: coordinates || [32.5825, 0.3476],
    }))
    formData.append('contactPhone', form.contactPhone)
    formData.append('contactEmail', form.contactEmail)
    formData.append('priceRange', JSON.stringify({
      min: Number(form.priceRange.min),
      max: Number(form.priceRange.max),
    }))
    formData.append('amenities', JSON.stringify(form.amenities))
    images.forEach((img) => formData.append('images', img))

    const result = await createHostel(formData)
    if (result) {
      navigate('/host/hostels')
    }
  }

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Add New Hostel</h1>
        <p className="text-sm text-gray-500 mb-6">Fill in the details to list a new hostel</p>

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
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  required
                  placeholder="e.g., Sunrise Student Hostel"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                  required
                  placeholder="Describe your hostel, its location benefits, facilities..."
                />
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
                <input
                  type="text"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  required
                  placeholder="e.g., Plot 12 University Road"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  required
                  placeholder="e.g., Kampala"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="e.g., Central"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="Uganda"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  required
                  placeholder="+256 7XX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  required
                  placeholder="hostel@example.com"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (UGX/semester)</label>
                <input
                  type="number"
                  name="priceRange.min"
                  value={form.priceRange.min}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (UGX/semester)</label>
                <input
                  type="number"
                  name="priceRange.max"
                  value={form.priceRange.max}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="1500000"
                />
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
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {previews.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors">
                  <Upload size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400">Upload up to 8 images. First image will be the cover photo.</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/host/hostels')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-2.5 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Hostel'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
