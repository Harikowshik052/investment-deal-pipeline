export function formatCurrency(amount) {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getStageColor(stage) {
  const colors = {
    Sourced: 'bg-cyan-500 border-cyan-400',
    Screen: 'bg-purple-500 border-purple-400',
    Diligence: 'bg-yellow-500 border-yellow-400',
    IC: 'bg-orange-500 border-orange-400',
    Invested: 'bg-green-500 border-green-400',
    Passed: 'bg-gray-500 border-gray-400',
  }
  return colors[stage] || 'bg-gray-500'
}

export function getRoleBadgeColor(role) {
  const colors = {
    admin: 'bg-red-600 text-white',
    analyst: 'bg-blue-600 text-white',
    partner: 'bg-purple-600 text-white',
  }
  return colors[role] || 'bg-gray-600 text-white'
}
