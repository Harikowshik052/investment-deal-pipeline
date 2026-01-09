import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memosAPI } from '../lib/api'
import { Save, History, Eye, Edit } from 'lucide-react'
import { formatDateTime } from '../lib/utils'
import ReactMarkdown from 'react-markdown'

const SECTIONS = [
  { key: 'summary', label: 'Summary', placeholder: 'Brief overview of the opportunity...' },
  { key: 'market', label: 'Market', placeholder: 'Market size, trends, and dynamics...' },
  { key: 'product', label: 'Product', placeholder: 'Product description and differentiation...' },
  { key: 'traction', label: 'Traction', placeholder: 'Revenue, users, growth metrics...' },
  { key: 'risks', label: 'Risks', placeholder: 'Key risks and concerns...' },
  { key: 'open_questions', label: 'Open Questions', placeholder: 'Questions that need answers...' },
]

export default function ICMemoEditor({ dealId, canEdit }) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [viewingVersion, setViewingVersion] = useState(null)
  const [formData, setFormData] = useState({})

  // Fetch memo
  const { data: memo, isLoading } = useQuery({
    queryKey: ['memo', dealId],
    queryFn: async () => {
      const response = await memosAPI.getMemo(dealId)
      return response.data
    },
    onSuccess: (data) => {
      if (data.versions && data.versions.length > 0) {
        const latest = data.versions[0]
        setFormData({
          summary: latest.summary,
          market: latest.market,
          product: latest.product,
          traction: latest.traction,
          risks: latest.risks,
          open_questions: latest.open_questions,
        })
      }
    },
  })

  // Update memo mutation
  const updateMemoMutation = useMutation({
    mutationFn: (data) => memosAPI.updateMemo(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['memo', dealId])
      setIsEditing(false)
    },
  })

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateMemoMutation.mutate(formData)
  }

  const handleViewVersion = (version) => {
    setViewingVersion(version)
    setShowVersions(false)
  }

  const handleBackToCurrent = () => {
    setViewingVersion(null)
    if (memo?.versions?.[0]) {
      const latest = memo.versions[0]
      setFormData({
        summary: latest.summary,
        market: latest.market,
        product: latest.product,
        traction: latest.traction,
        risks: latest.risks,
        open_questions: latest.open_questions,
      })
    }
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading memo...</div>
  }

  const currentVersion = viewingVersion || memo?.versions?.[0]
  const displayData = viewingVersion || formData

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">IC Memo</h2>
          {currentVersion && (
            <p className="text-sm text-slate-400 mt-1">
              Version {currentVersion.version} • {formatDateTime(currentVersion.created_at)}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <History size={18} />
            <span>Versions ({memo?.versions?.length || 0})</span>
          </button>

          {canEdit && !viewingVersion && (
            <>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit size={18} />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMemoMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Save size={18} />
                    <span>{updateMemoMutation.isPending ? 'Saving...' : 'Save New Version'}</span>
                  </button>
                </div>
              )}
            </>
          )}

          {viewingVersion && (
            <button
              onClick={handleBackToCurrent}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back to Current
            </button>
          )}
        </div>
      </div>

      {/* Version History Panel */}
      {showVersions && (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <h3 className="font-semibold text-white mb-3">Version History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {memo?.versions?.map((version) => (
              <div
                key={version.id}
                className="flex justify-between items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                onClick={() => handleViewVersion(version)}
              >
                <div>
                  <div className="font-medium text-white">Version {version.version}</div>
                  <div className="text-xs text-slate-400">
                    {formatDateTime(version.created_at)}
                  </div>
                </div>
                <Eye size={18} className="text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viewing Old Version Banner */}
      {viewingVersion && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <p className="text-yellow-400 font-medium">
            📜 You are viewing Version {viewingVersion.version} (Read-Only)
          </p>
        </div>
      )}

      {/* Memo Sections */}
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.key} className="border-b border-slate-700 pb-8 last:border-0">
            <h3 className="text-xl font-bold text-white mb-4">{section.label}</h3>
            
            {isEditing && !viewingVersion ? (
              <textarea
                value={formData[section.key] || ''}
                onChange={(e) => handleChange(section.key, e.target.value)}
                placeholder={section.placeholder}
                rows={6}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            ) : (
              <div className="prose prose-slate prose-invert max-w-none">
                {displayData[section.key] ? (
                  <ReactMarkdown className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                    {displayData[section.key]}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic text-sm">{section.placeholder}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Supports Markdown formatting. Use **bold**, *italic*, # headings, and - lists
          </p>
        </div>
      )}
    </div>
  )
}
