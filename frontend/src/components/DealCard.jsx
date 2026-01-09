import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate, getStageColor } from '../lib/utils'
import { Building2, DollarSign, Calendar, User, GripVertical } from 'lucide-react'

export default function DealCard({ deal }) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleCardClick = (e) => {
    // Don't navigate if clicking on the drag handle or external link
    if (e.target.closest('.drag-handle') || e.target.closest('a')) {
      return
    }
    navigate(`/board/${deal.board_id}/deal/${deal.id}`)
  }

  const stageColors = {
    sourced: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    screen: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    diligence: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
    ic: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    invested: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
    passed: 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
  }

  const stageBadgeColors = {
    sourced: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    screen: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    diligence: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ic: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    invested: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    passed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`relative bg-gradient-to-br ${stageColors[deal.stage] || stageColors.sourced} border backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group`}
    >
      {/* Drag Handle - Separate from card click */}
      <div 
        {...attributes}
        {...listeners}
        className="drag-handle absolute top-3 right-3 text-slate-500 group-hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-700/50 rounded"
      >
        <GripVertical size={16} />
      </div>

      {/* Deal Name */}
      <h3 className="font-bold text-white mb-1 pr-6 text-base">
        {deal.name}
      </h3>

      {/* Company URL */}
      {deal.company_url && (
        <a
          href={deal.company_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 mb-3 block truncate hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 {deal.company_url.replace('https://', '').replace('http://', '')}
        </a>
      )}

      {/* Round Badge */}
      {deal.round && (
        <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-3 border ${stageBadgeColors[deal.stage]}`}>
          {deal.round}
        </div>
      )}

      {/* Deal Details */}
      <div className="space-y-2.5 text-sm">
        {deal.check_size && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/20">
              <DollarSign size={14} className="text-emerald-400" />
            </div>
            <span className="font-bold text-emerald-300">
              {formatCurrency(deal.check_size)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-300">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-700/50">
            <User size={14} className="text-slate-400" />
          </div>
          <span className="text-xs">{deal.owner.full_name}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-700/50">
            <Calendar size={14} />
          </div>
          <span className="text-xs">{formatDate(deal.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
