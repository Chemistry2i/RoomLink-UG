import { Link } from 'react-router-dom'
import { Heart, MapPin, Star } from 'lucide-react'
import { useState } from 'react'

export default function HostelCard({ hostel }) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Link to={`/hostel/${hostel._id}`}>
      <div className="card cursor-pointer group">
        {/* Image */}
        <div className="relative overflow-hidden h-60 bg-gray-200">
          <img
            src={hostel.images?.[0]?.url || 'https://via.placeholder.com/300x240'}
            alt={hostel.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsFavorite(!isFavorite)
            }}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg"
          >
            <Heart
              size={20}
              className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">
              {hostel.name}
            </h3>
          </div>

          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin size={16} className="mr-1" />
            {hostel.city}, {hostel.country}
          </div>

          <div className="flex items-center gap-1 mb-3">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">
              {hostel.averageRating?.toFixed(1) || 'New'}
            </span>
            <span className="text-gray-600 text-sm">
              ({hostel.totalReviews || 0})
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">${hostel.minPrice || 15}</span>
            <span className="text-gray-600 text-sm">/night</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
