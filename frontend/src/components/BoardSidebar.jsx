import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderKanban, X, Trash2 } from 'lucide-react'
import { boardsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export default function BoardSidebar({ currentBoardId, onBoardSelect, onClose }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [deletingBoardId, setDeletingBoardId] = useState(null)

  // Fetch boards - only boards user has access to
  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await boardsAPI.getAll()
      return response.data
    },
  })

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: (data) => boardsAPI.create(data),
    onSuccess: async (response) => {
      // Wait for boards to be refetched before navigating
      await queryClient.invalidateQueries(['boards'])
      await queryClient.refetchQueries(['boards'])
      setIsCreating(false)
      setNewBoardName('')
      navigate(`/board/${response.data.id}`)
      if (onClose) onClose()
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId) => boardsAPI.delete(boardId),
    onSuccess: (_, deletedBoardId) => {
      setDeletingBoardId(null)
      
      // If we deleted the current board, navigate to a different board first
      if (Number(currentBoardId) === Number(deletedBoardId)) {
        const boards = queryClient.getQueryData(['boards'])
        if (boards && boards.length > 1) {
          // Find a different board to navigate to
          const nextBoard = boards.find(b => Number(b.id) !== Number(deletedBoardId))
          if (nextBoard) {
            navigate(`/board/${nextBoard.id}`)
          } else {
            navigate('/boards')
          }
        } else {
          navigate('/boards')
        }
      }
      
      // Invalidate queries after navigation to avoid race conditions
      queryClient.invalidateQueries(['boards'])
    },
  })

  const handleCreateBoard = (e) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    createBoardMutation.mutate({
      name: newBoardName.trim(),
    })
  }

  const handleDeleteClick = (e, boardId) => {
    e.stopPropagation()
    setDeletingBoardId(boardId)
  }

  const confirmDelete = () => {
    if (deletingBoardId) {
      deleteBoardMutation.mutate(deletingBoardId)
    }
  }

  const cancelDelete = () => {
    setDeletingBoardId(null)
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Boards</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Board List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Loading...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-8 px-4">
            <FolderKanban className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-400 mb-1">No boards yet</p>
            <p className="text-xs text-slate-500">Create your first board</p>
          </div>
        ) : (
          <div className="space-y-1">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative"
              >
                <button
                  onClick={() => onBoardSelect(board.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    Number(currentBoardId) === Number(board.id)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FolderKanban className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm flex-1">{board.name}</span>
                </button>
                
                {/* Delete button - only show for board creator */}
                {board.created_by === user?.id && (
                  <button
                    onClick={(e) => handleDeleteClick(e, board.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-600 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Delete board"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Section */}
      <div className="p-3 border-t border-slate-700 bg-slate-900">
        {isCreating ? (
          <form onSubmit={handleCreateBoard} className="space-y-2">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newBoardName.trim() || createBoardMutation.isPending}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createBoardMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setNewBoardName('')
                }}
                className="px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Board
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingBoardId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Board?</h3>
            <p className="text-sm text-slate-300 mb-6">
              This will permanently delete this board and all associated deals. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={deleteBoardMutation.isPending}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteBoardMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteBoardMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
