from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Board, User, UserRole, board_members
from app.schemas import BoardCreate, BoardResponse, BoardUpdate, BoardMemberResponse
from app.auth import get_current_user
from app.constants import DEFAULT_BOARD_NAME

router = APIRouter(prefix="/boards", tags=["boards"])


def build_board_response(board: Board, db: Session) -> dict:
    """Build board response with proper member roles"""
    # Get all roles for this board
    role_query = db.query(
        board_members.c.user_id,
        board_members.c.role
    ).filter(
        board_members.c.board_id == board.id
    ).all()
    
    role_map = {user_id: role for user_id, role in role_query}
    print(f"\n🔧 Building response for board {board.id} - Role map: {role_map}")
    
    # Manually build member list with correct roles
    members_data = []
    for member in board.members:
        board_role = role_map.get(member.id)
        print(f"  👤 User {member.id} ({member.full_name}): board_role = {board_role}")
        members_data.append({
            'id': member.id,
            'email': member.email,
            'full_name': member.full_name,
            'board_role': board_role
        })
    
    return {
        'id': board.id,
        'name': board.name,
        'description': board.description,
        'created_by': board.created_by,
        'is_default': board.is_default,
        'created_at': board.created_at,
        'updated_at': board.updated_at,
        'members': members_data
    }


def get_user_board_role(user_id: int, board_id: int, db: Session) -> UserRole:
    """Get a user's role for a specific board"""
    stmt = db.query(board_members.c.role).filter(
        board_members.c.board_id == board_id,
        board_members.c.user_id == user_id
    ).first()
    return stmt[0] if stmt else None


@router.get("/", response_model=List[BoardResponse])
async def list_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all boards the current user has access to"""
    # Users see boards they created or are members of
    boards = db.query(Board).filter(
        (Board.created_by == current_user.id) | 
        (Board.members.any(User.id == current_user.id))
    ).all()
    
    # Build responses with proper board roles
    board_responses = [build_board_response(board, db) for board in boards]
    
    return board_responses


@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific board by ID"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user has access to this board
    has_access = (
        board.created_by == current_user.id or 
        current_user in board.members
    )
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this board"
        )
    
    # Build response with board roles
    return build_board_response(board, db)


@router.post("/", response_model=BoardResponse)
async def create_board(
    board_data: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new board"""
    # Create the board
    new_board = Board(
        name=board_data.name,
        description=board_data.description,
        created_by=current_user.id,
        is_default=False
    )
    
    db.add(new_board)
    db.commit()
    db.refresh(new_board)
    
    # Add creator as admin member of this board
    from app.models import board_members, UserRole
    stmt = board_members.insert().values(
        board_id=new_board.id,
        user_id=current_user.id,
        role=UserRole.ADMIN
    )
    db.execute(stmt)
    db.commit()
    db.refresh(new_board)
    
    # Build response with board roles
    return build_board_response(new_board, db)


@router.put("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: int,
    board_data: BoardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a board (only board admin can update)"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user has admin role for this board
    user_board_role = get_user_board_role(current_user.id, board_id, db)
    if user_board_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins can update this board"
        )
    
    # Update fields
    if board_data.name is not None:
        board.name = board_data.name
    if board_data.description is not None:
        board.description = board_data.description
    
    db.commit()
    db.refresh(board)
    
    # Build response with board roles
    return build_board_response(board, db)


@router.delete("/{board_id}")
async def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a board (only board admin can delete)"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user has admin role for this board
    user_board_role = get_user_board_role(current_user.id, board_id, db)
    if user_board_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins can delete this board"
        )
    
    db.delete(board)
    db.commit()
    
    return {"message": "Board deleted successfully"}


@router.post("/{board_id}/members/{user_id}")
async def add_board_member(
    board_id: int,
    user_id: int,
    role: UserRole = None,  # Optional board-specific role
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to a board with optional role (only board admin)"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user has admin role for this board
    user_board_role = get_user_board_role(current_user.id, board_id, db)
    if user_board_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins can add members"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a member
    if user in board.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this board"
        )
    
    # Add member with role
    from app.models import board_members
    stmt = board_members.insert().values(
        board_id=board_id,
        user_id=user_id,
        role=role  # Can be None
    )
    db.execute(stmt)
    db.commit()
    
    return {"message": f"User {user.full_name} added to board successfully"}


@router.delete("/{board_id}/members/{user_id}")
async def remove_board_member(
    board_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from a board (only board admin)"""
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check if user has admin role for this board
    user_board_role = get_user_board_role(current_user.id, board_id, db)
    if user_board_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only board admins can remove members"
        )
    
    # Prevent removing the creator
    if user_id == board.created_by:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the board creator"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user not in board.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this board"
        )
    
    board.members.remove(user)
    db.commit()
    
    return {"message": f"User {user.full_name} removed from board successfully"}
