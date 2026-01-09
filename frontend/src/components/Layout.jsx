import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { boardsAPI } from '../lib/api'
import { LogOut, LayoutDashboard } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { boardId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Fetch all boards to check if user is admin on any board
  const { data: boards = [] } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await boardsAPI.getAll()
      return response.data
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  })

  // Get the current board based on URL
  const currentBoardId = boardId ? Number(boardId) : null
  const currentBoard = boards.find(b => b.id === currentBoardId)
  
  // Get current user's role on the current board (only when on a board page)
  const currentUserBoardRole = currentBoard?.members?.find(m => m.id === user?.id)?.board_role
  
  // Check if user is admin on any board (to show Users nav)
  const isAdminOnAnyBoard = boards.some(board => 
    board.members?.some(member => member.id === user?.id && member.board_role === 'ADMIN')
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header - Dark Theme */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-xl z-30 flex-shrink-0">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              {/* Logo/Brand */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white hidden sm:block">Investment Board</span>
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center gap-1">
                <Link
                  to="/boards"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  <span>Board</span>
                </Link>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user?.full_name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
                {currentUserBoardRole && (
                  <div className="text-xs text-blue-400 font-medium mt-0.5">
                    {currentUserBoardRole}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Dark Background */}
      <main className="flex-1 max-w-[1920px] mx-auto bg-slate-950 w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
