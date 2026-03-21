import { formatDistanceToNow } from 'date-fns'

function timeAgo(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

const typeColors = {
  booking:   'bg-blue-100 text-blue-700',
  payment:   'bg-green-100 text-green-700',
  review:    'bg-purple-100 text-purple-700',
  complaint: 'bg-red-100 text-red-700',
  hostel:    'bg-orange-100 text-orange-700',
  user:      'bg-gray-100 text-gray-700',
  system:    'bg-yellow-100 text-yellow-700',
}

export default function ActivityFeed({ activities = [], title = 'Recent Activity', maxItems = 8 }) {
  const items = activities.slice(0, maxItems)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No recent activity</p>
      ) : (
        <div className="space-y-0">
          {items.map((item, i) => (
            <div
              key={item.id || item._id || i}
              className="flex items-start gap-3 py-3 border-b last:border-b-0 border-gray-50"
            >
              {/* Icon / Avatar */}
              <div className="flex-shrink-0 mt-0.5">
                {item.icon ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeColors[item.type] || typeColors.system}`}>
                    <item.icon size={14} />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeColors[item.type] || typeColors.system}`}>
                    <span className="text-[10px] font-bold uppercase">{(item.type || 'S')[0]}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  {item.user && <span className="font-semibold">{item.user} </span>}
                  {item.message}
                </p>
                {item.detail && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{item.detail}</p>
                )}
              </div>

              {/* Time */}
              <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                {item.time ? timeAgo(item.time) : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
