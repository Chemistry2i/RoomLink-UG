import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation } from 'lucide-react'

// Fix default marker icon (leaflet issue with bundlers)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function LocationPicker({ value, onChange, className = '' }) {
  // value = [lng, lat], onChange receives [lng, lat]
  const defaultCenter = [0.3476, 32.5825] // Kampala [lat, lng]
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [locating, setLocating] = useState(false)

  const position = value ? [value[1], value[0]] : null // [lng,lat] → [lat,lng]

  const placeMarker = useCallback((lat, lng) => {
    if (!mapRef.current) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)
    }
  }, [])

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const center = position || defaultCenter
    const map = L.map(containerRef.current).setView(center, position ? 16 : 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    if (position) {
      markerRef.current = L.marker(position).addTo(map)
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      onChange([lng, lat])
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when value changes
  useEffect(() => {
    if (!mapRef.current) return
    if (position) {
      placeMarker(position[0], position[1])
      mapRef.current.flyTo(position, Math.max(mapRef.current.getZoom(), 15))
    }
  }, [value, position, placeMarker])

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        onChange([longitude, latitude])
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin size={14} className="inline mr-1" />
          Pin Location on Map *
        </label>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
        >
          <Navigation size={12} />
          {locating ? 'Locating...' : 'Use My Location'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: 280 }}
      />

      {position ? (
        <p className="text-xs text-gray-500 mt-1">
          Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)} — Click map to change
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">Click on the map to set your hostel's location</p>
      )}
    </div>
  )
}
