import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dealsAPI, memosAPI, boardsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, FileText, History } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../lib/utils'
import ICMemoEditor from '../components/ICMemoEditor'
import CommentSection from '../components/CommentSection'
import VoteSection from '../components/VoteSection'

export default function DealDetail() {
  const { boardId, id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('memo')

  // Fetch board details to get user's board role
  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!boardId) return null
      const response = await boardsAPI.getOne(boardId)
      return response.data
    },
    enabled: !!boardId,
  })

  // Fetch deal details
  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const response = await dealsAPI.getOne(id)
      return response.data
    },
  })

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      const response = await dealsAPI.getActivities(id)
      return response.data
    },
  })

  // Delete deal mutation - MUST be before early returns
  const deleteDealMutation = useMutation({
    mutationFn: () => dealsAPI.delete(id),
    onSuccess: () => {
      navigate(`/board/${boardId}`)
    },
  })

  const handleDelete = () => {
    if (deal && window.confirm(`Are you sure you want to delete "${deal.name}"? This action cannot be undone.`)) {
      deleteDealMutation.mutate()
    }
  }

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading deal details...</div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Deal not found</p>
        <button onClick={() => navigate(boardId ? `/board/${boardId}` : '/boards')} className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-4">
          Back to Dashboard
        </button>
      </div>
    )
  }

  // Get current user's board role
  const currentUserBoardRole = board?.members?.find(m => m.id === user?.id)?.board_role

  const canEditMemo = currentUserBoardRole === 'ADMIN' || currentUserBoardRole === 'ANALYST'
  const canVote = currentUserBoardRole === 'ADMIN' || currentUserBoardRole === 'PARTNER'

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(boardId ? `/board/${boardId}` : '/boards')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{deal.name}</h1>
            {deal.company_url && (
              <a
                href={deal.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {deal.company_url}
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                {deal.stage}
              </div>
              {deal.status !== 'active' && (
                <div
                  className={`px-3 py-2 rounded font-medium ${
                    deal.status === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {deal.status}
                </div>
              )}
            </div>
            {(user?.role === 'admin' || user?.id === deal.owner_id) && (
              <button
                onClick={handleDelete}
                disabled={deleteDealMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {deleteDealMutation.isPending ? 'Deleting...' : 'Delete Deal'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deal Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Round</div>
          <div className="text-lg font-semibold text-white">{deal.round || '-'}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Check Size</div>
          <div className="text-lg font-semibold text-green-400">
            {formatCurrency(deal.check_size)}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Owner</div>
          <div className="text-lg font-semibold text-white">{deal.owner.full_name}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Created</div>
          <div className="text-sm font-medium text-white">
            {formatDateTime(deal.created_at)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('memo')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'memo'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <FileText size={18} className="inline mr-2" />
          IC Memo
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'comments'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <MessageSquare size={18} className="inline mr-2" />
          Comments
        </button>
        {canVote && (
          <button
            onClick={() => setActiveTab('vote')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === 'vote'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <ThumbsUp size={18} className="inline mr-2" />
            Vote
          </button>
        )}
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'activity'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <History size={18} className="inline mr-2" />
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'memo' && (
          <ICMemoEditor dealId={id} canEdit={canEditMemo} />
        )}

        {activeTab === 'comments' && <CommentSection dealId={id} />}

        {activeTab === 'vote' && canVote && <VoteSection dealId={id} />}

        {activeTab === 'activity' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 pb-4 border-b border-slate-700 last:border-0"
                >
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-slate-300">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-slate-400 text-center py-8">No activity yet</p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
