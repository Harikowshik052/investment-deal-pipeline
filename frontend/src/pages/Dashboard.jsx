import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus, Activity, Users, FolderKanban, Menu } from 'lucide-react'
import { dealsAPI, boardsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { useBoardStore } from '../stores/boardStore'
import { DEAL_STAGES } from '../lib/constants'
import KanbanColumn from '../components/KanbanColumn'
import DealCard from '../components/DealCard'
import CreateDealModal from '../components/CreateDealModal'
import ActivityLogSidebar from '../components/ActivityLogSidebar'
import BoardSidebar from '../components/BoardSidebar'

export default function Dashboard() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setCurrentBoard } = useBoardStore()
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const currentBoardId = boardId ? Number(boardId) : null

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after moving 8px
      },
    })
  )

  // Fetch boards
  const { data: boards = [], refetch: refetchBoards } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await boardsAPI.getAll()
      return response.data
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })
  // Get current board details
  const currentBoard = boards.find(b => b.id === currentBoardId)

  // Refetch boards when currentBoardId changes to ensure fresh role data
  useEffect(() => {
    if (currentBoardId) {
      refetchBoards()
    }
  }, [currentBoardId, refetchBoards])

  // Set default board on first load or redirect if no board ID in URL
  useEffect(() => {
    if (boards.length > 0 && !currentBoardId) {
      const defaultBoard = boards.find(b => b.is_default) || boards[0]
      navigate(`/board/${defaultBoard.id}`, { replace: true })
    } else if (boards.length === 0 && currentBoardId) {
      // If all boards deleted, go back to /boards route
      navigate('/boards', { replace: true })
    }
  }, [boards, currentBoardId, navigate])

  // Access control: Check if user has access to the current board
  useEffect(() => {
    if (currentBoardId && currentBoard && boards.length > 0) {
      const hasAccess = boards.some(b => b.id === currentBoardId)
      if (!hasAccess) {
        // User doesn't have access to this board, redirect to their default board
        const defaultBoard = boards.find(b => b.is_default) || boards[0]
        navigate(`/board/${defaultBoard.id}`, { replace: true })
      }
    }
  }, [currentBoardId, currentBoard, boards, navigate])
  
  // Update board store when current board changes
  useEffect(() => {
    setCurrentBoard(currentBoard || null)
  }, [currentBoard, setCurrentBoard])

  // Fetch deals for current board
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', currentBoardId],
    queryFn: async () => {
      if (!currentBoardId) return []
      const response = await dealsAPI.getAll(currentBoardId)
      return response.data
    },
    enabled: !!currentBoardId,
  })

  // Fetch all activities for current board
  const { data: allActivities = [] } = useQuery({
    queryKey: ['activities', currentBoardId],
    queryFn: async () => {
      // Fetch activities for all deals in current board
      const activitiesPromises = deals.map(async (deal) => {
        try {
          const response = await dealsAPI.getActivities(deal.id)
          return response.data.map(activity => ({
            ...activity,
            deal_name: deal.name
          }))
        } catch (error) {
          return []
        }
      })
      const activitiesArrays = await Promise.all(activitiesPromises)
      return activitiesArrays.flat().sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
    },
    enabled: deals.length > 0 && !!currentBoardId,
  })

  // Update deal mutation with optimistic update
  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => dealsAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['deals', currentBoardId])

      // Snapshot previous value
      const previousDeals = queryClient.getQueryData(['deals', currentBoardId])

      // Optimistically update to the new value
      queryClient.setQueryData(['deals', currentBoardId], (old) =>
        old?.map((deal) =>
          deal.id === id ? { ...deal, ...data } : deal
        )
      )

      // Return context with snapshot
      return { previousDeals }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', currentBoardId], context.previousDeals)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['deals', currentBoardId])
    },
  })

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: (data) => dealsAPI.create({ ...data, board_id: currentBoardId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals', currentBoardId])
      setIsCreateModalOpen(false)
    },
  })

  // Group deals by stage
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => deal.stage === stage)
    return acc
  }, {})

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const dealId = active.id
    const newStage = over.id

    // Find the deal being dragged
    const deal = deals.find((d) => d.id === dealId)
    
    if (!deal || deal.stage === newStage) return

    // Update the deal's stage
    updateDealMutation.mutate({
      id: dealId,
      data: { stage: newStage },
    })
  }

  // Get active deal for drag overlay
  const activeDeal = deals.find((deal) => deal.id === activeId)

  // Get current user's board role
  const currentUserBoardRole = currentBoard?.members?.find(m => m.id === user?.id)?.board_role

  // Check if user can create deals (Admin or Analyst board role)
  const canCreateDeal = currentUserBoardRole === 'ADMIN' || currentUserBoardRole === 'ANALYST'

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        {/* Top Navigation Bar - Dark Theme - Fixed at top */}
        <div className="mb-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {currentBoard?.name || 'No Board Selected'}
                </h1>
                <span className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-md">
                  {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {/* Activity Log Button */}
              <button
                onClick={() => setIsActivityLogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-600 hover:border-slate-500"
              >
                <Activity size={18} />
                <span className="font-medium text-sm">Activity</span>
              </button>

              {/* Users Management Button - Only for board admins */}
              {currentUserBoardRole === 'ADMIN' && currentBoardId && (
                <button
                  onClick={() => navigate(`/board/${currentBoardId}/users`)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-600 hover:border-slate-500"
                >
                  <Users size={18} />
                  <span className="font-medium text-sm">Users</span>
                </button>
              )}

              {/* New Deal Button */}
              {canCreateDeal && currentBoardId && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <Plus size={18} />
                  <span className="text-sm">Create</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty State - No Board Selected or No Boards */}
        {!currentBoardId && boards.length === 0 && (
          <div className="text-center py-32">
            <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Boards Yet</h3>
            <p className="text-slate-400 mb-6">Create your first board to get started</p>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Open Sidebar to Create Board
            </button>
          </div>
        )}

        {!currentBoardId && boards.length > 0 && (
          <div className="text-center py-32">
            <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Board Selected</h3>
            <p className="text-slate-400 mb-6">Select a board from the sidebar</p>
          </div>
        )}

        {/* Kanban Board - Only show when board is selected */}
        {currentBoardId && (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {DEAL_STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    deals={dealsByStage[stage] || []}
                    totalDeals={deals.length}
                  />
                ))}
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeDeal ? <DealCard deal={activeDeal} /> : null}
              </DragOverlay>
            </DndContext>

            {/* Empty State - No Deals */}
            {deals.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-400 mb-4">No deals yet. Create your first deal!</p>
                {canCreateDeal && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create First Deal
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Create Deal Modal */}
        <CreateDealModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createDealMutation.mutate(data)}
        />

        {/* Activity Log Sidebar */}
        <ActivityLogSidebar
          isOpen={isActivityLogOpen}
          onClose={() => setIsActivityLogOpen(false)}
          activities={allActivities}
        />
      </div>

      {/* Board Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full z-50">
            <BoardSidebar
              currentBoardId={currentBoardId}
              onBoardSelect={(boardId) => navigate(`/board/${boardId}`)}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}
