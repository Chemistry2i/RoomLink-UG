import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * WelcomeBanner — simple greeting card for dashboards.
 *
 * Props:
 *  - userName:  string
 *  - subtitle:  optional one-liner
 *  - action:    optional { label, to } single CTA
 *  - icon:      LucideIcon for the decorative background
 */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeBanner({
  userName = 'there',
  subtitle,
  action,
  icon: Icon,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-6 sm:p-8 mb-8">
      {/* Decorative background */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute top-3 right-4 opacity-[0.08]">
        {Icon && <Icon size={140} strokeWidth={1} />}
      </div>

      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
          {getGreeting()}, {userName?.split(' ')[0]}! 👋
        </h1>
        {subtitle && (
          <p className="text-white/80 text-sm sm:text-base max-w-lg">
            {subtitle}
          </p>
        )}

        {action && (
          <Link
            to={action.to}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            {action.label}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}
