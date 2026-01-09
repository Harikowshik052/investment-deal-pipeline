"""
Application-wide constants
"""

# Deal Stages - these represent the pipeline stages
DEAL_STAGES = {
    "SOURCED": "Sourced",
    "SCREEN": "Screen",
    "DILIGENCE": "Diligence",
    "IC": "IC",
    "INVESTED": "Invested",
    "PASSED": "Passed"
}

# Default deal colors by stage
DEAL_COLORS = {
    "Sourced": "#10B981",      # Green
    "Screen": "#3B82F6",       # Blue
    "Diligence": "#F59E0B",    # Amber
    "IC": "#8B5CF6",           # Purple
    "Invested": "#059669",     # Emerald
    "Passed": "#6B7280"        # Gray
}

# Default board name
DEFAULT_BOARD_NAME = "Main Board"

# Activity action templates
ACTIVITY_ACTIONS = {
    "CREATED": "created deal",
    "MOVED": "moved from {old_stage} to {new_stage}",
    "UPDATED": "updated deal details",
    "COMMENTED": "added a comment",
    "VOTED": "voted {vote}",
    "MEMO_CREATED": "created IC memo",
    "MEMO_UPDATED": "updated IC memo (v{version})"
}
