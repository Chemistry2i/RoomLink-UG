import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar({ items = [], header, collapsed: controlledCollapsed, onToggle }) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const location = useLocation()

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const toggle = onToggle || (() => setInternalCollapsed(!internalCollapsed))

  return (
    <aside
      className={`${
        collapsed ? 'w-[68px]' : 'w-64'
      } bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}
    >
      {/* Header */}
      {header && !collapsed && (
        <div className="px-5 py-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 truncate">{header}</h2>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          if (item.divider) {
            return (
              <div key={item.label} className="pt-4 pb-2">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {item.label}
                  </p>
                )}
                {collapsed && <div className="border-t border-gray-200 mx-2" />}
              </div>
            )
          }

          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-red-50 text-red-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              {Icon && <Icon size={20} className="flex-shrink-0" />}
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
