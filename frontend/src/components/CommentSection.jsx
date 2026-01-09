import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dealsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { useBoardStore } from '../stores/boardStore'
import { Send, MessageSquare } from 'lucide-react'
import { formatDateTime } from '../lib/utils'

export default function CommentSection({ dealId }) {
  const { user } = useAuthStore()
  const { currentBoard } = useBoardStore()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const textareaRef = useRef(null)

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', dealId],
    queryFn: async () => {
      const response = await dealsAPI.getComments(dealId)
      return response.data
    },
  })

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content) => dealsAPI.addComment(dealId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', dealId])
      setComment('')
    },
  })

  // Get board members for mentions
  const boardMembers = currentBoard?.members || []
  
  // Filter members based on mention search
  const filteredMembers = boardMembers.filter(member =>
    member.full_name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  // Handle textarea change and detect @ mentions
  const handleCommentChange = (e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    
    setComment(value)
    
    // Check if @ was typed
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Check if there's a space after @ (which would close the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentions(true)
        setMentionSearch(textAfterAt)
        setMentionPosition(lastAtIndex)
        setSelectedMentionIndex(0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Insert mention
  const insertMention = (member) => {
    const beforeMention = comment.substring(0, mentionPosition)
    const afterMention = comment.substring(textareaRef.current.selectionStart)
    const newComment = `${beforeMention}@${member.full_name} ${afterMention}`
    
    setComment(newComment)
    setShowMentions(false)
    setMentionSearch('')
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = mentionPosition + member.full_name.length + 2
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle keyboard navigation in mentions dropdown
  const handleKeyDown = (e) => {
    if (!showMentions) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedMentionIndex(prev => 
        prev < filteredMembers.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Enter' && filteredMembers.length > 0) {
      e.preventDefault()
      insertMention(filteredMembers[selectedMentionIndex])
    } else if (e.key === 'Escape') {
      setShowMentions(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (comment.trim()) {
      addCommentMutation.mutate(comment)
    }
  }

  // Render comment with highlighted mentions
  const renderCommentWithMentions = (text) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      // Add mention with styling
      parts.push(
        <span key={match.index} className="text-blue-400 font-medium">
          @{match[1]}
        </span>
      )
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
        <MessageSquare size={24} />
        <span>Comments ({comments.length})</span>
      </h2>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={comment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment... (Type @ to mention someone)"
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              {/* Mentions Dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs text-slate-400 px-2 py-1 mb-1">
                      Mention board member
                    </div>
                    {filteredMembers.map((member, index) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => insertMention(member)}
                        className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition-colors ${
                          index === selectedMentionIndex
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-medium">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{member.full_name}</div>
                          <div className="text-xs text-slate-400 truncate">{member.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!comment.trim() || addCommentMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors self-end"
            >
              <Send size={18} />
              <span>Post</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((c) => (
          <div
            key={c.id}
            className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-medium text-white">{c.user.full_name}</span>
              </div>
              <span className="text-xs text-slate-500">
                {formatDateTime(c.created_at)}
              </span>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">
              {renderCommentWithMentions(c.content)}
            </p>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  )
}
