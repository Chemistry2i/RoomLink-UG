import { useEffect, useState } from 'react'
import { Search, Shield, Globe, Users, ArrowRight } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import HostelCard from '../components/HostelCard'
import api from '../config/api'
import toast from 'react-hot-toast'

export default function Home() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const { data } = await api.get('/hostels?limit=8')
        setHostels(data.data?.hostels || [])
      } catch (error) {
        toast.error('Failed to load hostels')
      } finally {
        setLoading(false)
      }
    }

    fetchHostels()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-500 to-red-600 text-white py-32">
        <div className="container-max">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              Explore the World, Stay Anywhere
            </h1>
            <p className="text-xl text-red-100">
              Find your perfect hostel and connect with travelers worldwide
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-5xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-center mb-12">Why RoomLink?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe size={32} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Global Network</h3>
              <p className="text-gray-600">Properties in 500+ cities worldwide</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Meet Travelers</h3>
              <p className="text-gray-600">Share experiences with guests from everywhere</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Secure Booking</h3>
              <p className="text-gray-600">Safe payments and verified hosts</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Easy Search</h3>
              <p className="text-gray-600">Find what you need in seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hostels */}
      <section className="bg-light py-16">
        <div className="container-max">
          <h2 className="text-4xl font-bold mb-4">Featured Hostels</h2>
          <p className="text-gray-600 mb-12">Discover our most popular accommodations</p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card h-96 bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.isArray(hostels) && hostels.map((hostel) => (
                <HostelCard key={hostel._id} hostel={hostel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container-max">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-16 px-8 rounded-2xl shadow-xl">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Become a Host</h2>
              <p className="text-xl text-red-100 mb-8">
                Share your space and earn money hosting travelers
              </p>
              <button className="bg-white text-red-500 px-8 py-3 rounded-full font-bold hover:bg-gray-100 hover:shadow-lg transition-all inline-flex items-center gap-2">
                Get Started
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
