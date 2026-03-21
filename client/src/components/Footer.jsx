import { Github, Twitter, Facebook, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container-max py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* About */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-4">RoomLink</h3>
            <p className="text-gray-400 text-sm mb-4">
              Find your perfect hostel stay. Connect with travelers worldwide.
            </p>
            <div className="flex space-x-4">
              <Twitter size={18} className="cursor-pointer hover:text-red-500 transition" />
              <Facebook size={18} className="cursor-pointer hover:text-red-500 transition" />
              <Instagram size={18} className="cursor-pointer hover:text-red-500 transition" />
              <Github size={18} className="cursor-pointer hover:text-red-500 transition" />
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/complaints" className="hover:text-red-500 transition">Help Center</a></li>
              <li><a href="/complaints" className="hover:text-red-500 transition">Contact Us</a></li>
              <li><a href="/search" className="hover:text-red-500 transition">Safety</a></li>
              <li><a href="/complaints" className="hover:text-red-500 transition">Report Issue</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-red-500 transition">About</a></li>
              <li><a href="#" className="hover:text-red-500 transition">Blog</a></li>
              <li><a href="#" className="hover:text-red-500 transition">Careers</a></li>
              <li><a href="#" className="hover:text-red-500 transition">Press</a></li>
            </ul>
          </div>

          {/* For Hosts */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">For Hosts</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/register" className="hover:text-red-500 transition">Become a Host</a></li>
              <li><a href="/host/dashboard" className="hover:text-red-500 transition">Host Resources</a></li>
              <li><a href="/search" className="hover:text-red-500 transition">Pricing</a></li>
              <li><a href="/search" className="hover:text-red-500 transition">Community</a></li>
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Discover</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/search" className="hover:text-red-500 transition">Trending</a></li>
              <li><a href="/search?sort=rating" className="hover:text-red-500 transition">Top Rated</a></li>
              <li><a href="/search?priceMax=500000" className="hover:text-red-500 transition">Budget</a></li>
              <li><a href="/search?priceMin=1500000" className="hover:text-red-500 transition">Luxury</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm text-gray-400">
            <a href="#" className="hover:text-red-500 transition">Privacy Policy</a>
            <a href="#" className="hover:text-red-500 transition">Terms of Service</a>
            <a href="#" className="hover:text-red-500 transition">Cookie Policy</a>
            <a href="#" className="hover:text-red-500 transition">Accessibility</a>
          </div>
          <div className="border-t border-gray-800 pt-6 flex justify-between items-center">
            <p className="text-xs text-gray-500">&copy; 2026 RoomLink. All rights reserved.</p>
            <p className="text-xs text-gray-500">Made with ❤️ for travelers, by travelers</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
