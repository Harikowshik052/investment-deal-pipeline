/**
 * Application-wide constants
 */

// Deal stages - used for kanban columns
export const DEAL_STAGES = ['Sourced', 'Screen', 'Diligence', 'IC', 'Invested', 'Passed']

// Deal stage colors
export const STAGE_COLORS = {
  'Sourced': '#10B981',      // Green
  'Screen': '#3B82F6',       // Blue
  'Diligence': '#F59E0B',    // Amber
  'IC': '#8B5CF6',           // Purple
  'Invested': '#059669',     // Emerald
  'Passed': '#6B7280'        // Gray
}

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  PARTNER: 'partner'
}

// Deal statuses
export const DEAL_STATUSES = {
  ACTIVE: 'active',
  APPROVED: 'approved',
  DECLINED: 'declined'
}

// Activity action types
export const ACTIVITY_TYPES = {
  CREATED: 'created',
  MOVED: 'moved',
  UPDATED: 'updated',
  COMMENTED: 'commented',
  VOTED: 'voted',
  MEMO_CREATED: 'memo_created',
  MEMO_UPDATED: 'memo_updated'
}
