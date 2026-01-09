import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import DealCard from './DealCard'
import { getStageColor } from '../lib/utils'

export default function KanbanColumn({ stage, deals, totalDeals }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  const stageColor = getStageColor(stage)

  const stageIcons = {
    'Sourced': '📥',
    'Screen': '🔍',
    'Diligence': '📊',
    'IC': '💼',
    'Invested': '✅',
    'Passed': '❌'
  }

  return (
    <div className="kanban-column flex flex-col h-full">
      {/* Column Header - Dark Theme */}
      <div className="mb-3 pb-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{stageIcons[stage]}</span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              {stage}
            </h2>
          </div>
          <span className="bg-slate-700/70 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-md min-w-[28px] text-center">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2.5 min-h-[500px] p-1 rounded-lg transition-all ${
          isOver ? 'bg-slate-800/30 ring-2 ring-blue-500/50 shadow-lg' : ''
        }`}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-600 text-xs border-2 border-dashed border-slate-700/50 rounded-lg">
            <span>Drop deals here</span>
          </div>
        )}
      </div>
    </div>
  )
}
