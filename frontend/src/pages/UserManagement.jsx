import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { authAPI, boardsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { Plus, Trash2, X, UserPlus, FolderKanban } from 'lucide-react'
import { getRoleBadgeColor } from '../lib/utils'

export default function UserManagement() {
  const { user: currentUser } = useAuthStore()
  const { boardId } = useParams()
  const queryClient = useQueryClient()
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedBoardRole, setSelectedBoardRole] = useState('')  // Board-specific role

  // Fetch all boards
  const { data: boards = [] } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await boardsAPI.getAll()
      return response.data
    },
  })

  // Auto-select board from URL parameter
  useEffect(() => {
    if (boardId && boards.length > 0) {
      const boardIdNum = Number(boardId)
      const boardExists = boards.find(b => b.id === boardIdNum)
      if (boardExists) {
        setSelectedBoardId(boardIdNum)
      }
    }
  }, [boardId, boards])

  // Fetch all users (for adding to boards)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await authAPI.getUsers()
      return response.data
    },
  })

  // Get selected board details
  const selectedBoard = boards.find(b => b.id === selectedBoardId)
  const boardMembers = selectedBoard?.members || []

  // Get current user's board role
  const currentUserBoardRole = selectedBoard?.members?.find(m => m.id === currentUser?.id)?.board_role
  const isCurrentUserAdmin = currentUserBoardRole === 'ADMIN'

  // Get users not in the current board
  const availableUsers = allUsers.filter(
    user => !boardMembers.some(member => member.id === user.id)
  )

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ boardId, userId, role }) => boardsAPI.addMember(boardId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['boards'])
      setIsAddMemberModalOpen(false)
      setSelectedUserId('')
      setSelectedBoardRole('')
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ boardId, userId }) => boardsAPI.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['boards'])
    },
  })

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!selectedUserId || !selectedBoardId) return

    addMemberMutation.mutate({
      boardId: selectedBoardId,
      userId: parseInt(selectedUserId),
      role: selectedBoardRole || null  // Send null if no role selected
    })
  }

  const handleRemoveMember = (userId) => {
    if (!selectedBoardId) return
    if (confirm('Are you sure you want to remove this user from the board?')) {
      removeMemberMutation.mutate({
        boardId: selectedBoardId,
        userId
      })
    }
  }

  const handleDelete = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
      {/* Header with Board Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">Board Members Management</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-400">Board:</label>
            <select
              value={selectedBoardId || ''}
              onChange={(e) => setSelectedBoardId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[250px]"
            >
              <option value="">-- Select a Board --</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name} ({board.members?.length || 0} members)
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-slate-400">Manage users for each board</p>
      </div>

      {/* No Board Selected */}
      {!selectedBoardId && (
        <div className="text-center py-32">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Board Selected</h3>
          <p className="text-slate-400">Select a board to manage its members</p>
        </div>
      )}

      {/* Board Members */}
      {selectedBoardId && selectedBoard && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedBoard.name}</h2>
              <p className="text-sm text-slate-400">{boardMembers.length} member{boardMembers.length !== 1 ? 's' : ''}</p>
            </div>
            {isCurrentUserAdmin && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <UserPlus size={18} />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Members Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Board Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {boardMembers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {user.full_name}
                        {user.id === selectedBoard.created_by && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Creator</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.board_role ? (
                        <span className={`px-3 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.board_role)}`}>
                          {user.board_role}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No board role</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isCurrentUserAdmin && user.id !== selectedBoard.created_by && (
                        <button
                          onClick={() => handleRemoveMember(user.id)}
                          className="text-red-400 hover:text-red-300 transition"
                          title="Remove from board"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {boardMembers.length === 0 && (
              <div className="text-center py-16 text-slate-400">No members in this board</div>
            )}
          </div>
        </>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full border border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Add Member to Board</h2>
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false)
                  setSelectedUserId('')
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select User --</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="mt-2 text-sm text-slate-400">All users are already members of this board</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Board Role (Optional)
                </label>
                <select
                  value={selectedBoardRole}
                  onChange={(e) => setSelectedBoardRole(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- No Board Role --</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="PARTNER">Partner</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Leave empty for read-only access
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMemberModalOpen(false)
                    setSelectedUserId('')
                    setSelectedBoardRole('')
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserId}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
