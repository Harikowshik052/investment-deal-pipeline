import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dealsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react'
import { formatDateTime } from '../lib/utils'

export default function VoteSection({ dealId }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [voteType, setVoteType] = useState('approve')
  const [voteComment, setVoteComment] = useState('')

  // Fetch votes
  const { data: votes = [] } = useQuery({
    queryKey: ['votes', dealId],
    queryFn: async () => {
      const response = await dealsAPI.getVotes(dealId)
      return response.data
    },
  })

  // Submit vote mutation
  const voteMutation = useMutation({
    mutationFn: () => dealsAPI.vote(dealId, voteType, voteComment || null),
    onSuccess: () => {
      queryClient.invalidateQueries(['votes', dealId])
      setVoteComment('')
    },
  })

  const handleSubmitVote = (e) => {
    e.preventDefault()
    voteMutation.mutate()
  }

  const userVote = votes.find((v) => v.user_id === user?.id)
  const approveCount = votes.filter((v) => v.vote === 'approve').length
  const declineCount = votes.filter((v) => v.vote === 'decline').length

  return (
    <div className="space-y-6">
      {/* Vote Summary */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Vote Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="text-green-400" size={24} />
              <span className="font-semibold text-green-400">Approve</span>
            </div>
            <div className="text-3xl font-bold text-white">{approveCount}</div>
          </div>

          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="text-red-400" size={24} />
              <span className="font-semibold text-red-400">Decline</span>
            </div>
            <div className="text-3xl font-bold text-white">{declineCount}</div>
          </div>
        </div>
      </div>

      {/* Cast Vote */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {userVote ? 'Update Your Vote' : 'Cast Your Vote'}
        </h2>

        <form onSubmit={handleSubmitVote} className="space-y-4">
          {/* Vote Type */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setVoteType('approve')}
              className={`flex-1 p-4 rounded-lg border-2 transition ${
                voteType === 'approve'
                  ? 'border-green-500 bg-green-900/30 text-green-400'
                  : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
              }`}
            >
              <ThumbsUp size={32} className="mx-auto mb-2" />
              <div className="font-semibold">Approve</div>
            </button>

            <button
              type="button"
              onClick={() => setVoteType('decline')}
              className={`flex-1 p-4 rounded-lg border-2 transition ${
                voteType === 'decline'
                  ? 'border-red-500 bg-red-900/30 text-red-400'
                  : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
              }`}
            >
              <ThumbsDown size={32} className="mx-auto mb-2" />
              <div className="font-semibold">Decline</div>
            </button>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={voteComment}
              onChange={(e) => setVoteComment(e.target.value)}
              placeholder="Add reasoning for your vote..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={voteMutation.isPending}
            className="w-full btn btn-primary"
          >
            {voteMutation.isPending
              ? 'Submitting...'
              : userVote
              ? 'Update Vote'
              : 'Submit Vote'}
          </button>
        </form>
      </div>

      {/* All Votes */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">All Votes ({votes.length})</h2>
        <div className="space-y-3">
          {votes.map((v) => (
            <div
              key={v.id}
              className={`p-4 rounded-lg border ${
                v.vote === 'approve'
                  ? 'bg-green-900/10 border-green-700'
                  : 'bg-red-900/10 border-red-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  {v.vote === 'approve' ? (
                    <ThumbsUp size={18} className="text-green-400" />
                  ) : (
                    <ThumbsDown size={18} className="text-red-400" />
                  )}
                  <span className="font-medium text-white">{v.user.full_name}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {formatDateTime(v.created_at)}
                </span>
              </div>
              {v.comment && (
                <p className="text-sm text-slate-300 ml-6">{v.comment}</p>
              )}
            </div>
          ))}

          {votes.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No votes yet. Be the first to vote!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
