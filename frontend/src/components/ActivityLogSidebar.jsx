import { X, Activity, ArrowRight, User, Calendar, FileText } from 'lucide-react'
import { formatDate } from '../lib/utils'

const getActivityIcon = (type) => {
  switch (type) {
    case 'stage_change':
      return <ArrowRight size={16} className="text-blue-400" />
    case 'created':
      return <FileText size={16} className="text-green-400" />
    case 'updated':
      return <Activity size={16} className="text-amber-400" />
    default:
      return <Activity size={16} className="text-slate-400" />
  }
}

const getStageColor = (stage) => {
  const colors = {
    sourced: 'text-cyan-400',
    screen: 'text-purple-400',
    diligence: 'text-amber-400',
    ic: 'text-orange-400',
    invested: 'text-emerald-400',
    passed: 'text-slate-400',
  }
  return colors[stage?.toLowerCase()] || 'text-slate-400'
}

export default function ActivityLogSidebar({ isOpen, onClose, activities = [] }) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20">
              <Activity className="text-blue-400" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Activity Log</h2>
              <p className="text-xs text-slate-400">{activities.length} activities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Activities */}
        <div className="flex-1 overflow-y-auto p-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Activity className="text-slate-600" size={32} />
              </div>
              <p className="text-slate-400 mb-2">No activity yet</p>
              <p className="text-sm text-slate-500">Activity will appear here when deals are created or moved</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div 
                  key={activity.id || index}
                  className="relative pl-6 pb-2 last:pb-0 group"
                >
                  {/* Timeline Line */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-700 group-hover:bg-blue-500/30 transition-colors" />
                  )}

                  {/* Icon */}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-blue-500/50 transition-colors">
                    {getActivityIcon(activity.action_type)}
                  </div>

                  {/* Content */}
                  <div className="bg-slate-800/50 rounded-lg p-2.5 hover:bg-slate-800 transition-all border border-slate-700/50 hover:border-slate-600">
                    <p className="text-xs text-slate-300 mb-1">
                      <span className="font-semibold text-white">{activity.user?.full_name || 'User'}</span>
                      {' '}
                      <span className="text-slate-400">{activity.description || activity.action_type}</span>
                    </p>

                    {/* Stage Change Details */}
                    {activity.action_type === 'stage_change' && activity.metadata && (
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className={`font-semibold ${getStageColor(activity.metadata.from_stage)}`}>
                          {activity.metadata.from_stage}
                        </span>
                        <ArrowRight size={14} className="text-slate-500" />
                        <span className={`font-semibold ${getStageColor(activity.metadata.to_stage)}`}>
                          {activity.metadata.to_stage}
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={11} />
                      <span>{formatDate(activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
